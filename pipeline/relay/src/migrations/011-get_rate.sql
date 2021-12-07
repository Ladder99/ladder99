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
--   FROM get_rate('Slitter', 'part_count', $__from, $__to);

-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_rate(text, text, bigint, bigint);

CREATE OR REPLACE FUNCTION get_rate (
  IN p_device text, -- the device name, eg 'Line1'
  IN p_path text, -- the history view path, eg 'availability'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- end time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, "rate" float) -- ANSI standard SQL
LANGUAGE sql
AS
$BODY$
-- first define some SQL variables
-- referenced below with eg '(TABLE _from_time)'
WITH
  _from_time AS (VALUES (to_timestamp(cast(p_from/1000 as bigint))::timestamp)),
  _to_time AS (VALUES (to_timestamp(cast(p_to/1000 as bigint))::timestamp)),
  -- cte is a common table expression
  -- 'extract epoch' gives seconds since 1970
  cte1 AS (
    -- use LAG function to get previous values for time0 and value0
    SELECT
      time,
      EXTRACT(epoch FROM time) AS time1,
      value AS value1,
      LAG(EXTRACT(epoch FROM time), 1) OVER (ORDER BY time) AS time0,
      LAG(value, 1) OVER (ORDER BY time) AS value0
    FROM history_float
    WHERE
      device = p_device and
      path = p_path and
      time >= (TABLE _from_time) and
      time <= (TABLE _to_time)
  ), 
  cte2 AS (
    SELECT 
      time,
      (value1 - value0) / (time1 - time0) AS rate0
    FROM cte1
  )
SELECT 
  time,
  CASE WHEN rate0 < 0 THEN NULL ELSE rate0 END AS rate
FROM cte2
$BODY$;


-- test fn
--.... turn off before committing

-- WITH
-- --  p_day AS (VALUES ('2021-12-06 03:42:58.931'::date)),
--   p_day AS (VALUES (now())),
--   p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) - INTERVAL '1 min') * 1000)::bigint)),
--   p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint))
-- SELECT time, rate
-- FROM get_rate(
--   'Slitter', 
--   'controller/partOccurrence/part_count-all', 
--   (table p_from), 
--   (table p_to)
-- )
-- ORDER BY time DESC
-- ;
