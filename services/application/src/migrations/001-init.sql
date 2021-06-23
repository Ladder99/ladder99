CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- note: Adding a primary key will automatically create a unique B-tree index
-- on the column or group of columns listed in the primary key, and will force
-- the column(s) to be marked NOT NULL.

CREATE TABLE IF NOT EXISTS meta (
  name text PRIMARY KEY,
  value jsonb
);

CREATE TABLE IF NOT EXISTS nodes (
  node_id SERIAL PRIMARY KEY,
  props jsonb
);
-- CREATE INDEX nodes_type ON nodes (props.type);
-- CREATE INDEX nodes_canonical_id ON nodes (props.canonicalId);

CREATE TABLE IF NOT EXISTS edges (
  from_id integer REFERENCES nodes,
  to_id integer REFERENCES nodes,
  props jsonb
);
CREATE INDEX edges_from ON edges (from_id);
CREATE INDEX edges_to ON edges (to_id);

CREATE TABLE IF NOT EXISTS history (
  node_id integer REFERENCES nodes,
  prop_id integer REFERENCES nodes,
  time timestamptz NOT NULL,
  value jsonb
);
SELECT create_hypertable('history', 'time', if_not_exists => TRUE);
CREATE INDEX history_node ON history (node_id);

-- views

CREATE OR REPLACE VIEW history_all AS
SELECT devices.props->>'name' AS device,
  dataitems.props->>'name' AS dataitem, history.time, history.value
FROM history
JOIN nodes AS devices ON history.node_id=devices.node_id
JOIN nodes AS dataitems ON history.prop_id=dataitems.node_id;

-- note: float is an alias for 'double precision'
CREATE OR REPLACE VIEW history_float AS
SELECT device, dataitem, time, value::float
FROM history_all
WHERE jsonb_typeof(value) = 'number'::text;

CREATE OR REPLACE VIEW history_text AS
SELECT device, dataitem, time, value::text
FROM history_all
WHERE jsonb_typeof(value) = 'text'::text;
