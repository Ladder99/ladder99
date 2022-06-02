---------------------------------------------------------------------
-- get_timeline
---------------------------------------------------------------------

-- get data for a timeline view (eg the 'discrete' plugin for grafana).
-- like a regular query but also gets the last value before the start time,
-- and assigns it to that start time.
-- returns time, value, with value being text, coerced from top-level jsonb value,
-- as obtained from the history_all view.

-- use from grafana like
--   SELECT time, value AS "Availability" 
--   FROM get_timeline('Line$line', 'availability', $__from, $__to);

-- need this if change parameters OR return signature
DROP FUNCTION IF EXISTS get_timeline(text, text, bigint, bigint, boolean);
DROP FUNCTION IF EXISTS get_timeline(text, text, bigint, bigint, boolean, text);

-- CREATE OR REPLACE FUNCTION get_timeline (
--   IN devicename text, -- the device name, eg 'Line1'
--   IN pathname text, -- the history view path, eg 'availability'
--   IN from_ms bigint, -- start time in milliseconds since 1970-01-01
--   IN to_ms bigint, -- end time in milliseconds since 1970-01-01
--   IN clamp boolean = TRUE, -- return left edge as first time 
--   IN search_limit text = '1w' -- search limit - don't search further into past than this
-- )
-- RETURNS TABLE ("time" timestamp, "value" text) -- ANSI standard SQL
-- LANGUAGE sql
-- AS
-- $BODY$
-- -- this union query gets the regular data for the graph,
-- -- then tacks on the value for the left edge.
-- -- first define some SQL variables
-- -- referenced below with eg '(TABLE from_time)'
-- WITH
--   from_time AS (VALUES (to_timestamp(cast(from_ms/1000 as bigint))::timestamp)),
--   to_time AS (VALUES (to_timestamp(cast(to_ms/1000 as bigint))::timestamp))
-- -- do a straightforward query for time and value for the 
-- -- given device, path, and timestamp
-- SELECT time, value->>0 AS value -- note: ->>0 extracts the top-level jsonb value
-- FROM history_all
-- WHERE
--   device = devicename and
--   path = pathname and
--   time >= (TABLE from_time) and
--   time <= (TABLE to_time)
-- -- now tack on the time and value for the left edge with a UNION query
-- UNION
-- SELECT time, value->>0 AS value -- note: ->>0 extracts the top-level jsonb value
-- FROM
--   -- need this subquery so can order the results by time descending,
--   -- so can get the last value before the left edge.
--   (
--   SELECT
--     --(TABLE from_time) as time,
--     CASE WHEN clamp THEN (TABLE from_time) ELSE history_all.time END AS time,
--     value
--   FROM history_all
--   WHERE
--     device = devicename
--     and path = pathname
--     and time <= (TABLE from_time)
--     and time >= (TABLE from_time) - search_limit::interval
--   ORDER BY history_all.time DESC
--   LIMIT 1 -- just want the last value
--   ) AS subquery1 -- subquery name is required but not used
-- ORDER BY time -- sort the combined query results
-- $BODY$;

CREATE OR REPLACE FUNCTION get_timeline (
  IN devicename text, -- the device name, eg 'Line1'
  IN pathname text, -- the history view path, eg 'availability'
  IN from_ms bigint, -- start time in milliseconds since 1970-01-01
  IN to_ms bigint, -- end time in milliseconds since 1970-01-01
  IN clamp boolean = TRUE, -- return left edge as first time 
  IN search_limit text = '1w' -- search limit - don't search further into past than this
)
RETURNS TABLE ("time" timestamptz, "value" text) -- ANSI standard SQL
LANGUAGE plpgsql
AS
$BODY$
-- this union query gets the regular data for the graph,
-- then tacks on the value for the left edge.
-- first define some SQL variables
-- referenced below with eg '(TABLE from_time)'
DECLARE
  from_time timestamptz := ms2timestamptz(from_ms);
  to_time timestamptz := ms2timestamptz(to_ms);
BEGIN
-- do a straightforward query for time and value for the 
-- given device, path, and timestamp
RETURN QUERY
SELECT history_all.time, history_all.value->>0 AS value -- note: ->>0 extracts the top-level jsonb value
FROM history_all
WHERE
  device = devicename and
  path = pathname and
  history_all.time >= from_time and
  history_all.time <= to_time
-- now tack on the time and value for the left edge with a UNION query
UNION
SELECT timex as time, valuex->>0 AS value -- note: ->>0 extracts the top-level jsonb value
FROM
  -- need this subquery so can order the results by time descending,
  -- so can get the last value before the left edge.
  (
  SELECT
    CASE WHEN clamp THEN from_time ELSE history_all.time END AS timex,
    history_all.value as valuex
  FROM history_all
  WHERE
    device = devicename
    and path = pathname
    and history_all.time <= from_time
    and history_all.time >= from_time - search_limit::interval
  ORDER BY history_all.time DESC
  LIMIT 1 -- just want the last value
  ) AS subquery1 -- subquery name is required but not used
ORDER BY time; -- sort the combined query results
-- handle case where no data found
-- see https://stackoverflow.com/questions/39162608/postgres-conditional-union
-- because grafana needs SOMETHING to work with, or else leaves tooltips everywhere
IF NOT FOUND THEN
  RETURN QUERY SELECT from_time as time, null as value;
END IF;
END;
$BODY$;


-- test fn
--.... turn off before committing
-- select * from get_timeline(
-- 	'Marumatsu', 
-- 	'availability',
-- 	timestamptz2ms('2022-04-01'),
-- 	timestamptz2ms('2022-05-05')
-- )
