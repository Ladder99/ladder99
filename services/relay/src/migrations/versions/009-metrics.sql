-- tables, views, and functions to support metrics like availability

---------------------------------------------------------------------
-- bins table
---------------------------------------------------------------------
-- store data for metrics

--. move this data into history table?

create table if not exists bins (
  device_id integer references nodes, -- node_id of a device
  resolution interval, -- 1min, 1hr, 1day, 1week, 1month, 1quarter, 1year
  time timestamptz, -- rounded down to start of current minute, hour, day, etc
  active int, -- number of minutes device was active during time resolution
  available int, -- number of minutes device was available during time resolution
  primary key (device_id, resolution, time) -- need this so can find right record quickly for updating
);
-- note: this gets converted to a hypertable in step 012
-- and moved to raw schema in 020


---------------------------------------------------------------------
-- metrics view
---------------------------------------------------------------------
-- a view on the bins table - adds name, calculates uptime

drop view if exists metrics;
create or replace view metrics as
select 
  devices.props->>'name' as device,
  bins.resolution,
  bins.time,
  bins.active,
  bins.available,
  -- note: coalesce returns the first non-null value (works like an or operator),
  -- and nullif returns the first value, unless it equals 0.0, when it returns null -
  -- then the whole expression is null. avoids div by zero error.
  coalesce(bins.active::float,0) / nullif(bins.available::float,0.0) as availability
from bins
join nodes as devices on bins.device_id = devices.node_id;


---------------------------------------------------------------------
-- get_availability_from_metrics_view fn
---------------------------------------------------------------------
-- get percent of time a device is active vs available.
-- chooses a resolution (hour, day, etc) based on time range.

--. call this get_metric_availability - replace other version

-- call it from grafana like so - 
--   set timezone to 'America/Chicago';
--   select time, availability
--   from get_availability_from_metrics_view('Main/Cutter', $__from, $__to)

drop function if exists get_availability_from_metrics_view(text, bigint, bigint, text);

create or replace function get_availability_from_metrics_view(
  in p_device text, -- the device name, eg 'Cutter'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint, -- stop time in milliseconds since 1970-01-01
  in p_binsize text = null -- override calculated bin size, eg 'day'
)
returns table ("time" timestamptz, "availability" float)
language plpgsql
as
$body$
declare
  v_start timestamptz := ms2timestamptz(p_start);
  v_stop timestamptz := ms2timestamptz(p_stop);
  v_range interval := v_stop - v_start;
  -- choose v_binsize based on v_range size
  v_binsize interval := case
    when (p_binsize is not null) then '1 '||p_binsize -- eg '1 day'
    -- note: interval of month or greater is not supported by postgres!
    -- when (v_range > interval '2 months') then '1 month'
    when (v_range > interval '2 weeks') then '1 week'
    when (v_range > interval '2 days') then '1 day'
    when (v_range > interval '2 hours') then '1 hour'
    else '1 minute' --. handle 5 min interval?
  end;
begin
  return query

    select 
      metrics.time, metrics.availability
    from 
      metrics
    where 
      metrics.device = p_device -- eg 'Cutter'
      and resolution = v_binsize -- eg '1 day'
      and metrics.time between v_start and v_stop
    order by 
      time
    ;

    -- -- this query does gapfilling - 
    -- select 
    --   time_bucket_gapfill(v_binsize, metrics.time, v_start, v_stop) as bin, 
    --   -- coalesce(avg(metrics.availability),0) as availability -- converts nulls to 0
    --   avg(metrics.availability) as availability -- can be null
    -- from 
    --   metrics
    -- where 
    --   metrics.device = p_device
    --   and resolution = v_binsize
    --   and metrics.time between v_start and v_stop
    -- group by
    --   bin
    -- order by 
    --   bin
    -- ;
end;
$body$;

-- test

-- -- --set timezone to 'America/Chicago';
--  select time, availability
--  from get_availability_from_metrics_view(
--    'Cutter',
--    timestamptz2ms('2021-12-29 18:00:00'),
--    timestamptz2ms('2021-12-29 19:00:00')
--  --  timestamptz2ms('2021-12-29 20:00:00')
--  );





---------------------------------------------------------------------
-- get_availability_from_metrics_view2 fn
---------------------------------------------------------------------
-- this is a stop-gap fn - a copy of the above, without the p_device parameter.
-- this is used to get the average of ALL devices, currently just the 
-- corrugated department. 
-- will need a better soln when go beyond ONE department.
-- but didn't want to spend forever working on this for one feature. 

drop function if exists get_availability_from_metrics_view2(bigint, bigint, text);

create or replace function get_availability_from_metrics_view2(
--  in p_device text, -- the device name, eg 'Cutter'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint, -- stop time in milliseconds since 1970-01-01
  in p_binsize text = null -- override calculated bin size, eg 'day'
)
returns table (
	"time" timestamptz, 
	"availability" float
)
language plpgsql
as
$body$
declare
  v_start timestamptz := ms2timestamptz(p_start);
  v_stop timestamptz := ms2timestamptz(p_stop);
  v_range interval := v_stop - v_start;
  -- choose v_binsize based on v_range size
  v_binsize interval := case 
    when (p_binsize is not null) then '1 '||p_binsize -- eg '1 day'
    -- note: interval of month or greater is not supported by postgres!
    -- when (v_range > interval '2 months') then '1 month'
    when (v_range > interval '2 weeks') then '1 week'
    when (v_range > interval '2 days') then '1 day'
    when (v_range > interval '2 hours') then '1 hour'
    else '1 minute' --. handle 5 min interval?
  end;
begin
  return query

    select 
      metrics.time, metrics.availability
    from 
      metrics
    where 
--      metrics.device = p_device -- eg 'Cutter'
--      and 
      resolution = v_binsize -- eg '1 day'
      and metrics.time between v_start and v_stop
    order by 
      time
    ;
end;
$body$;


-- test
-- set timezone to 'America/Chicago';
-- select time, availability
-- from get_availability_from_metrics_view2(
--   timestamptz2ms('2022-07-01 00:00:00'),
--   timestamptz2ms('2022-07-02 00:00:00')
-- );

