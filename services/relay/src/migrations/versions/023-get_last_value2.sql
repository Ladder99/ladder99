DROP FUNCTION IF EXISTS get_last_value(text, text, text);
DROP FUNCTION IF EXISTS get_last_value(text, text);

CREATE OR REPLACE FUNCTION get_last_value (
  IN pathstring text, -- the history view path, eg 'Main/Micro/Availability'
  IN search_limit text = '1d' -- search limit - don't search further into past than this
)
RETURNS TABLE ("time" timestamptz, "value" text) -- ANSI standard SQL
LANGUAGE sql
AS
$BODY$

SELECT time, value
FROM history_all
WHERE
  path = pathstring
  and time > now() - search_limit::interval
ORDER BY time desc
LIMIT 1

$BODY$;

-- test fn
-- SELECT time, value 
-- FROM get_last_value(
--   'Main/Micro/Availability', 
--   '1w'
-- );

