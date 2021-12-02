---------------------------------------------------------------------
-- get_augmented_events
---------------------------------------------------------------------

-- get a table of events, including artificial events at each time bucket boundary.

-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_augmented_events(jsonb, text, bigint, bigint);

CREATE OR REPLACE FUNCTION get_augmented_events (
  IN p_trackers jsonb, -- jsonb objects with dataitems to track
  IN p_device TEXT, -- the device name, eg 'Line1'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- stop time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, "path" TEXT, "value" TEXT)
AS
$BODY$
DECLARE
  _etime timestamp;
  _epath TEXT;
  _evalue TEXT;
  _timeblock_size int := 3600; --. pass in
  _timeblock int;
  _last_timeblock int := 999999999;
  _i int; -- timeblock iterator
  _last_values jsonb := '{}';
  _timestamp timestamp;
  _path TEXT; -- tracker dataitem path, eg 'availability', 'functional_mode'
  _tracker jsonb; -- tracker object - not used
  _from_timestamp timestamp := ms2timestamp(p_from);
  _to_timestamp timestamp := ms2timestamp(p_to);
BEGIN
  RAISE NOTICE '------------- get_augmented_events --------------';

  FOR "time", "path", "value" IN
    SELECT * FROM get_events(p_trackers, p_device, p_from, p_to) 
      UNION VALUES (_from_timestamp, '_start_', 'START') -- add artificial start event 
      UNION VALUES (_to_timestamp, '_stop_', 'STOP') -- add artificial end event 
      ORDER BY "time"
  LOOP
    -- save these for later
    _etime := "time";
    _epath := "path";
    _evalue := "value";
    -- for each intervening timeblocks,
    -- loop over timeblocks and carry forward the previous values.
    _timeblock := timestamp2timeblock(_etime, _timeblock_size);
    RAISE NOTICE '% % % %', _etime, _epath, _evalue, _timeblock;
    IF _etime >= _from_timestamp THEN
      IF NOT _timeblock = _last_timeblock THEN
        FOR _i IN (_last_timeblock + 1) .. _timeblock LOOP
          _timestamp := timeblock2timestamp(_i, _timeblock_size);
          RAISE NOTICE '% %', _timestamp, _from_timestamp;
          CONTINUE WHEN _timestamp < _from_timestamp;
          FOR _path, _tracker IN SELECT * FROM jsonb_each(p_trackers) LOOP
            -- emit artificial event record
            get_augmented_events."time" := _timestamp;
            get_augmented_events."path" := _path;
            get_augmented_events."value" := _last_values->>_path;
            RETURN NEXT;
          END LOOP;
        END LOOP;
      END IF;
      -- emit existing event record
      get_augmented_events."time" := _etime;
      get_augmented_events."path" := _epath;
      get_augmented_events."value" := _evalue;
      RETURN NEXT;
    END IF;
    -- update last values
    _last_values := _last_values || jsonb_build_object(_epath, _evalue);
    _last_timeblock := _timeblock;
  END LOOP;
  RAISE NOTICE 'done';
END;
$BODY$
LANGUAGE plpgsql;


-- test get_augmented_events
--WITH
--  p_trackers AS (values (jsonb_build_object(
--    'availability', '{"name":"available","when":["AVAILABLE"]}'::jsonb,
--    'functional_mode', '{"name":"active","when":["PRODUCTION"]}'::jsonb
--  ))),
--  p_day AS (VALUES ('2021-11-05'::date)),
----  p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
----  p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '1 day') * 1000)::bigint))
--  p_from AS (VALUES (timestamp2ms((TABLE p_day)))),
--  p_to AS (VALUES (timestamp2ms((TABLE p_day) + INTERVAL '1 day')))
--SELECT * FROM get_augmented_events((TABLE p_trackers), 'Line1', (TABLE p_from), (TABLE p_to));

