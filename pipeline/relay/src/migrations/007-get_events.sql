---------------------------------------------------------------------
-- get_events
---------------------------------------------------------------------

-- get a table of events

-- specify dataitems to watch with p_trackers parameter, eg
--  p_trackers AS (values (jsonb_build_object(
--    'availability', '{"name":"available","when":["AVAILABLE"]}'::jsonb,
--    'functional_mode', '{"name":"active","when":["PRODUCTION"]}'::jsonb
--  ))),

-- builds a sql query like so -
--  SELECT "time", "path", "value"
--  FROM (
--   SELECT "time", 'functional_mode' as "path", "value"
--   FROM get_timeline('Line1', 'functional_mode', 1636070400000, 1636156800000, false)
--   UNION
--   SELECT "time", 'availability' as "path", "value"
--   FROM get_timeline('Line1', 'availability', 1636070400000, 1636156800000, false)
--  ) AS subquery1
--  ORDER BY "time";

-- and returns a table like
--  time, path, value
--  <time>, availability, AVAILABLE
--  <time>, functional_mode, PRODUCTION
--  <time>, availability, UNAVAILABLE

-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_events(text, bigint, bigint);

CREATE OR REPLACE FUNCTION get_events (
  IN p_trackers jsonb, -- jsonb objects with dataitems to track
  IN p_device TEXT, -- the device name, eg 'Line1'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- stop time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, "path" TEXT, "value" TEXT)
AS
$BODY$
DECLARE
  _path TEXT; -- tracker dataitem path, eg 'availability', 'functional_mode'
  _tracker jsonb; -- tracker object - not used
  _sql TEXT := '';
  _sql_inner TEXT := '';
  _union TEXT := '';

BEGIN
  RAISE NOTICE '------------- get_events --------------';
  RAISE NOTICE 'Building events query...';

  -- build sql statement - iterate over dataitems to track.
  -- note: don't actually use _tracker.
  FOR _path, _tracker IN SELECT * FROM jsonb_each(p_trackers)
  LOOP
    -- inner sql calls get_timeline for each dataitem, adds UNIONS as needed
    _sql_inner := _sql_inner || _union || format('
SELECT "time", %L as "path", "value"
FROM get_timeline(%L, %L, %s, %s, false)', 
_path, p_device, _path, p_from, p_to);
    _union := '
UNION';
  END LOOP;

  -- build final sql
  _sql := format('
SELECT "time", "path", "value"
FROM (%s
) AS subquery1 -- name not used but required
ORDER BY "time";
', _sql_inner);

  RAISE NOTICE '%', _sql;
  RAISE NOTICE 'Collecting events...';

  -- execute the sql and return results as a table
  RETURN query EXECUTE _sql;
END;
$BODY$
LANGUAGE plpgsql;


-- test get_events

--WITH
--  p_trackers AS (values (jsonb_build_object(
--    'availability', '{"name":"available","when":["AVAILABLE"]}'::jsonb,
--    'functional_mode', '{"name":"active","when":["PRODUCTION"]}'::jsonb
--  ))),
--  p_day AS (VALUES ('2021-11-05'::date)),
--  p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
--  p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '1 day') * 1000)::bigint))
--SELECT * FROM get_events((TABLE p_trackers), 'Line1', (TABLE p_from), (TABLE p_to));

