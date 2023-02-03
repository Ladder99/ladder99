---------------------------------------------------------------------
-- get_rate
---------------------------------------------------------------------

-- get rate of change in a value, in count/second.

--. better to make this a metric and run from the meter service.
-- no postgres dependency, no migration issues, faster dashboard,
-- lower server load.
-- AND could have the rate as a dataitem.

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

-- superceded by 040-get_rate_pps.sql
CREATE OR REPLACE FUNCTION get_rate (
  IN p_device text, -- the device name, eg 'Cutter'
  IN p_path text, -- the history view path, eg 'part_count'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- end time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, "rate" float) -- ANSI standard SQL
LANGUAGE sql
AS
$BODY$
WITH
  -- first define some SQL variables
  -- referenced below with eg '(TABLE _from_time)'
  --. use ms2timestamptz
  _from_time AS (VALUES (to_timestamp(cast(p_from/1000 as bigint))::timestamp)),
  _to_time AS (VALUES (to_timestamp(cast(p_to/1000 as bigint))::timestamp)),
  -- cte is a common table expression, kind of a pre-query.
  cte1 AS (
    -- use LAG function to get previous values for time and value.
    --. would be more efficient to walk over the history values ONCE to calculate this.
    -- 'extract epoch' gives seconds since 1970
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
  ((value0 - value1) / NULLIF(time0 - time1, 0) + 
    (value1 - value2) / NULLIF(time1 - time2, 0)) / 2 AS rate

FROM cte1
$BODY$;
