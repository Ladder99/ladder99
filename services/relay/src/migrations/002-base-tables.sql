---------------------------------------------------------------------
-- meta
---------------------------------------------------------------------
-- use this to store migration version etc.

--. easier to have one row with columns per value?
--  eg a column for migration version? mebbe

CREATE TABLE IF NOT EXISTS meta (
  name text PRIMARY KEY, -- adds meta_pkey index
  value jsonb
);


---------------------------------------------------------------------
-- nodes
---------------------------------------------------------------------
-- stores devices, dataitems

CREATE TABLE IF NOT EXISTS nodes (
  -- note: Adding a primary key will automatically create a unique B-tree index
  -- on the column or group of columns listed in the primary key, and will force
  -- the column(s) to be marked NOT NULL.
  node_id SERIAL PRIMARY KEY, -- adds nodes_pkey index
  props jsonb -- jsonb lets us store any information about a node we need
);

-- see https://stackoverflow.com/questions/17807030/how-to-create-index-on-json-field-in-postgres
CREATE INDEX IF NOT EXISTS nodes_type ON nodes ((props->>'type'));
CREATE UNIQUE INDEX IF NOT EXISTS nodes_path ON nodes ((props->>'path'));

-- adding this index actually doubles the time for get_timeline to run! why?
-- CREATE INDEX IF NOT EXISTS nodes_name ON nodes ((props->>'name'));


---------------------------------------------------------------------
-- edges
---------------------------------------------------------------------
-- could store relations between nodes here,
-- but currently encoding that information in the node path -
-- so this table is unused now.

CREATE TABLE IF NOT EXISTS edges (
  from_id integer REFERENCES nodes,
  to_id integer REFERENCES nodes,
  props jsonb
);

CREATE INDEX IF NOT EXISTS edges_from_id ON edges (from_id);
CREATE INDEX IF NOT EXISTS edges_to_id ON edges (to_id);


---------------------------------------------------------------------
-- history
---------------------------------------------------------------------
-- stores dataitem values

CREATE TABLE IF NOT EXISTS history (
  node_id integer REFERENCES nodes,
  dataitem_id integer REFERENCES nodes,
  time timestamptz NOT NULL,
  value jsonb -- jsonb so can store numbers, strings, arrays, objects...
);

CREATE INDEX IF NOT EXISTS history_node_id ON history (node_id);

-- adding this index cut get_timeline down from 850ms to 750ms - 10% faster
CREATE INDEX IF NOT EXISTS history_dataitem_id ON history (dataitem_id);

-- make hypertable and add compression/retention schedules.
-- this adds an index, history_time_idx, on the time column.
-- and by default, clusters the data into week intervals.
--. should adjust that for data volume expected, ideally.
SELECT create_hypertable('history', 'time', if_not_exists => TRUE);
SELECT add_retention_policy('history', INTERVAL '1 month', if_not_exists => TRUE);
-- SELECT add_compression_policy('history', INTERVAL '1d', if_not_exists => TRUE);
