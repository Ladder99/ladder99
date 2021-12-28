
---------------------------------------------------------------------
-- bins table
---------------------------------------------------------------------
-- store data for metrics

--drop table bins;

create table if not exists bins (
  device_id integer references nodes, -- node_id of a device
  resolution interval, -- 1min, 1hr, 1day, 1week, 1month, 1quarter, 1year
  time timestamptz, -- rounded down to previous minute, hour, day, etc
  active int, -- number of minutes device was active during time resolution
  available int, -- number of minutes device was available during time resolution
  primary key (device_id, resolution, time)
);
--. what's advantage of hypertable here?
-- make hypertable and add compression/retention schedules
-- select create_hypertable('bins', 'time', if_not_exists => true);
-- select add_compression_policy('bins', interval '1d', if_not_exists => true);
-- select add_retention_policy('bins', interval '1 year', if_not_exists => true);


---------------------------------------------------------------------
-- metrics view
---------------------------------------------------------------------
-- a view on the bins table - adds name, calculates uptime
--. make a materialized view for more speed?

drop view if exists metrics;

create or replace view metrics as
select 
  devices.props->>'name' as device,
  bins.resolution,
  bins.time,
  bins.active,
  bins.available,
  -- coalesce returns the first non-null value (works like an or operator),
  -- and nullif returns the first value, unless it equals 0.0, when it returns null -
  -- then the whole expression is null. avoids div by zero error.
  coalesce(bins.active::real,0) / nullif(bins.available::real,0.0) as utilization
--  bins.values as "values", -- a jsonb object
--  coalesce((values->>'time_active')::real,0) / 
--    nullif((values->>'time_available')::real,0.0) as utilization
from bins
join nodes as devices on bins.device_id = devices.node_id;



---------------------------------------------------------------------
-- update_metrics procedure
---------------------------------------------------------------------

drop function update_metrics;

create or replace procedure update_metrics(job_id int, config jsonb)
as
$$
begin
  raise notice 'hello, world';
end;
$$
language plpgsql;


call update_metrics(null, null);



--select add_job('update_metrics', '5s');


-- https://docs.timescale.com/api/latest/informational-views/job_stats


---------------------------------------------------------------------
-- increment_bin procedure
---------------------------------------------------------------------

create or replace procedure increment_bin(job_id int, config jsonb)
language plpgsql
as $body$
declare
--  _device_id int := config->>'device_id';
  _device_id int := 11;
  _resolution interval := '1 minute';
  _time timestamptz := now(); --. round down to nearest min, hr, day, week, etc?
  _field text := quote_ident('available');
  _sql text;
begin
  --. do upsert
  execute format(
    'insert into bins (device_id, resolution, time, %s) 
      values ($1, $2, $3, $4)
    on conflict (device_id, resolution, time) do 
      update set %s = bins.%s + 1;',
    _field, _field, _field
  ) using _device_id, _resolution, _time, 1;
end
$body$;



