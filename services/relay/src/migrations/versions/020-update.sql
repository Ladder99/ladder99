---------------------------------------------------------------------
-- schemas
---------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS raw;

---------------------------------------------------------------------
-- tables
---------------------------------------------------------------------

-- move tables from public to raw schema
ALTER TABLE bins SET SCHEMA raw;
ALTER TABLE edges SET SCHEMA raw;
ALTER TABLE history SET SCHEMA raw;
ALTER TABLE meta SET SCHEMA raw;
ALTER TABLE nodes SET SCHEMA raw;

-- add unique uid index (uid = agentAlias/deviceId/dataitemId)
CREATE UNIQUE INDEX IF NOT EXISTS nodes_uid ON raw.nodes ((props->>'uid'));
DROP INDEX IF EXISTS raw.nodes_path; -- we use uid to enforce uniqueness now


---------------------------------------------------------------------
-- views
---------------------------------------------------------------------

-- update devices
DROP VIEW IF EXISTS devices;  -- because `create or replace` isn't enough!
CREATE OR REPLACE VIEW devices AS
SELECT
  nodes.node_id,
  nodes.props->>'id' as id,
  nodes.props->>'uid' as uid, -- ie `agentAlias/deviceId`, eg 'main/d1'
  nodes.props->>'uuid' as uuid, -- a supposedly unique id, but depends on agent.xml developer
  nodes.props->>'path' as path,
  nodes.props->>'shortPath' as shortpath,
  nodes.props->>'name' as name,
  nodes.props as props
FROM 
  raw.nodes as nodes
WHERE
  nodes.props->>'node_type'='Device';


-- update dataitems
DROP VIEW IF EXISTS dataitems;  -- because `create or replace` isn't enough!
CREATE OR REPLACE VIEW dataitems AS
SELECT
  nodes.node_id,
  -- nodes.props->>'id' as id,
  -- nodes.props->>'uid' as uid, -- ie `agentAlias/deviceId/dataitemId`, eg 'main/d1/avail'
  nodes.props->>'path' as path, -- eg 'main/d1/availability'
  nodes.props->>'category' as category, 
  nodes.props->>'type' as type,
  nodes.props->>'subType' as subtype,
  nodes.props->>'units' as units,
  nodes.props->>'nativeUnits' as nativeunits,
  nodes.props->>'statistic' as statistic,
  nodes.props as props
FROM 
  raw.nodes as nodes
WHERE
  nodes.props->>'node_type'='DataItem';


--. this will also change history_text etc defs because have cast from jsonb
-- -- update history_all
-- -- note: can't drop this as other objects depend on it (history_float, history_text).
-- -- DROP VIEW IF EXISTS history_all;  -- because `create or replace` isn't enough!
-- CREATE OR REPLACE VIEW history_all AS
-- SELECT 
--   devices.props->>'uid' AS device,
--   dataitems.props->>'path' AS path,
--   history.time,
--   history.value -- a jsonb object - need to cast it as in below views
-- FROM raw.history
-- JOIN raw.nodes AS devices ON raw.history.node_id=devices.node_id
-- JOIN raw.nodes AS dataitems ON raw.history.dataitem_id=dataitems.node_id;

