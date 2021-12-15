---------------------------------------------------------------------
-- is_time_within_windows
---------------------------------------------------------------------

-- returns true if given time is within a set of time windows.

-- p_windows is a jsonb array of { timeframe, start, stop }, eg 
--   [
--     { timeframe: 'day', start: '4h', stop: '16h' }, -- 4a-4p
--     { timeframe: 'week', start: '0d', stop: '4d' } -- mon-fri
--   ]

-- drop function is_time_within_windows(timestamptz, jsonb);

create or replace function is_time_within_windows(
  in p_time timestamptz, 
  in p_windows jsonb
)
returns boolean
as
$body$
declare
  _window jsonb;
  _base timestamptz;
  _start timestamptz;
  _stop timestamptz;
begin
  -- iterate over time windows
  for _window in select * from jsonb_array_elements(p_windows)
  loop
    -- get base time for this window -
    -- eg timeframe of 'day' gives midnight of p_time's day,
    -- timeframe of 'week' gives monday midnight, etc.
    _base := date_trunc(_window->>'timeframe', p_time);

    -- get start and stop times for this window - eg 4am-4pm of p_time's day 
    _start := _base + (_window->>'start')::interval; -- eg _base + interval '4h'
    _stop := least(now(), _base + (_window->>'stop')::interval); -- use now if not to the stop time

    -- if time not within bounds, return false
    if not (p_time between _start and _stop) then
      return false;
    end if;
  end loop;

  -- passed all tests, so return true
  return true;
end;
$body$
language plpgsql;



---------------------------------------------------------------------
-- get_utilization
---------------------------------------------------------------------

-- get percent of time a device is active vs available

-- do this if change parameters OR return signature
-- drop function if exists get_utilization(text, text, bigint, bigint, jsonb);

create or replace function get_utilization (
  in p_device text, -- the device name, eg 'Cutter'
  in p_path text, -- path to monitor, eg 'controller/partOccurrence/part_count-all'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint, -- stop time in milliseconds since 1970-01-01
  in p_time_windows jsonb = '[]' -- see is_time_within_windows fn
)
returns table ("time" timestamptz, "utilization" float)
as
$body$
declare
  _start timestamptz := ms2timestamptz(p_start);
  _stop timestamptz := ms2timestamptz(p_stop);
  _range interval := _stop - _start;
  --. choose _binsize based on _range size
  -- _binsize := case when (_range > interval '1 day') then interval '1 day' else interval '1 hour' end;
  _binsize interval := interval '1 hour';
  _factor float := 1.0 / 60.0; --. assumes 60mins avail per bin
begin
  return query
    -- this cte query gives 1 for each minute where there's a partcount event,
    -- else 0. so it uses any change in partcount to tell if the machine was 
    -- on during each minute.
    with cte as (
      select
        time_bucket_gapfill('1 min', history_float.time, _start, _stop) as small_bin, 
        case when max(value)>0 then 1 else 0 end as value
      from history_float
      where 
        device = p_device
        and path = p_path
        and history_float.time >= _start
        and history_float.time <= _stop
      group by small_bin
    )
    select
      time_bucket_gapfill(_binsize, small_bin, _start, _stop) as time,
      (sum(value) * _factor)::float as utilization
    from cte
    where is_time_within_windows(small_bin, p_time_windows)
    group by time
    order by time;
end;
$body$
language plpgsql;


-- test fn

select time, utilization from get_utilization(
 'Cutter',
 'controller/partOccurrence/part_count-all',
  timestamptz2ms('2021-12-13'),
  timestamptz2ms('2021-12-15'),
--  timestamptz2ms(now()),
  '[
    {"timeframe": "day", "start": "4h", "stop": "16h"},
    {"timeframe": "week", "start": "0d", "stop": "4d"} 
  ]'::jsonb
)
