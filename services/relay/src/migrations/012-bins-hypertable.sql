---------------------------------------------------------------------
-- bins table
---------------------------------------------------------------------

-- make bins a hypertable and add compression/retention schedules.
-- this adds an index, bins_time_idx, on the time_bin column.
-- and by default, clusters the data into week intervals.
-- migrate_data	- Set to TRUE to migrate any existing data from the relation table
-- to chunks in the new hypertable. A non-empty table generates an error without
-- this option. Large tables may take significant time to migrate. Defaults to FALSE.
SELECT create_hypertable('bins', 'time', if_not_exists => TRUE, migrate_data => TRUE);
SELECT add_retention_policy('bins', INTERVAL '1 month', if_not_exists => TRUE);
-- SELECT add_compression_policy('bins', INTERVAL '1d', if_not_exists => TRUE);
