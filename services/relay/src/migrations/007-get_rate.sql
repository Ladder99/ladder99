---------------------------------------------------------------------
-- get_rate
---------------------------------------------------------------------

-- get rate of change in a value, in count/second.

-- returns data like eg
--  time, rate
--  <time>, null
--  <time>, 2.0
--  <time>, 0.1

-- can multiply rate by 60 to get count/minute, or 3600 for count/hour.

-- use from grafana like
--   SELECT time, rate * 60 AS "Production Rate (count/minute)"
--   FROM get_rate('Cutter', 'part_count', $__from, $__to);

-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_rate(text, text, bigint, bigint);

-- note: first made this with value vs value-1, then value, value-1, value-2,
-- but neither gave smooth enough averaging. 
-- so moving to get_rate2, which will walk over the history, getting an 
-- nth order average at each point.
CREATE OR REPLACE FUNCTION get_rate (
  IN p_device text, -- the device name, eg 'Cutter'
  IN p_path text, -- the history view path, eg 'part_count'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- end time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, "rate" float) -- ANSI standard SQL
LANGUAGE sql --. ansi SQL? postgres SQL?
AS
$BODY$
-- first define some SQL variables
-- referenced below with eg '(TABLE _from_time)'
WITH
  --. use ms2timestamptz, then change grafana query so doesn't set timezone
  _from_time AS (VALUES (to_timestamp(cast(p_from/1000 as bigint))::timestamp)),
  _to_time AS (VALUES (to_timestamp(cast(p_to/1000 as bigint))::timestamp)),
  -- cte is a common table expression, kind of a pre-query.
  cte1 AS (
    -- use LAG function to get previous values for time and value.
    --. would be more efficient to walk over the history values ONCE to calculate this.
    -- note: 'extract(epoch ...)' gives seconds since 1970
    SELECT
      time,
      EXTRACT(epoch FROM time) AS time0,
      value AS value0,
      LAG(EXTRACT(epoch FROM time), 1) OVER (ORDER BY time) AS time1,
      LAG(value, 1) OVER (ORDER BY time) AS value1,
      LAG(EXTRACT(epoch FROM time), 2) OVER (ORDER BY time) AS time2,
      LAG(value, 2) OVER (ORDER BY time) AS value2
    FROM history_float
    WHERE
      device = p_device
      and path = p_path
      and time >= (TABLE _from_time)
      and time <= (TABLE _to_time)
  )
SELECT 
  time,
  -- CASE WHEN rate0 < 0 THEN NULL ELSE rate0 END AS rate
  ((value0 - value1) / NULLIF(time0 - time1, 0) + 
    (value1 - value2) / NULLIF(time1 - time2, 0)) / 2 AS rate

FROM cte1
$BODY$;


-- test fn
--.... turn off before committing

-- WITH
--   p_day AS (VALUES ('2021-12-06 03:42:58.931'::date)),
-- --  p_day AS (VALUES (now())),
--   p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) - INTERVAL '1 day') * 1000)::bigint)),
--   p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint))
-- SELECT time, rate
-- FROM get_rate(
--   'Cutter', 
--   'controller/partOccurrence/part_count-all', 
--   (table p_from), 
--   (table p_to)
-- )
-- ORDER BY time DESC
-- LIMIT 100
-- ;




-- on second thought, better to make this a metric and run from 
-- the meter service.
-- no postgres dependency, no migration issues, faster dashboard,
-- lower server load.

-- create or replace function get_rate2(
--   in p_device text, -- the device name, eg 'Cutter'
--   in p_path text, -- the value path, eg 'controller/partOccurrence/part_count-lifetime'
--   in p_start bigint, -- start time in milliseconds since 1970-01-01
--   in p_stop bigint -- stop time in milliseconds since 1970-01-01
-- )
-- returns table ("time" timestamp, "rate" float)
-- language plpgsql
-- as
-- $body$
-- declare
--   v_start timestamptz := ms2timestamptz(p_start);
--   v_stop timestamptz := ms2timestamptz(p_stop);
  
--   v_time float;
--   v_value float;
  
--   v_time0 float;
--   v_value0 float;
--   v_rate0 float;
  
--   v_time1 float;
--   v_value1 float;
--   v_rate1 float;
  
--   v_time2 float;
--   v_value2 float;
--   v_rate2 float;

--   v_rate float;
-- begin
--   for v_time, v_value in (
--     select 
--       time, value 
--     from 
--       history_float 
--     where 
--       device = p_device
--       and path = p_path
--       and time >= v_start
--       and time <= v_stop;
--   )
--   loop
--     v_time0 := extract(epoch from v_time); -- get seconds since 1970
--     v_value0 := v_value;

--     -- v_time 

--     "time" := v_time0;
--     "rate" := v_rate0;
--     return next;
--     -- shift records down by one
--     v_time2 := v_time1;
--     v_value2 := v_value1;
--     v_time1 := v_time0;
--     v_value1 := v_value0;
--   end loop;
-- end;
-- $body$;
