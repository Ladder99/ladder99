---------------------------------------------------------------------
-- views
---------------------------------------------------------------------

DROP VIEW IF EXISTS history_all;  -- because `create or replace` isn't enough!
CREATE OR REPLACE VIEW history_all AS
SELECT 
  devices.props->>'uid' AS device,
  dataitems.props->>'path' AS path,
  history.time,
  history.value->>0 as value, -- float or string
  dataitems.props->>'units' as units
FROM raw.history
JOIN raw.nodes AS devices ON raw.history.node_id=devices.node_id
JOIN raw.nodes AS dataitems ON raw.history.dataitem_id=dataitems.node_id;
