
-- tables, views, and functions to support metrics like utilization


---------------------------------------------------------------------
-- bins table
---------------------------------------------------------------------
-- store data for metrics

create table if not exists bins (
  device_id integer references nodes, -- node_id of a device
  resolution interval, -- 1min, 1hr, 1day, 1week, 1month, 1quarter, 1year
  time timestamptz, -- rounded down to start of current minute, hour, day, etc
  active int, -- number of minutes device was active during time resolution
  available int, -- number of minutes device was available during time resolution
  primary key (device_id, resolution, time) -- need this so can find right record quickly for updating
);


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
from bins
join nodes as devices on bins.device_id = devices.node_id;


---------------------------------------------------------------------
-- get_active fn
---------------------------------------------------------------------
-- check for events on given device and path in a time range.
-- returns true if any events.
--. what about unavailable events - ignore those?

create or replace function get_active(
  p_device text, -- device name
  p_path text, -- dataitem path to check for activity
  p_start timestamptz,
  p_stop timestamptz
)
returns boolean
language sql
as
$body$
  select 
    count(value) > 0 as active
  from 
    history_all
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
  in p_device_id int, -- device node_id to update
  in p_time timestamptz, -- time to increment - will add for ALL resolutions
  in p_field text, -- bins field to update
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
--call increment_bins(11, '2021-12-30 05:00:00', 'available');



---------------------------------------------------------------------
-- is_time_scheduled fn
---------------------------------------------------------------------
-- returns true if given time is in the work/holiday schedule.

-- p_schedule is a jsonb object with day 1 = monday - eg 
-- '{
--   "work_windows": [
--     {"day":1, "start":"5:00", "stop":"15:30"},
--     {"day":2, "start":"5:00", "stop":"15:30"},
--     {"day":3, "start":"5:00", "stop":"15:30"},
--     {"day":4, "start":"5:00", "stop":"15:30"},
--     {"day":5, "start":"5:00", "stop":"13:30"},
--     {"day":6, "start":"5:00", "stop":"13:00"}
--   ],
--   "holidays": [
--     "2021-12-25"
--   ]
-- }'

create or replace function is_time_scheduled(
  in p_time timestamptz
--  , 
--  in p_schedule jsonb
)
returns boolean
language plpgsql
as
$body$
declare
  v_date date;
  v_holiday date;
  v_work_window jsonb;
  v_day_of_week int;
  v_base timestamptz;
  v_start timestamptz;
  v_stop timestamptz;
  v_schedule jsonb := '{
    "work_windows": [
      {"day":1, "start":"5:00", "stop":"15:30"},
      {"day":2, "start":"5:00", "stop":"15:30"},
      {"day":3, "start":"5:00", "stop":"15:30"},
      {"day":4, "start":"5:00", "stop":"15:30"},
      {"day":5, "start":"5:00", "stop":"13:30"},
      {"day":6, "start":"5:00", "stop":"13:00"}
    ],
    "holidays": [
      "2021-12-25"
    ]
  }';
begin
  
  -- first, check if day is a holiday
  
  -- get time as a pure date, eg '2021-12-25'
  v_date := p_time::date;

  -- iterate over holidays
  for v_holiday in select * from jsonb_array_elements(v_schedule->'holidays') loop
    raise notice 'holiday %', v_holiday;
    if v_date = v_holiday then
      -- raise notice 'it''s a holiday!';
      return false; -- return false if on a holiday
    end if;
  end loop;

  -- now, check if time is within any scheduled work hours

  v_day_of_week := extract(dow from p_time); -- 1-7, with 1=monday
  v_base := date_trunc('day', p_time); -- midnight of day

  -- iterate over work windows
  for v_work_window in select * from jsonb_array_elements(v_schedule->'work_windows') loop
    -- raise notice 'work window %', v_work_window;
  
    -- check for matching day of week
    if v_day_of_week = (v_work_window->'day')::int then

      -- get start and stop times for this window - eg 5am-330pm of p_time's day 
      v_start := v_base + (v_work_window->>'start')::interval; -- eg v_base + interval '4h'
      v_stop  := v_base + (v_work_window->>'stop')::interval;

      -- raise notice 'checking times % to %', v_start, v_stop;
    
      -- if time within bounds, return true
      if (p_time between v_start and v_stop) then
        -- raise notice 'in bounds!';
        return true;
      end if;
  
    end if;
  end loop;

  -- not within a work window, so return false
  return false;
end;
$body$;


--. set a global variable/constant for schedule to be used later also?
--. how run tests here? raise notice of pass/fail or t/f?

select is_time_scheduled(
  '2021-12-18 12:30:00'
--,
--  '{
--    "work_windows": [
--      {"day":1, "start":"5:00", "stop":"15:30"},
--      {"day":2, "start":"5:00", "stop":"15:30"},
--      {"day":3, "start":"5:00", "stop":"15:30"},
--      {"day":4, "start":"5:00", "stop":"15:30"},
--      {"day":5, "start":"5:00", "stop":"13:30"},
--      {"day":6, "start":"5:00", "stop":"13:00"}
--    ],
--    "holidays": [
--      "2021-12-25"
--    ]
--  }'
);


--insert into meta (name, value) values ('schedule1', 
--  '{
--    "work_windows": [
--      {"day":1, "start":"5:00", "stop":"15:30"},
--      {"day":2, "start":"5:00", "stop":"15:30"},
--      {"day":3, "start":"5:00", "stop":"15:30"},
--      {"day":4, "start":"5:00", "stop":"15:30"},
--      {"day":5, "start":"5:00", "stop":"13:30"},
--      {"day":6, "start":"5:00", "stop":"13:00"}
--    ],
--    "holidays": [
--      "2021-12-25"
--    ]
--  }'
--);



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
  v_path text := config->>'path'; -- eg 'controller/partOccurrence/part_count-all'
  -- v_schedule jsonb := config->>'schedule'; -- null if not included
  v_time timestamptz := coalesce((config->>'time')::timestamptz, now()); -- ie default to now()
  v_interval interval := coalesce(config->>'interval', '1 minute'); -- ie default is 1 minute
  v_stop timestamptz := date_trunc('minute', v_time); -- round down to top of current minute --. or hour etc
  v_start timestamptz := v_stop - interval '1 minute'; -- start at previous minute --. or hour etc
  v_is_time_in_schedule boolean;
  v_was_machine_active boolean;
begin
  -- check if time is within the time windows.
  -- v_is_time_in_schedule := is_time_in_schedule(v_time, v_schedule);
  v_is_time_in_schedule := is_time_in_schedule(v_time);
  if v_is_time_in_schedule then
    -- loop over relevant devices, as passed through config.
    -- note: jsonb_array_elements returns values with double quotes around them, so use _text.
    for v_device in select * from jsonb_array_elements_text(config->'devices') loop
      -- get device_id from devices view - this is a simple lookup
      execute 'select node_id from devices where name = $1' into v_device_id using v_device;
      -- check if any part_count events were within the previous time interval (eg minute).
      v_was_machine_active := get_active(v_device, v_path, v_start, v_stop);
      if v_was_machine_active then
        call increment_bins(v_device_id, v_stop, 'active');
      end if;
      call increment_bins(v_device_id, v_stop, 'available');
    end loop;
  end if;
end;
$body$;


-- test

-- call update_metrics(null,
--   config => '{
--     "devices": ["Cutter"],
--     "path": "controller/partOccurrence/part_count-all", 
--     "interval": "1 min"
--   }'
-- );

-- User-defined actions allow you to run functions and procedures implemented 
-- in a language of your choice on a schedule within TimescaleDB.
-- https://docs.timescale.com/timescaledb/latest/overview/core-concepts/user-defined-actions
-- https://docs.timescale.com/api/latest/actions/add_job

-- add a scheduled job
--... don't do this if job is already running - need guard

-- select add_job(
--   'update_metrics', -- function/procedure to call 
--   '1 min', -- interval
--   config => '{
--     "devices": ["Cutter"],
--     "path": "controller/partOccurrence/part_count-all", 
--     "interval": "1 min"
--   }',
--   initial_start => date_trunc('minute', now()) + interval '1 minute' -- start at top of next minute
-- );

-- -- https://docs.timescale.com/api/latest/informational-views/job_stats
-- select job_id, total_runs, total_failures, total_successes from timescaledb_information.job_stats;

-- --select delete_job(1015);



---------------------------------------------------------------------
-- get_utilization_from_metrics_view fn
---------------------------------------------------------------------
-- get percent of time a device is active vs available.
-- chooses a resolution (hour, day, etc) based on time range.

-- call it from grafana like so - 
--   set timezone to 'America/Chicago';
--   select time, utilization 
--   from get_utilization_from_metrics_view('Cutter', $__from, $__to)

--drop function get_utilization_from_metrics_view;

create or replace function get_utilization_from_metrics_view(
  in p_device text, -- the device name, eg 'Cutter'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint -- stop time in milliseconds since 1970-01-01
)
returns table ("time" timestamptz, "utilization" float)
language plpgsql
as
$body$
declare
  v_start timestamptz := ms2timestamptz(p_start);
  v_stop timestamptz := ms2timestamptz(p_stop);
  v_range interval := v_stop - v_start;
  -- choose v_binsize based on v_range size
  v_binsize interval := case 
    when (v_range > interval '2 months') then '1 month'
    when (v_range > interval '2 weeks') then '1 week'
    when (v_range > interval '2 days') then '1 day'
    when (v_range > interval '2 hours') then '1 hour'
    else '1 minute' --. 5 mins
  end;
begin
  return query
    select 
      metrics.time, metrics.utilization
    from 
      metrics
    where 
      metrics.device = p_device
      and resolution = v_binsize
      and metrics.time between v_start and v_stop
    order by 
      time
    ;
end;
$body$;



-- --set timezone to 'America/Chicago';
-- select time, utilization 
-- from get_utilization_from_metrics_view(
--   'Cutter',
--   timestamptz2ms('2021-12-29 18:00:00'),
--   timestamptz2ms('2021-12-29 19:00:00')
-- --  timestamptz2ms('2021-12-29 20:00:00')
-- );




---------------------------------------------------------------------
-- populate_bins fn
---------------------------------------------------------------------
-- populate the bins table for a time range

--drop procedure populate_bins;

create or replace procedure populate_bins(
  in p_device text, -- the device name, eg 'Cutter'
  in p_path text, -- dataitem path, eg 'controller/partOccurrence/part_count-all'
  in p_schedule jsonb,
  in p_start timestamptz,
  in p_stop timestamptz
)
language plpgsql
as
$body$
declare
  v_time timestamptz;
begin
  --. iterate over time range and call update_metrics
  for v_time in select generate_series(p_start::date, p_stop, '1 day') loop
    raise notice '%', v_time;
--    update_metrics();
  end loop;
end
$body$;


-- call populate_bins(
--   'Cutter', 
--   'controller/partOccurrence/part_count-all',
--   '{
--     "work_windows": [
--       {"day":1, "start":"5:00", "stop":"15:30"},
--       {"day":2, "start":"5:00", "stop":"15:30"},
--       {"day":3, "start":"5:00", "stop":"15:30"},
--       {"day":4, "start":"5:00", "stop":"15:30"},
--       {"day":5, "start":"5:00", "stop":"13:30"},
--       {"day":6, "start":"5:00", "stop":"13:00"}
--     ],
--     "holidays": [
--       "2021-12-25"
--     ]
--   }',
--   '2021-11-01', 
--   now()
-- );


