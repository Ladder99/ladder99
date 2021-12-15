
-- returns true if given time is within a set of time windows
create or replace function is_time_within_windows(
  in p_time timestamptz, 
  in p_time_windows jsonb
)
returns boolean
as
$body$
declare
  foo timestamptz;
  bar timestamptz;
  pok timestamptz;
begin
  -- return case when max(p_value)>0 then 1 else 0 end;
  -- return case
  --   when <inwindow(time)> -- how do?
  --     case 
  --       when max(value) > 0 then 1
  --       else 0
  --     end
  --   else 0
  -- end;
  --. iterate over time windows, check if time falls within bounds
  --  if not, return false
--  foo := '2021-12-13 04:00';
--  bar := '2021-12-13 06:00';
  pok := date_trunc('day', p_time);
  foo := pok + interval '4h';
  bar := pok + interval '16h';
  raise notice '% % %', foo, bar, p_time;
  if not (p_time between foo and bar) then
  --if not (p_time >= foo and p_time <= bar) then
    return false;
  end if;
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
-- DROP FUNCTION IF EXISTS get_utilization(text, text, bigint, bigint);

create or replace function get_utilization (
  in p_device text, -- the device name, eg 'Cutter'
  in p_path text, -- path to monitor, eg 'controller/partOccurrence/part_count-all'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint, -- stop time in milliseconds since 1970-01-01
  --. and pass in some jsonb with time windows
  in p_time_windows jsonb = '{}'
)
returns table ("time" timestamptz, "uptime" float)
as
$body$
declare
  _start timestamptz := ms2timestamptz(p_start);
  _stop timestamptz := ms2timestamptz(p_stop);
  _range interval := _stop - _start;
  --. rename to _binsize
  --. choose _binsize based on _range size
  -- _timeblock_size text := '1 hour'; --. or '1 day' if interval > 1 day
  -- _timeblock_size := case when (_range > interval '1 day') then interval '1 day' else interval '1 hour' end;
  _timeblock_size interval := interval '1 hour';
begin
  return query
    -- this cte query gives 1 for each minute where there's a partcount event,
    -- else 0. so it uses any increase in partcount to tell if the machine was 
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
    --. only want to include the small timebins that are within the time windows.
    -- how do that?
    select
      -- note: don't need to use time_bucket_gapfill here as the small
      -- timebucket above includes all hour buckets.
      time_bucket(_timeblock_size, small_bin) as time, -- aka big_bin
      (sum(value) / 60.0)::float as utilization --. assumes 60mins avail! fix
    from cte
    where is_time_within_windows(small_bin, p_time_windows)
    group by time
    order by time;
end;
$body$
language plpgsql;


-- test fn

select * from get_utilization(
 'Cutter',
 'controller/partOccurrence/part_count-all',
  timestamptz2ms('2021-12-13'),
  timestamptz2ms('2021-12-14'),
-- timestamptz2ms(date_trunc('day', now())), -- midnight
-- timestamptz2ms(now()), -- now
  '[{"start": "4h", "stop":"16h"}]'
)
