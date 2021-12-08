---------------------------------------------------------------------
-- get_uptime2
---------------------------------------------------------------------

-- get percent of time a device is active

-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_uptime2(text, text, bigint, bigint);

create or replace function get_uptime2 (
  in p_device text, -- the device name, eg 'Slitter'
  in p_path text, -- path to monitor, eg 'controller/partOccurrence/part_count-all'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint -- stop time in milliseconds since 1970-01-01
)
returns table ("time" timestamptz, "uptime" float)
as
$body$
declare
  -- _timeblock_size text := '1 hour'; --. or '1 day' if interval > 1 day
  _timeblock_size interval;
  _start timestamptz := ms2timestamptz(p_start);
  _stop timestamptz := ms2timestamptz(p_stop);
  _range interval := _stop - _start;
begin
  _timeblock_size := case when (_range > interval '1 day') then interval '1 day' else interval '1 hour' end;
  raise notice 'start type %', pg_typeof(_start);
  return query
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
      -- note: don't need to use time_bucket_gapfill here as the small
      -- timebucket above includes all hour buckets.
      time_bucket(_timeblock_size, small_bin) as time, -- aka big_bin
      (sum(value) / 60.0)::float as uptime --. assumes 60mins avail! fix
    from cte 
    group by time
    order by time;
end;
$body$
language plpgsql;


-- test fn

-- select * from get_uptime2(
--  'Slitter',
--  'controller/partOccurrence/part_count-all',
--  timestamptz2ms('2021-12-06'),
--  timestamptz2ms('2021-12-07')
-- )
