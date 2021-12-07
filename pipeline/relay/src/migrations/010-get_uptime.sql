---------------------------------------------------------------------
-- get_uptime
---------------------------------------------------------------------

-- get uptime metric

-- this is a wrapper around get_metrics fn - provides list of dataitems to track,
-- and calculates uptime for each bin, e.g.

--  time, uptime
--  <time>, 0
--  <time>, 1.0
--  <time>, 0.5

-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_uptime(text, bigint, bigint);

CREATE OR REPLACE FUNCTION get_uptime (
  IN p_device TEXT, -- the device name, eg 'Line1'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- stop time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, "uptime" float)
AS
$BODY$
DECLARE
  _timeblock_size constant int := 3600; -- size of time blocks (secs) --. pass in estimate
  _trackers jsonb := jsonb_build_object(
    'availability', '{"name":"available","when":["AVAILABLE"]}'::jsonb,
    'functional_mode', '{"name":"active","when":["PRODUCTION"]}'::jsonb
  );
BEGIN
  RETURN query 
    SELECT 
      get_metrics."time",
--      1.0::float AS "uptime"
--      EXTRACT (seconds FROM ("values"->>'active')::float) / EXTRACT (seconds FROM ("values"->>'available')::float) AS "uptime"
      ("values"->'active')::float / ("values"->'available')::float AS "uptime"
    FROM get_metrics(_trackers, p_device, p_from, p_to)
    WHERE "values"->'active' IS NOT NULL AND "values"->'available' IS NOT NULL;
END; 
$BODY$
LANGUAGE plpgsql;


--.... turn this off before committing .....................
--WITH
--  p_day AS (VALUES ('2021-11-04'::date)),
--  p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
--  p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '5.05 hr') * 1000)::bigint))
--SELECT * FROM get_uptime('Line1', (TABLE p_from), (TABLE p_to));

