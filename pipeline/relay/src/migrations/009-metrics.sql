
-- tables, views, and functions to support metrics like utilization


---------------------------------------------------------------------
-- bins table
---------------------------------------------------------------------
-- store data for metrics

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
  -- note: coalesce returns the first non-null value (works like an or operator),
  -- and nullif returns the first value, unless it equals 0.0, when it returns null -
  -- then the whole expression is null. avoids div by zero error.
  coalesce(bins.active::float,0) / nullif(bins.available::float,0.0) as utilization
--  bins.values as "values", -- a jsonb object
--  coalesce((values->>'time_active')::real,0) / 
--    nullif((values->>'time_available')::real,0.0) as utilization
from bins
join nodes as devices on bins.device_id = devices.node_id;



---------------------------------------------------------------------
-- get_active fn
---------------------------------------------------------------------
-- check for events on given device and path in a time range.
-- returns true if any events.
--. what about unavailable events - ignore those?

create or replace function get_active(
  p_device text,
  p_path text,
  p_start timestamptz,
  p_stop timestamptz
)
returns boolean
language sql
as
$body$
  select count(value) > 0 as active
  from history_all
  where 
    device = p_device 
    and path = p_path
    and time between p_start and p_stop
  limit 1;
$body$;


-- test
--select get_active(
--  'Cutter', 
--  'controller/partOccurrence/part_count-all', 
--  '2021-12-13 03:04:00', 
--  '2021-12-13 03:05:00'
--);


---------------------------------------------------------------------
-- increment_bins procedure
---------------------------------------------------------------------
-- increment values in the bins table

create or replace procedure increment_bins(
  in p_device_id int,
  in p_time timestamptz,
  in p_field text,
  in p_delta int = 1
)
language plpgsql
as $body$
declare
  v_resolutions text[] := '{minute,hour,day,week,month,year}'; -- array literal
  v_resolution text;
  v_time timestamptz;
  v_field text := quote_ident(p_field); -- eg 'active', 'available'
begin
  foreach v_resolution in array v_resolutions loop
    v_time := date_trunc(v_resolution, p_time); -- round down to start of current min, hour, day, etc
    -- upsert/increment the given field by delta
    --. use $ not % for all params?
    execute format(
      'insert into bins (device_id, resolution, time, %s) 
        values ($1, $2, $3, $4)
      on conflict (device_id, resolution, time) do 
        update set %s = coalesce(bins.%s, 0) + $5;',
      v_field, v_field, v_field
    ) using p_device_id, ('1 '||v_resolution)::interval, v_time, p_delta, p_delta;
  end loop;
end
$body$;


-- test
call increment_bins(11, '2021-12-30 05:00:00', 'available');




---------------------------------------------------------------------
-- is_time_scheduled
---------------------------------------------------------------------

-- returns true if given time is in the work/holiday schedule.

-- p_schedule is a jsonb object, eg 

create or replace function is_time_scheduled(
  in p_time timestamptz, 
  in p_schedule jsonb
)
returns boolean
language plpgsql
as
$body$
declare
  v_work_window jsonb;
  v_base timestamptz;
  v_start timestamptz;
  v_stop timestamptz;
  v_day_of_week int;
  v_holiday date;
  v_date date;
begin
  
  v_day_of_week := extract(dow from p_time);
  raise notice '%', v_day_of_week;

  -- iterate over work windows
  for v_work_window in select * from jsonb_array_elements(p_schedule->'work') loop
    raise notice '%', v_work_window;
    if v_day_of_week = (v_work_window->'day')::int then
      raise notice 'hi';
    end if;
  end loop;

--    -- get base time for this window -
--    -- eg timeframe of 'day' gives midnight of p_time's day,
--    -- timeframe of 'week' gives monday midnight, etc.
--    -- _base := date_trunc(_window->>'timeframe', p_time at time zone 'America/Chicago');
--    -- _base := date_trunc(_window->>'timeframe', p_time) at time zone 'America/Chicago';
--    _base := date_trunc(_window->>'timeframe', p_time);
--
--    -- get start and stop times for this window - eg 4am-4pm of p_time's day 
--    _start := _base + (_window->>'start')::interval; -- eg _base + interval '4h'
--    _stop := least(now(), _base + (_window->>'stop')::interval); -- use now if not to the stop time
--
--    -- if time not within bounds, return false
--    if not (p_time between _start and _stop) then
--      return false;
--    end if;

  -- get time as a pure date, eg '2021-12-25'
  v_date := p_time::date;

  -- iterate over holidays
  for v_holiday in select * from jsonb_array_elements(p_schedule->'holidays') loop
    raise notice '%', v_holiday;
    if v_date = v_holiday then
      raise notice 'holiday!';
      return false;
    end if;
  end loop;

  -- passed all tests, so return true
  return true;
end;
$body$;


select is_time_scheduled(
  --now(),
  '2021-12-25 03:00:00', 
  '{
    "work": [
      {"day":4, "start":5, "stop":15.5}
    ],
    "holidays": [
      "2021-12-25"
    ]
  }'
);




---------------------------------------------------------------------
-- update_metrics procedure / job
---------------------------------------------------------------------
-- this will be called every minute by timescaledb's job scheduler.
-- it calls increment_bin for the different fields and bin resolutions.

--drop procedure update_metrics;

create or replace procedure update_metrics(job_id int, config jsonb)
language plpgsql
as
$body$
declare
  v_device_id int;
  v_device text;
  v_path text;
  v_schedule jsonb := config->>'schedule'; -- null if not included
  v_time timestamptz := coalesce(config->>'time', now()); -- ie default to now()
  v_interval interval := coalesce(config->>'interval', '1 minute'); -- ie default is 1 minute
  v_stop timestamptz := date_trunc('minute', v_time); -- round down to top of current minute --. or hour etc
  v_start timestamptz := v_stop - interval '1 minute'; -- start at previous minute --. or hour etc
  v_is_time_in_schedule boolean;
  v_are_enough_people_logged_in boolean;
  v_was_machine_active boolean;
begin
  -- is_time_in_schedule := if schedule passed in config, check if time is within the time windows.
  --v_is_time_in_schedule := true;
  v_is_time_in_schedule := is_time_in_schedule(v_time, v_schedule);
  -- are_enough_people_logged_in := lookup latest value of a dataitem set by facebook login info.
  -- loop over relevant devices, as passed through config.
  for v_device_id in select * from jsonb_array_elements(config->'device_ids') loop
    v_device := 'Cutter'; --. need both id and name - what do? i guess lookup name and keep id in a jsonb?
    v_path := 'controller/partOccurrence/part_count-all'; --. pass this in
    if v_is_time_in_schedule or v_are_enough_people_logged_in then
      -- check if any part_count events were within the previous time interval (eg minute).
      v_was_machine_active := get_active(v_device, v_path, v_start, v_stop);
      if v_was_machine_active then
        call increment_bins(v_device_id, v_stop, 'active');
      end if;
      call increment_bins(v_device_id, v_stop, 'available');
    end if;
  end loop;
end;
$body$;


-- test

call update_metrics(null, null);

-- User-defined actions allow you to run functions and procedures implemented 
-- in a language of your choice on a schedule within TimescaleDB.
-- https://docs.timescale.com/timescaledb/latest/overview/core-concepts/user-defined-actions
-- https://docs.timescale.com/api/latest/actions/add_job

-- add a scheduled job
select add_job(
  'update_metrics', -- function/procedure to call 
  '1 min', -- interval
  --. pass in path also
  config => '{"device_ids":[11], "interval":"1 min"}', -- config json --. pass devicenamesarray
  initial_start => date_trunc('minute', now()) + interval '1 minute' -- start at top of next minute
);

-- https://docs.timescale.com/api/latest/informational-views/job_stats
select job_id, total_runs, total_failures, total_successes from timescaledb_information.job_stats;

--select delete_job(1011);




---------------------------------------------------------------------
-- get_utilization_from_metrics_view fn
---------------------------------------------------------------------
-- get percent of time a device is active vs available
-- call it from grafana like so - 
-- set timezone to 'America/Chicago';
-- select time, utilization from get_utilization_from_metrics_view(
--   'Cutter',
--   'controller/partOccurrence/part_count-all',
--   $__from, $__to
-- )

create or replace function get_utilization_from_metrics_view (
  in p_device text, -- the device name, eg 'Cutter'
  in p_path text, -- path to monitor, eg 'controller/partOccurrence/part_count-all'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint -- stop time in milliseconds since 1970-01-01
)
returns table ("time" timestamptz, "utilization" float)
language plpgsql
as
$body$
declare
  _start timestamptz := ms2timestamptz(p_start);
  _stop timestamptz := ms2timestamptz(p_stop);
  _range interval := _stop - _start;
  -- choose _binsize based on _range size
  -- _binsize interval := case when (_range > interval '1 day') then interval '1 day' else interval '1 hour' end;
  -- _binminutes float := extract(epoch from _binsize) / 60.0; -- epoch is seconds - divide by 60 to get minutes
  -- _factor float := 1.0 / _binminutes; -- use this instead of dividing by binminutes below, for speed
  --_binsize interval := '1 minute';
  _binsize interval := case 
    when (_range > interval '1 week') then '1 week'
    when (_range > interval '1 day') then '1 day'
    when (_range > interval '1 hour') then '1 hour'
    else '1 minute' 
  end;
begin
  return query
    select metrics.time, metrics.utilization
    from metrics
    where 
      metrics.time between _start and _stop
      and resolution = _binsize
    order by time
  ;
end;
$body$;



--set timezone to 'America/Chicago';
select time, utilization from get_utilization_from_metrics_view(
  'Cutter',
  'controller/partOccurrence/part_count-all',
  timestamptz2ms('2021-12-29 18:00:00'),
  timestamptz2ms('2021-12-29 19:00:00')
--  timestamptz2ms('2021-12-29 20:00:00')
);

