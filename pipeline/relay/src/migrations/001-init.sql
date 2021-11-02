---------------------------------------------------------------------
-- migration script
-- create tables and views
---------------------------------------------------------------------

---------------------------------------------------------------------
-- EXTENSIONS
---------------------------------------------------------------------
-- add functions to postgres

-- timescale - makes hypertables for storing time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;


---------------------------------------------------------------------
-- TABLES
---------------------------------------------------------------------

---------------------------------------------------------------------
-- meta
---------------------------------------------------------------------
--. easier to have one row with columns per value?
-- eg a column for migration version? mebbe
CREATE TABLE IF NOT EXISTS meta (
  name text PRIMARY KEY,
  value jsonb
);

---------------------------------------------------------------------
-- nodes
---------------------------------------------------------------------
-- stores devices, dataitems
-- note: Adding a primary key will automatically create a unique B-tree index
-- on the column or group of columns listed in the primary key, and will force
-- the column(s) to be marked NOT NULL.
CREATE TABLE IF NOT EXISTS nodes (
  node_id SERIAL PRIMARY KEY,
  props jsonb
);
-- see https://stackoverflow.com/questions/17807030/how-to-create-index-on-json-field-in-postgres
CREATE INDEX IF NOT EXISTS nodes_type ON nodes ((props->>'type'));
CREATE UNIQUE INDEX IF NOT EXISTS nodes_path ON nodes ((props->>'path'));

---------------------------------------------------------------------
-- edges
---------------------------------------------------------------------
-- could store relations between nodes, 
-- but currently encoding that information in the node path
CREATE TABLE IF NOT EXISTS edges (
  from_id integer REFERENCES nodes,
  to_id integer REFERENCES nodes,
  props jsonb
);
CREATE INDEX IF NOT EXISTS edges_from_id ON edges (from_id);
CREATE INDEX IF NOT EXISTS edges_to_id ON edges (to_id);

---------------------------------------------------------------------
-- history
---------------------------------------------------------------------
-- stores data values
CREATE TABLE IF NOT EXISTS history (
  node_id integer REFERENCES nodes,
  dataitem_id integer REFERENCES nodes,
  time timestamptz NOT NULL,
  value jsonb -- can store numbers, strings, arrays, objects...
);
CREATE INDEX IF NOT EXISTS history_node_id ON history (node_id);

-- make hypertable and add compression/retention schedules
SELECT create_hypertable('history', 'time', if_not_exists => TRUE);
-- SELECT add_compression_policy('history', INTERVAL '1d', if_not_exists => TRUE);
-- SELECT add_retention_policy('history', INTERVAL '1 year', if_not_exists => TRUE);


---------------------------------------------------------------------
-- bins
---------------------------------------------------------------------

-- store data for metrics
CREATE TABLE IF NOT EXISTS bins (
  device_id integer REFERENCES nodes, -- node_id of a device
  time timestamptz NOT NULL, -- rounded down by minute, for now
  dimensions jsonb, -- incl hour, shift, plant, machine, etc
  values jsonb, -- incl timeActive, timeAvailable, partsGood, partsBad, etc
  PRIMARY KEY (device_id, time, dimensions)
);
-- make hypertable and add compression/retention schedules
SELECT create_hypertable('bins', 'time', if_not_exists => TRUE);
-- SELECT add_compression_policy('bins', INTERVAL '1d', if_not_exists => TRUE);
-- SELECT add_retention_policy('bins', INTERVAL '1 year', if_not_exists => TRUE);

---------------------------------------------------------------------
-- VIEWS
---------------------------------------------------------------------
-- delete the views in case the structure has changed
-- (will eventually have to use migrations for this)
DROP VIEW IF EXISTS dataitems;
DROP VIEW IF EXISTS devices;
DROP VIEW IF EXISTS history_text;
DROP VIEW IF EXISTS history_float;
DROP VIEW IF EXISTS history_all;
DROP VIEW IF EXISTS metrics;

---------------------------------------------------------------------
-- bins
---------------------------------------------------------------------
CREATE OR REPLACE VIEW metrics AS
SELECT 
  -- devices.props->>'name_uuid' AS device,
  devices.props->>'name' AS device,
  bins.time as "time",
  bins.dimensions as dimensions,
  bins.values as "values", -- a jsonb object
  -- coalesce returns the first non-null value (works like an OR operator),
  -- and nullif returns the first value, unless it equals 0.0, when it returns null -
  -- then the whole expression is null. avoids div by zero error.
  coalesce((values->>'time_active')::real,0) / 
    nullif((values->>'time_available')::real,0.0) as uptime
FROM bins
JOIN nodes AS devices ON bins.device_id=devices.node_id;

---------------------------------------------------------------------
-- history_all
---------------------------------------------------------------------
CREATE OR REPLACE VIEW history_all AS
SELECT 
  -- devices.props->>'name_uuid' AS device,
  devices.props->>'name' AS device,
  dataitems.props->>'path' AS path,
  history.time,
  history.value -- a jsonb object - need to cast it as in below views
FROM history
JOIN nodes AS devices ON history.node_id=devices.node_id
JOIN nodes AS dataitems ON history.dataitem_id=dataitems.node_id;

---------------------------------------------------------------------
-- history_float
---------------------------------------------------------------------
-- note: float is an alias for 'double precision' or float8
--. how handle UNDEFINED? should translate to null in relay eh?
CREATE OR REPLACE VIEW history_float AS
SELECT device, path, time, value::float
FROM history_all
WHERE jsonb_typeof(value) = 'number';

---------------------------------------------------------------------
-- history_text
---------------------------------------------------------------------
-- note: #>>'{}' extracts the top-level json string without enclosing double quotes
-- see https://dba.stackexchange.com/questions/207984/unquoting-json-strings-print-json-strings-without-quotes
CREATE OR REPLACE VIEW history_text AS
SELECT device, path, time, value#>>'{}' as value
FROM history_all
WHERE jsonb_typeof(value) = 'string';

---------------------------------------------------------------------
-- devices
---------------------------------------------------------------------
CREATE OR REPLACE VIEW devices AS
SELECT
  nodes.node_id,
  -- needed name to make a unique string when viewing multiple agents 
  -- on the same device with the mazak endpoints.
  -- concat(nodes.props->>'name', ' (', nodes.props->>'uuid', ')') as name_uuid,
  nodes.props->>'name' as name,
  nodes.props->>'uuid' as uuid, 
  nodes.props->>'path' as path
FROM 
  nodes
WHERE
  nodes.props->>'node_type'='Device';

---------------------------------------------------------------------
-- dataitems
---------------------------------------------------------------------
CREATE OR REPLACE VIEW dataitems AS
SELECT
  nodes.node_id,
  nodes.props->>'path' as path,
  nodes.props->>'category' as category, 
  nodes.props->>'type' as type,
  nodes.props->>'subType' as subtype,
  nodes.props->>'units' as units,
  nodes.props->>'nativeUnits' as nativeunits,
  nodes.props->>'statistic' as statistic
FROM 
  nodes
WHERE
  nodes.props->>'node_type'='DataItem';


---------------------------------------------------------------------
-- FUNCTIONS
---------------------------------------------------------------------

---------------------------------------------------------------------
-- get_timeline
---------------------------------------------------------------------

-- get data for a timeline view (eg the 'discrete' plugin for grafana).
-- like a regular query but also gets the last value before the start time,
-- and assigns it to that start time.
-- use from grafana like
--   select time, value as "Availability" 
--   from get_timeline('Line1', 'availability', $__from, $__to);
CREATE OR REPLACE FUNCTION get_timeline (
  IN devicename text, -- the device name, eg 'Line1'
  IN pathname text, -- the history view path, eg 'availability'
  IN from_ms bigint, -- start time in milliseconds since 1970-01-01
  IN to_ms bigint -- end time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, value text)
LANGUAGE sql
AS
$BODY$
-- this union query gets the regular data for the graph,
-- then tacks on the value for the left edge.
-- first define some SQL variables
-- referenced below with eg '(TABLE from_time)'
WITH
  from_time AS (VALUES (to_timestamp(cast(from_ms/1000 as bigint))::timestamp)),
  to_time AS (VALUES (to_timestamp(cast(to_ms/1000 as bigint))::timestamp))
-- do a straightforward query for time and value for the 
-- given device, path, and timestamp
SELECT time, value 
FROM history_text
WHERE
  device = devicename and
  path = pathname and
  time >= (TABLE from_time) and
  time <= (TABLE to_time)
-- now tack on the time and value for the left edge	with a UNION query
UNION
SELECT time, value 
FROM
  -- need this subquery so can order the results by time descending,
  -- so can get the last value before the left edge.
  (
  SELECT
    (TABLE from_time) as time,
    value
  FROM history_text
  WHERE
    device = devicename and
    path = pathname and
    time <= (TABLE from_time)
  ORDER BY history_text.time DESC
  LIMIT 1 -- just want the last value
  ) AS subquery1 -- subquery name is required but not used
ORDER BY time -- sort the combined query results
$BODY$;

