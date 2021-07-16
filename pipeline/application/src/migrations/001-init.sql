-- migrate
-- create tables and views

-- TIMESCALE extension --
-- lets us make hypertables for storing time-series data

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- META table --

CREATE TABLE IF NOT EXISTS meta (
  name text PRIMARY KEY,
  value jsonb
);

-- NODES table --
-- note: Adding a primary key will automatically create a unique B-tree index
-- on the column or group of columns listed in the primary key, and will force
-- the column(s) to be marked NOT NULL.

CREATE TABLE IF NOT EXISTS nodes (
  node_id SERIAL PRIMARY KEY,
  props jsonb
);
--. syntax for this?
-- CREATE INDEX nodes_node_type ON nodes (props.nodeType);
-- CREATE INDEX nodes_canonical_id ON nodes (props.canonicalId);

-- EDGES table --

CREATE TABLE IF NOT EXISTS edges (
  from_id integer REFERENCES nodes,
  to_id integer REFERENCES nodes,
  props jsonb
);
CREATE INDEX IF NOT EXISTS edges_from_id ON edges (from_id);
CREATE INDEX IF NOT EXISTS edges_to_id ON edges (to_id);

-- HISTORY table --

CREATE TABLE IF NOT EXISTS history (
  node_id integer REFERENCES nodes,
  property_id integer REFERENCES nodes,
  time timestamptz NOT NULL,
  value jsonb -- can store numbers, strings, arrays, objects...
);
SELECT create_hypertable('history', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS history_node_id ON history (node_id);

-- HISTORY_ALL view --

CREATE OR REPLACE VIEW history_all AS
SELECT devices.props->>'uuid' AS device_uuid,
  properties.props->>'definitionPath' AS property_definition_path, 
  properties.props->>'valuePath' AS property_value_path, 
  properties.props->>'canonicalId' AS property_canonical_id, 
  history.time, 
  history.value -- value is a jsonb object - need to cast it as in below views
FROM history
JOIN nodes AS devices ON history.node_id=devices.node_id
JOIN nodes AS properties ON history.property_id=dataitems.node_id;

-- HISTORY_FLOAT view --

-- note: float is an alias for 'double precision'
CREATE OR REPLACE VIEW history_float AS
SELECT device, dataitem, time, value::float
FROM history_all
WHERE jsonb_typeof(value) = 'number'::text;

-- HISTORY_TEXT view --

CREATE OR REPLACE VIEW history_text AS
SELECT device, dataitem, time, value::text
FROM history_all
WHERE jsonb_typeof(value) = 'text'::text;
