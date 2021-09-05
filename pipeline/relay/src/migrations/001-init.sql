-- migrate
-- create tables and views
-- these are run by src/db.js on opening the db

---------------------------------------------------------------------
-- TIMESCALE extension
---------------------------------------------------------------------
-- lets us make hypertables for storing time-series data

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

---------------------------------------------------------------------
-- META table
---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meta (
  name text PRIMARY KEY,
  value jsonb
);

---------------------------------------------------------------------
-- NODES table
---------------------------------------------------------------------
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
-- EDGES table
---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS edges (
  from_id integer REFERENCES nodes,
  to_id integer REFERENCES nodes,
  props jsonb
);
CREATE INDEX IF NOT EXISTS edges_from_id ON edges (from_id);
CREATE INDEX IF NOT EXISTS edges_to_id ON edges (to_id);

---------------------------------------------------------------------
-- HISTORY table
---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS history (
  node_id integer REFERENCES nodes,
  property_id integer REFERENCES nodes,
  time timestamptz NOT NULL,
  value jsonb -- can store numbers, strings, arrays, objects...
);
SELECT create_hypertable('history', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS history_node_id ON history (node_id);

---------------------------------------------------------------------
-- HISTORY_ALL view
---------------------------------------------------------------------

CREATE OR REPLACE VIEW history_all AS
SELECT 
  devices.props->>'uuid' AS device,
  properties.props->>'path' AS property,
  history.time,
  history.value -- value is a jsonb object - need to cast it as in below views
FROM history
JOIN nodes AS devices ON history.node_id=devices.node_id
JOIN nodes AS properties ON history.property_id=properties.node_id;

---------------------------------------------------------------------
-- HISTORY_FLOAT view
---------------------------------------------------------------------

-- note: float is an alias for 'double precision'
CREATE OR REPLACE VIEW history_float AS
SELECT device, property, time, value::float
FROM history_all
WHERE jsonb_typeof(value) = 'number';

---------------------------------------------------------------------
-- HISTORY_TEXT view
---------------------------------------------------------------------

-- note: #>>'{}' extracts the top-level json string without enclosing double quotes
-- see https://dba.stackexchange.com/questions/207984/unquoting-json-strings-print-json-strings-without-quotes
CREATE OR REPLACE VIEW history_text AS
SELECT device, property, time, value#>>'{}' as value
FROM history_all
WHERE jsonb_typeof(value) = 'string';

---------------------------------------------------------------------
-- DEVICES view
---------------------------------------------------------------------

CREATE OR REPLACE VIEW devices AS
SELECT
  nodes.node_id,
  concat(nodes.props->>'name', ' (', nodes.props->>'uuid', ')') as name_uuid,
  nodes.props->>'name' as name,
  nodes.props->>'uuid' as uuid, 
  nodes.props->>'path' as path
FROM 
  nodes
WHERE
  -- nodes.props->>'type'='Device';
  -- nodes.node_type='Device';
  nodes.props->>'node_type'='Device';

---------------------------------------------------------------------
-- PROPERTY_DEFS view
---------------------------------------------------------------------

CREATE OR REPLACE VIEW property_defs AS
SELECT
  nodes.node_id,
  nodes.props->>'path' as path,
  nodes.props->>'category' as category, 
  nodes.props->>'type' as type,
  nodes.props->>'subType' as subtype
FROM 
  nodes
WHERE
  -- nodes.props->>'type'='PropertyDef';
  -- nodes.node_type='PropertyDef';
  nodes.props->>'node_type'='PropertyDef';
