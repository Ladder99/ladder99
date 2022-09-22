---------------------------------------------------------------------
-- views
---------------------------------------------------------------------

DROP VIEW IF EXISTS history_text;
DROP VIEW IF EXISTS history_float;
DROP VIEW IF EXISTS history_all;


--. some fns have ->>0 etc in them
CREATE OR REPLACE VIEW history_all AS
SELECT
  devices.props->>'path' AS device, -- was 'name' as device
  dataitems.props->>'path' AS path,
  history.time,
  history.value->>0 as value, -- float or string - was just history.value
  dataitems.props->>'units' as units -- new column
FROM raw.history
JOIN raw.nodes AS devices ON raw.history.node_id=devices.node_id
JOIN raw.nodes AS dataitems ON raw.history.dataitem_id=dataitems.node_id;


-- note: float is an alias for 'double precision' or float8
--. how handle UNAVAILABLE? translate to null here?
CREATE OR REPLACE VIEW history_float AS
SELECT
  devices.props->>'path' AS device, -- was 'name' as device
  dataitems.props->>'path' AS path,
  history.time,
  history.value::float,
  dataitems.props->>'units' as units -- new column
FROM raw.history
JOIN raw.nodes AS devices ON raw.history.node_id=devices.node_id
JOIN raw.nodes AS dataitems ON raw.history.dataitem_id=dataitems.node_id
WHERE jsonb_typeof(value) = 'number';


-- note: #>>'{}' extracts the top-level json string without enclosing double quotes
-- see https://dba.stackexchange.com/questions/207984/unquoting-json-strings-print-json-strings-without-quotes
CREATE OR REPLACE VIEW history_text AS
SELECT
  devices.props->>'path' AS device, -- was 'name' as device
  dataitems.props->>'path' AS path,
  history.time,
  history.value#>>'{}' as value,
  '' as units -- new column
FROM raw.history
JOIN raw.nodes AS devices ON raw.history.node_id=devices.node_id
JOIN raw.nodes AS dataitems ON raw.history.dataitem_id=dataitems.node_id
WHERE jsonb_typeof(value) = 'string';



-- DROP VIEW IF EXISTS devices;
-- DROP VIEW IF EXISTS dataitems;

-- CREATE OR REPLACE VIEW devices AS
-- SELECT
--   nodes.node_id,
--   nodes.props->>'id' as id, -- deviceId - only unique within a single agent
--   nodes.props->>'uid' as uid, -- `agentAlias/deviceId`, eg 'Main/d1' - makes deviceId unique across agents
--   nodes.props->>'path' as path, -- `agentAlias/deviceAlias`, eg 'Main/Micro' - friendly identifier
--   nodes.props->>'name' as name, -- name from agent.xml, eg 'Microcontroller'
--   nodes.props as props -- everything else
-- FROM 
--   raw.nodes as nodes
-- WHERE
--   nodes.props->>'node_type'='Device';


-- CREATE OR REPLACE VIEW dataitems AS
-- SELECT
--   nodes.node_id,
--   -- nodes.props->>'id' as id,
--   -- nodes.props->>'uid' as uid, -- ie `agentAlias/deviceId/dataitemId`, eg 'Main/m/avail'
--   nodes.props->>'path' as path, -- `agentAlias/deviceAlias/path/to/dataitem`, eg 'Main/Micro/Availability'
--   nodes.props->>'category' as category, 
--   nodes.props->>'type' as type,
--   nodes.props->>'subType' as subtype,
--   nodes.props->>'units' as units,
--   nodes.props->>'nativeUnits' as nativeunits,
--   nodes.props->>'statistic' as statistic,
--   nodes.props as props
-- FROM 
--   raw.nodes as nodes
-- WHERE
--   nodes.props->>'node_type'='DataItem';



drop view if exists metrics;

create or replace view metrics as
select 
  devices.props->>'path' as device,
  bins.resolution,
  bins.time,
  bins.active,
  bins.available,
  -- note: coalesce returns the first non-null value (works like an or operator),
  -- and nullif returns the first value, unless it equals 0.0, when it returns null -
  -- then the whole expression is null. avoids div by zero error.
  coalesce(bins.active::float,0) / nullif(bins.available::float,0.0) as availability
from raw.bins
join raw.nodes as devices on raw.bins.device_id = devices.node_id;
