DROP FUNCTION IF EXISTS get_last_value(text, text, text);

CREATE OR REPLACE FUNCTION get_last_value (
  IN devicepath text, -- the device path, eg 'Main/Marumatsu'
  IN datapath text, -- the history view path, eg 'availability'
  IN search_limit text = '1d' -- search limit - don't search further into past than this
)
-- RETURNS TABLE ("time" timestamp, "value" text) -- ANSI standard SQL
RETURNS TABLE ("time" timestamptz, "value" text) -- ANSI standard SQL
LANGUAGE sql
AS
$BODY$

SELECT time, value
FROM history_all
WHERE
  device = devicepath
  and path = datapath
  and time > now() - search_limit::interval
ORDER BY time desc
LIMIT 1

$BODY$;

-- test fn
--.... turn off before committing

-- SELECT time, value 
-- FROM get_last_value(
--   'Main/Marumatsu',
--   'availability', 
--   '1week'
-- );

