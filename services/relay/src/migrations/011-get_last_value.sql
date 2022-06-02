---------------------------------------------------------------------
-- get_last_value
---------------------------------------------------------------------

-- need this if change parameters OR return signature
DROP FUNCTION IF EXISTS get_last_value(text, text, text);

CREATE OR REPLACE FUNCTION get_last_value (
  IN devicename text, -- the device name, eg 'Marumatsu'
  IN pathname text, -- the history view path, eg 'availability'
  IN search_limit text = '1d' -- search limit - don't search further into past than this
)
RETURNS TABLE ("time" timestamp, "value" text) -- ANSI standard SQL
LANGUAGE sql
AS
$BODY$
SELECT time, value->>0 as value -- note: ->>0 extracts the top-level jsonb value
FROM history_all
WHERE
  device = devicename
  and path = pathname
  and time > now() - search_limit::interval
ORDER BY time desc
LIMIT 1
$BODY$;

-- test fn
--.... turn off before committing

-- SELECT time, value 
-- FROM get_last_value(
--   'Marumatsu',
--   'availability', 
--   '1week'
-- );

