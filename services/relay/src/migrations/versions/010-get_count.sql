-- get count of a value between a start and stop time.

-- basically the value at a stop time minus the value at a start time.
-- the counter needs to be an ever-increasing lifetime value.

-- example:
--  select count
--  from get_count(
--    'Cutter',
--    'controller/partOccurrence/part_count-lifetime',
--    timestamptz2ms('2022-02-01 18:00:00'),
--    timestamptz2ms('2022-02-02 18:00:00')
--  );
-- returns a count value like 154.0

-- need this if change parameters OR return signature
DROP FUNCTION IF EXISTS get_count(text, text, bigint, bigint);
DROP FUNCTION IF EXISTS get_count(text, text, bigint, bigint, text);

create or replace function get_count(
  in p_device text, -- the device name, eg 'Cutter'
  in p_path text, -- the counter path, eg 'controller/partOccurrence/part_count-lifetime'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint, -- stop time in milliseconds since 1970-01-01
  in p_search_limit text = '1 week' -- search limit for before start time - eg '1h', '1week' etc
)
returns table ("count" float)
language plpgsql
as
$body$
declare
  -- convert milliseconds to timestamp with timezone
  v_start timestamptz := ms2timestamptz(p_start);
  v_stop timestamptz := ms2timestamptz(p_stop);
  v_count0 float;
  v_count1 float;
  v_count2 float;
  v_count float;
begin
  -- get the last count value before the start time
  v_count0 := (
    select value from history_float 
    where 
      device=p_device 
      and path=p_path 
      and time <= v_start
      and time >= v_start - p_search_limit::interval
    order by time desc
    limit 1
  );
  -- get the first count value after the stop time
  v_count1 := (
    select value from history_float 
    where 
      device=p_device 
      and path=p_path 
      and time >= v_stop
      and time < v_stop + p_search_limit::interval
    order by time asc
    limit 1
  );
  -- get the last count value before the stop time
  v_count2 := (
    select value from history_float 
    where 
      device=p_device 
      and path=p_path 
      and time < v_stop
      and time > v_start
    order by time desc
    limit 1
  );
  -- the net count is count at stop time minus count at start time.
  -- coalesce(x, y) returns y if x is null.
  -- so use count 2 as a backup in case there's no value after the 
  -- stop time yet. 
  "count" := coalesce(v_count1, v_count2) - coalesce(v_count0, 0);
  return next;
end;
$body$;

-- test - don't commit!

-- select count
-- from get_count(
--   'Marumatsu',
--   'processes/job/part_count-all',
--   timestamptz2ms('2022-02-01 18:00:00'),
--   timestamptz2ms('2022-02-02 18:00:00')
-- );
