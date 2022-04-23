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

CREATE OR REPLACE FUNCTION get_timeline (
  IN devicename text, -- the device name, eg 'Line1'
  IN pathname text, -- the history view path, eg 'availability'
  IN from_ms bigint, -- start time in milliseconds since 1970-01-01
  IN to_ms bigint, -- end time in milliseconds since 1970-01-01
  IN clamp boolean = TRUE, -- return left edge as first time 
  IN search_limit text = '1h' -- search limit - don't search further into past than this
)
RETURNS TABLE ("time" timestamp, "value" text) -- ANSI standard SQL
LANGUAGE sql
AS
$BODY$
-- this union query gets the regular data for the graph,
-- then tacks on the value for the left edge.
-- first define some SQL variables
-- referenced below with eg '(TABLE from_time)'
WITH
  from_time AS (VALUES (to_timestamp(cast(from_ms/1000 as bigint))::timestamp)),
  to_time AS (VALUES (to_timestamp(cast(to_ms/1000 as bigint))::timestamp))
-- do a straightforward query for time and value for the 
-- given device, path, and timestamp
SELECT time, value->>0 AS value -- note: ->>0 extracts the top-level jsonb value
FROM history_all
WHERE
  device = devicename and
  path = pathname and
  time >= (TABLE from_time) and
  time <= (TABLE to_time)
-- now tack on the time and value for the left edge with a UNION query
UNION
SELECT time, value->>0 AS value -- note: ->>0 extracts the top-level jsonb value
FROM
  -- need this subquery so can order the results by time descending,
  -- so can get the last value before the left edge.
  (
  SELECT
    --(TABLE from_time) as time,
    CASE WHEN clamp THEN (TABLE from_time) ELSE history_all.time END AS time,
    value
  FROM history_all
  WHERE
    device = devicename
    and path = pathname
    and time <= (TABLE from_time)
    and time >= (TABLE from_time) - search_limit::interval
  ORDER BY history_all.time DESC
  LIMIT 1 -- just want the last value
  ) AS subquery1 -- subquery name is required but not used
ORDER BY time -- sort the combined query results
$BODY$;


-- test fn
--.... turn off before committing

-- WITH
--   p_day AS (VALUES ('2022-04-21'::date)),
--   p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
--   p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '1 week') * 1000)::bigint))
-- SELECT time, value AS "Sales Order" 
-- FROM get_timeline(
--   'Marumatsu',
--   'availability', 
--   (table p_from), 
--   (table p_to)
-- );

