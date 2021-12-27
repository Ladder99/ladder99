
---------------------------------------------------------------------
-- bins
---------------------------------------------------------------------
-- store data for metrics

--. update this

-- CREATE TABLE IF NOT EXISTS bins (
--   device_id integer REFERENCES nodes, -- node_id of a device
--   time timestamptz NOT NULL, -- rounded down by minute, for now
--   dimensions jsonb, -- incl hour, shift, plant, machine, etc
--   values jsonb, -- incl timeActive, timeAvailable, partsGood, partsBad, etc
--   PRIMARY KEY (device_id, time, dimensions)
-- );
-- -- make hypertable and add compression/retention schedules
-- SELECT create_hypertable('bins', 'time', if_not_exists => TRUE);
-- -- SELECT add_compression_policy('bins', INTERVAL '1d', if_not_exists => TRUE);
-- -- SELECT add_retention_policy('bins', INTERVAL '1 year', if_not_exists => TRUE);


---------------------------------------------------------------------
-- metrics
---------------------------------------------------------------------
-- a view on the bins table - adds name, calculates uptime

--. update this

-- DROP VIEW IF EXISTS metrics;
-- CREATE OR REPLACE VIEW metrics AS
-- SELECT 
--   devices.props->>'name' AS device,
--   bins.time as "time",
--   bins.dimensions as dimensions,
--   bins.values as "values", -- a jsonb object
--   -- coalesce returns the first non-null value (works like an OR operator),
--   -- and nullif returns the first value, unless it equals 0.0, when it returns null -
--   -- then the whole expression is null. avoids div by zero error.
--   coalesce((values->>'time_active')::real,0) / 
--     nullif((values->>'time_available')::real,0.0) as uptime
-- FROM bins
-- JOIN nodes AS devices ON bins.device_id=devices.node_id;




drop function update_metrics;

create or replace function update_metrics (job_id int, config jsonb)
returns boolean
as
$$
begin
  raise notice 'hello, world';
  return true;
end;
$$
language plpgsql;


--select update_metrics();


select add_job('update_metrics', '5s');



