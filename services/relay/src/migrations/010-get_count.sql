-- get an accumulated count between a start and stop time

create or replace function get_count(
  in p_device text, -- the device name, eg 'Cutter'
  in p_path text, -- the counter path, eg 'controller/partOccurrence/part_count-lifetime'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint -- stop time in milliseconds since 1970-01-01
)
returns table ("count" float)
as
$body$
declare
  v_start timestamptz := ms2timestamptz(p_start);
  v_stop timestamptz := ms2timestamptz(p_stop);
  v_count0 float;
  v_count1 float;
  v_count2 float;
  v_count float;
begin
  v_count0 := (
    select value from history_float 
    where device=p_device and path=p_path and time < v_start
    order by time desc
    limit 1
  );
  v_count1 := (
    select value from history_float 
    where device=p_device and path=p_path and time >= v_stop
    order by time asc
    limit 1
  );
  v_count2 := (
    select value from history_float 
    where device=p_device and path=p_path and time < v_stop
    order by time desc
    limit 1
  );
  "count" := coalesce(v_count1, v_count2) - coalesce(v_count0, 0);
  return next;
end;
$body$
language plpgsql;

-- test
--  select count
--  from get_count(
--    'Cutter',
--    'controller/partOccurrence/part_count-lifetime',
--    timestamptz2ms('2022-02-01 18:00:00'),
--    timestamptz2ms('2022-02-02 18:00:00')
--  );
