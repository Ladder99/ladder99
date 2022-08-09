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
  nodes.props->>'id' as id,
  nodes.props->>'uuid' as uuid, 
  nodes.props->>'gid' as gid, -- uuid:id or unique alias
  nodes.props->>'fullpath' as fullpath,
  nodes.props->>'path' as path,
  nodes.props->>'order' as "order"
FROM 
  nodes
WHERE
  nodes.props->>'node_type'='Device';


---------------------------------------------------------------------
-- nodes table
---------------------------------------------------------------------
--. why were we dropping this?
-- -- ditch unique path index
-- DROP INDEX IF EXISTS nodes_path;

-- add unique gid index (gid = global id = device uuid + dataitemid OR a unique alias)
CREATE UNIQUE INDEX IF NOT EXISTS nodes_gid ON nodes ((props->>'gid'));


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

