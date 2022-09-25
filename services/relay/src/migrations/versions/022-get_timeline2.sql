-- need this if change parameters OR return signature
DROP FUNCTION IF EXISTS get_timeline(text, text, bigint, bigint, boolean, text);

CREATE OR REPLACE FUNCTION get_timeline (
  IN devicepath text, -- the device path, eg 'Main/Micro'
  IN datapath text, -- the history view subpath, eg 'Main/Micro/Availability' -- yeah, eh
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
SELECT history_text.time, history_text.value
FROM history_text
WHERE
  device = devicepath and
  path = datapath and
  history_text.time >= from_time and
  history_text.time <= to_time
-- now tack on the time and value for the left edge with a UNION query
UNION
SELECT timex as time, valuex as value
FROM
  -- need this subquery so can order the results by time descending,
  -- so can get the last value before the left edge.
  (
  SELECT
    CASE WHEN clamp THEN from_time ELSE history_text.time END AS timex,
    history_text.value as valuex
  FROM history_text
  WHERE
    device = devicepath
    and path = datapath
    and history_text.time <= from_time
    and history_text.time >= from_time - search_limit::interval
  ORDER BY history_text.time DESC
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
-- 	'Main/Marumatsu', 
-- 	'availability',
-- 	timestamptz2ms('2022-04-01'),
-- 	timestamptz2ms('2022-05-05')
-- )

