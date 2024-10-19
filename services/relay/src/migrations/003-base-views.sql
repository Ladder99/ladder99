
-- delete all views in case the structure has changed
-- (will eventually have to use migrations for this)
-- do in reverse order of definitions below, in case there are dependencies.

DROP VIEW IF EXISTS dataitems;
DROP VIEW IF EXISTS devices;
DROP VIEW IF EXISTS history_text;
DROP VIEW IF EXISTS history_float;
DROP VIEW IF EXISTS history_all;

---------------------------------------------------------------------
-- history_all
---------------------------------------------------------------------
-- the history table, but with name and path dereferenced,
-- and value as the original jsonb object.

CREATE OR REPLACE VIEW history_all AS
SELECT
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
-- the history_all view, but with only numeric values.

-- note: float is an alias for 'double precision' or float8

--. how handle UNDEFINED? should translate to null in relay?

CREATE OR REPLACE VIEW history_float AS
SELECT device, path, time, value::float
FROM history_all
WHERE jsonb_typeof(value) = 'number';


---------------------------------------------------------------------
-- history_text
---------------------------------------------------------------------
-- the history_all view, but with only text values.

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
  nodes.props->>'path' as path,
  nodes.props->>'order' as "order",
  nodes.props->>'department' as department
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
