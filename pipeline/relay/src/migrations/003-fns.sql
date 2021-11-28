---------------------------------------------------------------------
-- get_events
---------------------------------------------------------------------
-- get a table of events
--
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
--
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
  RAISE NOTICE '---------';
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



-- define some json array to text array functions - lacking from postgres as of v9?
-- still not in there in v13?
-- see https://dba.stackexchange.com/questions/54283/how-to-turn-json-array-into-postgres-array/54289
CREATE OR REPLACE FUNCTION json_arr2text_arr(_js json)
  RETURNS text[] LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT ARRAY(SELECT json_array_elements_text(_js))';
CREATE OR REPLACE FUNCTION jsonb_arr2text_arr(_js jsonb)
  RETURNS text[] LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT ARRAY(SELECT jsonb_array_elements_text(_js))';



-- convert timestamp to/from timeblock (intervals since 1970-01-01).
-- EPOCH gives seconds since 1970-01-01.
-- note: '/' here gives the integer floor of the division.
-- need trunc otherwise timeblock gets rounded up when time >= 30 mins.
CREATE OR REPLACE FUNCTION timestamp2timeblock(_timestamp timestamp, _interval int)
  RETURNS int LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT trunc(EXTRACT(EPOCH FROM _timestamp) / _interval);';
CREATE OR REPLACE FUNCTION timeblock2timestamp(_timeblock int, _interval int)
  RETURNS timestamp LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT to_timestamp(_timeblock * _interval)::timestamptz at time zone ''UTC''';
-- test above fns
--SELECT timestamp2timeblock('now', 3600); -- eg 454943
--SELECT timestamp2timeblock('epoch', 3600); -- 0
--SELECT timestamp2timeblock('2021-11-05 07:29:02.927', 3600);
--SELECT timestamp2timeblock('2021-11-05 07:30:02.927', 3600);
--SELECT timeblock2timestamp(0, 3600); -- '1970-01-01 00:00:00.000'


-- convert to/from timestamp and milliseconds since 1970-01-01
--DROP FUNCTION timestamp2ms;
--DROP FUNCTION ms2timestamp;
CREATE OR REPLACE FUNCTION timestamp2ms(p_timestamp timestamp)
  RETURNS bigint LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT EXTRACT(EPOCH FROM p_timestamp) * 1000;';
CREATE OR REPLACE FUNCTION ms2timestamp(p_ms bigint)
  RETURNS timestamp LANGUAGE SQL IMMUTABLE PARALLEL SAFE AS 
  'SELECT to_timestamp(p_ms / 1000)::timestamptz at time zone ''UTC''';


---------------------------------------------------------------------
-- get_augmented_events
---------------------------------------------------------------------

-- get a table of events, including artificial events at each time bucket boundary.
--
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
--  _last_time timestamp := NULL;
  _timestamp timestamp;
  _path TEXT; -- tracker dataitem path, eg 'availability', 'functional_mode'
  _tracker jsonb; -- tracker object - not used
  _from_timestamp timestamp := ms2timestamp(p_from);
  _to_timestamp timestamp := ms2timestamp(p_to);
BEGIN
  RAISE NOTICE '---------';

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
--    _last_time := _etime;
--    RAISE NOTICE '%', _last_time;
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





---------------------------------------------------------------------
-- get_metrics
---------------------------------------------------------------------
-- get bin values for different dataitem states.
-- returns table of times rounded to bucket sizes,
-- with jsonb object containing value bins.
-- eg
--  p_trackers AS (values (jsonb_build_object(
--    'availability', '{"name":"available","when":["AVAILABLE"]}'::jsonb,
--    'functional_mode', '{"name":"active","when":["PRODUCTION"]}'::jsonb
--  ))),

-- do this if change parameters OR return signature:
-- DROP FUNCTION IF EXISTS get_metrics(jsonb, text, bigint, bigint);

CREATE OR REPLACE FUNCTION get_metrics (
  IN p_trackers jsonb, -- dataitems to track
  IN p_device TEXT, -- the device name, eg 'Line1'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- stop time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, "values" jsonb)
AS
$BODY$
DECLARE
  _time_block_size constant int := 3600; -- size of time blocks (secs) --. pass in estimate
  _event record; -- a record from the get_events fn with time, path, value
  _time_block int; -- current record's time block, since 1970-01-01
  _last_time_block int := 0; -- previous record's time block
  _start_times jsonb := '{}'; -- dict of starttimes - keyed on tracker name, values are timestamps 
  _key TEXT; --. rename
  _value jsonb; --. rename
  _path TEXT; --.
  _dimensions jsonb := '{}'; --.
  _dataitems jsonb := '{}'; --.
  _rows jsonb := '{}'; -- an intermediate key-value table - keyed on dimension (as json string), values a jsonb obj with accumulated times 
  _row jsonb; -- a row in above table
  _dimchanged boolean; -- flag set if a dimension we're tracking has changed
  _delta INTERVAL; -- time interval 
  _time_bins jsonb := '{}'; --.
  _dataitem TEXT; --.
  _def jsonb; --.
  _newtime INTERVAL; --.
  _name TEXT;
  _on_states TEXT[];
BEGIN
  RAISE NOTICE '---------';

  -- get table of events and loop over, each with time, path, value.
  -- augmented events includes artificial events for start of each time block.
  FOR _event IN SELECT * FROM get_augmented_events(p_trackers, p_device, p_from, p_to)
  LOOP
    -- get time blocks since 1970-01-01 (hours, 15mins, days, etc)
    _time_block := timestamp2timeblock(_event.time, _time_block_size);

    RAISE NOTICE '%, %', _time_block, _event;

    -- check for dimension changes
    -- if time block has changed, update the dimensions where we'll be putting the time amounts.
    _dimchanged := FALSE;  
    IF NOT _time_block = _last_time_block THEN
      _dimensions := _dimensions || jsonb_build_object('time_block', _time_block);
      --_values := '{}'::jsonb; --. ?
      _dimchanged := TRUE;
      _last_time_block := _time_block;
    END IF;

    -- check for dataitem changes - merge any into _time_bins jsonb dict
    _def := (p_trackers->(_event.path)); -- get tracker def - path is eg 'availability', 'functional_mode'
    IF _def IS NOT NULL THEN
      _name := _def->>'name'; -- eg 'available', 'active'
      _on_states := jsonb_arr2text_arr(_def->'when'); -- eg ['AVAILABLE']
      IF _event.value = ANY(_on_states) THEN -- state changed to ON
        _start_times := _start_times || jsonb_build_object(_name, _event.time); -- start 'timer'
      ELSE -- state changed to OFF
        -- add clock time to time bin for this dataitem
        _delta := _event.time - (_start_times->>_name)::timestamp;
        IF _delta IS NOT NULL THEN
          _newtime := COALESCE((_time_bins->_name)->>0, '0')::INTERVAL + _delta;
          _time_bins := _time_bins || jsonb_build_object(_name, _newtime);
        END IF;
      END IF;
    END IF;

    -- if dimension changed (ie time), start 'timers' for each tracked dataitem
    IF _dimchanged THEN
      FOR _path, _def IN SELECT * FROM jsonb_each(p_trackers) LOOP
        _name := _def->>'name'; -- eg 'available', 'active'
        -- add clock time to time bin for this dataitem
        _delta := _event.time - (_start_times->>_name)::timestamp;
        IF _delta IS NOT NULL THEN
          _newtime := COALESCE((_time_bins->_name)->>0, '0')::INTERVAL + _delta;
          _time_bins := _time_bins || jsonb_build_object(_name, _newtime);
        END IF;
        _start_times := jsonb_build_object(_def->>'name', _event.time);
      END LOOP;
    END IF;

    -- store dimensions (as json string) and dataitems to an intermediate 'table'.
    -- this overwrites existing rows as bins fill up.
    _row := jsonb_build_object(_dimensions::TEXT, _time_bins);
    IF ((_row IS NOT NULL) AND (NOT _time_bins = '{}'::jsonb)) THEN 
      _rows := _rows || _row;
    END IF;
  
  END LOOP;

  RAISE NOTICE '%', _rows;
  RAISE NOTICE 'Building output...';

  DECLARE
    -- see below for explanations
    _dimensions TEXT;
    _bins jsonb;
    _dimension TEXT;
    _dimension_value TEXT;
    _interval INTERVAL;
  BEGIN    
  
    -- loop over records in our intermediate table, _rows.
    -- _dimensions is a json string containing any dimensions we're tracking, ie timeblock.
    -- _bins is an object with accumulated times for different dataitems we're tracking.
    FOR _dimensions, _bins IN SELECT * FROM jsonb_each(_rows)
    LOOP 

      -- first, loop over dimensions for this row and update our output table dimension cells (ie time)
      -- _dimension is eg 'time_block'
      -- _dimension_value is eg 454440
      FOR _dimension, _dimension_value IN SELECT * FROM jsonb_each(_dimensions::jsonb)
      LOOP
        IF _dimension = 'time_block' THEN
--          "time" := to_timestamp(_dimension_value::int * _time_block_size); -- convert seconds to timestamp
          "time" := timeblock2timestamp(_dimension_value::int, _time_block_size);
        END IF;
      END LOOP;

      -- now assign values to output table row.
      -- but we already have the jsonb object we need, so just return that.
--      "values" := _bins; -- eg {"active": "00:09:05.3"}
--    "line" := p_device; -- eg 'Line1' --. will we need this also?
      
      --. but might want to return seconds instead of a sql interval
      "values" := '{}';
      FOR _name, _interval IN SELECT * FROM jsonb_each(_bins)
      LOOP
        RAISE NOTICE '% %', _name, _interval;
        "values" := "values" || jsonb_build_object(_name, date_part('second', _interval));
      END LOOP;
      RAISE NOTICE '%', "values";
      
      -- add the row to the returned table
      RETURN NEXT; 
    
    END LOOP;
  END;
END;
$BODY$
LANGUAGE plpgsql;


-- test fn
--.... turn this off before committing .....................

WITH
  p_trackers AS (values (jsonb_build_object(
    'availability', '{"name":"available","when":["AVAILABLE"]}'::jsonb,
    'functional_mode', '{"name":"active","when":["PRODUCTION"]}'::jsonb
  ))),
  -- or 2021-11-04 for 5.05h
  p_day AS (VALUES ('2021-11-05'::date)),
  p_from AS (VALUES (timestamp2ms((TABLE p_day)))),
  p_to AS (VALUES (timestamp2ms((TABLE p_day) + INTERVAL '1 day')))
SELECT * FROM get_metrics((TABLE p_trackers), 'Line1', (TABLE p_from), (TABLE p_to));



---------------------------------------------------------------------
-- get_uptime
---------------------------------------------------------------------

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
  _time_block_size constant int := 3600; -- size of time blocks (secs) --. pass in estimate
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

