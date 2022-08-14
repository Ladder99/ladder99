---------------------------------------------------------------------
-- devices
---------------------------------------------------------------------

DROP VIEW IF EXISTS devices;  -- because create or replace isn't enough!
CREATE OR REPLACE VIEW devices AS
SELECT
  nodes.node_id,
  nodes.props->>'id' as id,
  nodes.props->>'uid' as uid, -- agentAlias/deviceId
  nodes.props->>'uuid' as uuid, -- supposedly unique id
  nodes.props->>'path' as path,
  nodes.props->>'shortPath' as shortpath,
  nodes.props->>'name' as name,
  nodes.props->>'order' as "order",
  nodes.props as props
FROM 
  nodes
WHERE
  nodes.props->>'node_type'='Device';


---------------------------------------------------------------------
-- nodes table
---------------------------------------------------------------------
-- add unique uid index (uid = agentAlias/deviceId/dataitemId)
CREATE UNIQUE INDEX IF NOT EXISTS nodes_uid ON nodes ((props->>'uid'));


---------------------------------------------------------------------
-- nodes_all
---------------------------------------------------------------------

--. what was this for?
-- CREATE OR REPLACE VIEW nodes_all AS
-- SELECT
--   nodes.node_id,
--   nodes.props->>'path' as path
-- FROM 
--   nodes
-- -- WHERE
-- --   nodes.props->>'node_type'='DataItem';

