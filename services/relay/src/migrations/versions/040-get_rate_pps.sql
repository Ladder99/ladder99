-- get rate of change of a value in parts per second,
-- with (delta count) / (delta time).
-- this replaces 007-get_rate.sql

drop function if exists get_rate(text, text, bigint, bigint);

create or replace function get_rate_pps (
  in p_device text, -- the device name, eg 'Jumbo'
  in p_path text, -- the history view path, eg 'processes/life/part_count-all'
  in p_from bigint, -- start time in milliseconds since 1970-01-01
  in p_to bigint -- end time in milliseconds since 1970-01-01
)
returns table ("time" timestamptz, "rate_pps" float) -- ansi standard sql
language sql
as
$body$
with
  -- first define some sql variables
  -- referenced below with eg '(table v_from_time)'
  v_from_time as (values (ms2timestamptz(p_from))),
  v_to_time as (values (ms2timestamptz(p_to))),
  -- cte is a common table expression, kind of a pre-query.
  cte1 as (
    -- use lag function to get previous values for time and value.
    -- note: 'extract(epoch ...)' gives seconds since 1970
    select
      time,
      extract(epoch from time) as time0,
      value as value0,
      lag(extract(epoch from time), 1) over (order by time) as time1,
      lag(value, 1) over (order by time) as value1
    from history_float
    where
      device = p_device
      and path = p_path
      and time between (table v_from_time) and (table v_to_time)
  )
select 
  time,
  ((value0 - value1) / nullif(time0 - time1, 0)) as rate_pps
from cte1
$body$;
