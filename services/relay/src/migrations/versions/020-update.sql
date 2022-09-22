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

-- add unique uid index (uid = agentAlias/deviceId/dataitemId) - should be permanent
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
  -- nodes.props->>'uid' as uid, -- ie `agentAlias/deviceId/dataitemId`, eg 'Main/d1/avail'
  nodes.props->>'path' as path, -- eg 'Main/Micro/Availability'
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
