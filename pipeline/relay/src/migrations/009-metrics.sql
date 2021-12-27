
---------------------------------------------------------------------
-- bins
---------------------------------------------------------------------
-- store data for metrics

create table if not exists bins (
  device_id integer references nodes, -- node_id of a device
  resolution interval, -- 1min, 1hr, 1day, 1week, 1month, 1quarter, 1year
  time timestamptz, -- rounded down to previous minute, hour, day, etc
  active interval, -- number of minutes device was active during time resolution
  available interval, -- number of minutes device was available during time resolution
  primary key (device_id, resolution, time)
);
-- make hypertable and add compression/retention schedules
-- select create_hypertable('bins', 'time', if_not_exists => true);
-- select add_compression_policy('bins', interval '1d', if_not_exists => true);
-- select add_retention_policy('bins', interval '1 year', if_not_exists => true);


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

create or replace procedure update_metrics (job_id int, config jsonb)
as
$$
begin
  raise notice 'hello, world';
end;
$$
language plpgsql;


call update_metrics(null, null);


select add_job('update_metrics', '5s');



