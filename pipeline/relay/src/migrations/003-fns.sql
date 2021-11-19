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
  _key TEXT;
  _value jsonb;
  _path TEXT;
  _sql TEXT := '';
  _sql_inner TEXT := '';
  _union TEXT := '';

BEGIN
  RAISE NOTICE '---------';
  RAISE NOTICE 'Building events query...';

  -- build sql statement
  FOR _key, _value IN
    SELECT * FROM jsonb_each(p_trackers)
  LOOP
--    _path := (_value->>'path')::TEXT;
    _sql_inner := _sql_inner || _union || format('
SELECT "time", %L as "path", "value"
FROM get_timeline(%L, %L, %s, %s, false)', 
--_path, p_device, _path, p_from, p_to);
_key, p_device, _key, p_from, p_to);
    _union := '
UNION';
  END LOOP;

  _sql := format('
SELECT "time", "path", "value"
FROM (%s
) AS subquery1 -- name not used but required
ORDER BY "time";
', _sql_inner);

  RAISE NOTICE '%', _sql;
  RAISE NOTICE 'Collecting events...';
  RETURN query EXECUTE _sql;
END;
$BODY$
LANGUAGE plpgsql;


-- test get_events

--WITH
----  p_trackers AS (values (jsonb_build_object(
----    'time_available', '{"path":"availability","when":["AVAILABLE"]}'::jsonb,
----    'time_active', '{"path":"functional_mode","when":["PRODUCTION"]}'::jsonb
----  ))),
--  p_trackers AS (values (jsonb_build_object(
--    'availability', '{"name":"available","when":["AVAILABLE"]}'::jsonb,
--    'functional_mode', '{"name":"active","when":["PRODUCTION"]}'::jsonb
--  ))),
--  p_day AS (VALUES ('2021-11-05'::date)),
--  p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
--  p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '1 day') * 1000)::bigint))
--SELECT * FROM get_events((TABLE p_trackers), 'Line1', (TABLE p_from), (TABLE p_to));



-- see https://dba.stackexchange.com/questions/54283/how-to-turn-json-array-into-postgres-array/54289
CREATE OR REPLACE FUNCTION json_arr2text_arr(_js json)
  RETURNS text[] LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT ARRAY(SELECT json_array_elements_text(_js))';
CREATE OR REPLACE FUNCTION jsonb_arr2text_arr(_js jsonb)
  RETURNS text[] LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT ARRAY(SELECT jsonb_array_elements_text(_js))';


---------------------------------------------------------------------
-- get_metrics
---------------------------------------------------------------------
-- get bin values for different dataitem states.
-- returns table of times rounded to bucket sizes,
-- with jsonb object containing value bins.
-- eg
--  jsonb_build_object(
--   'time_available', '{"path":"availability","when":["AVAILABLE"]}'::jsonb,
--   'time_active', '{"path":"functional_mode","when":["PRODUCTION"]}'::jsonb
--  )

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
  _event record; --.
  _time_block_size constant int := 3600; -- size of time blocks (secs) --. pass in estimate
  _time_block int; -- current record's time block, since 1970-01-01
  _last_time_block int := 0; -- previous record's time block
  _start_times jsonb := '{}'; -- dict of starttimes, keyed on dataitem
  _key TEXT; --. rename
  _value jsonb; --. rename
  _path TEXT; --.
  _dimensions jsonb := '{}'; --.
  _dataitems jsonb := '{}'; --.
  _tbl jsonb := '{}'; -- an intermediate table, keyed on a dimension blob, values a json obj  
  _row jsonb; --. rename
  _dimchanged boolean; --.
  _delta INTERVAL; --.
--  _time_available INTERVAL := 0; --. del
--  _time_production INTERVAL := 0; --. del
  _time_bins jsonb := '{}'; --.
  _dataitem TEXT; --.
  _def jsonb; --.
  _newtime INTERVAL; --.
  _name TEXT;
  _on_states TEXT[];
BEGIN
  RAISE NOTICE '---------';

  -- get table of events and loop over, each with time, path, value.
  FOR _event IN SELECT * FROM get_events(p_trackers, p_device, p_from, p_to)
  LOOP
    -- get time blocks since 1970-01-01 (hours, 15mins, days, etc)
    -- EPOCH is seconds since 1970-01-01
    _time_block := EXTRACT(EPOCH FROM _event.time) / _time_block_size; -- converts to int

    RAISE NOTICE '%, %', _time_block, _event;

    -- check for dimension changes
    -- if time block has changed, update the dimensions where we'll be putting the time amounts.
    _dimchanged := FALSE;  
    IF NOT _time_block = _last_time_block THEN
      --. loop over timeblocks, carrying forward values for each intermediate timeblock,
      --  setting their values to one full timeblocksize.
      --. for timeblock = last_time_block to time_block - 1 loop
    
      _dimensions := _dimensions || jsonb_build_object('time_block', _time_block);
      --_values := '{}'::jsonb;
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
        RAISE NOTICE '%', _start_times;
      ELSE -- state changed to OFF
        -- add clock time to time bin for this dataitem
        _delta := _event.time - (_start_times->>_name)::timestamp;
        IF _delta IS NOT NULL THEN
          _newtime := COALESCE((_time_bins->_name)->>0, '0')::INTERVAL + _delta;
--          RAISE NOTICE '%', _newtime;
          _time_bins := _time_bins || jsonb_build_object(_name, _newtime);
          RAISE NOTICE '%', _time_bins;
        END IF;
      END IF;
    END IF;

    -- if dimension changed (ie time), start 'timers' for each tracked dataitem
    IF _dimchanged THEN
      FOR _path, _def IN SELECT * FROM jsonb_each(p_trackers) LOOP
        _start_times := jsonb_build_object(_def->>'name', _event.time);
      END LOOP;
    END IF;

    -- store dimensions (as json string) and dataitems to an intermediate 'table'.
    -- this overwrites existing rows as bins fill up.
    _row := jsonb_build_object(_dimensions::TEXT, _time_bins);
    RAISE NOTICE '%', _row;
    IF ((_row IS NOT NULL) AND (NOT _time_bins = '{}'::jsonb)) THEN 
      _tbl := _tbl || _row;
    END IF;
  
  END LOOP;

  RAISE NOTICE '%', _tbl;
  RAISE NOTICE 'Building output...';

  DECLARE
    _dimensions TEXT; --.
    _bins jsonb; --.
    _dimension TEXT; --.
    _dimension_value TEXT; --.
  BEGIN    
  
    -- loop over records in our intermediate table
    FOR _dimensions, _bins IN SELECT * FROM jsonb_each(_tbl)
    LOOP 

      -- first, loop over dimensions for this row and update our output table dimension cells (ie time)
      FOR _dimension, _dimension_value IN SELECT * FROM jsonb_each(_dimensions::jsonb)
      LOOP
        IF _dimension = 'time_block' THEN
          "time" := to_timestamp(_dimension_value::int * _time_block_size); -- convert seconds to timestamp
        END IF;
      END LOOP;

      -- now assign values to output table row.
      -- we already have the jsonb object we need, so just return that.
      "values" := _bins;
    
--    "line" := p_device; -- eg 'Line1' --. will we need this also?

      -- add the cell values to a row for the returned table
      RETURN NEXT; 
    
    END LOOP;
  END;
END;
$BODY$
LANGUAGE plpgsql;


-- test fn
--.... turn this off before committing .....................

WITH
--  p_trackers AS (values (jsonb_build_object(
--    'time_available', '{"path":"availability","when":["AVAILABLE"]}'::jsonb,
--    'time_active', '{"path":"functional_mode","when":["PRODUCTION"]}'::jsonb
--  ))),
  p_trackers AS (values (jsonb_build_object(
    'availability', '{"name":"available","when":["AVAILABLE"]}'::jsonb,
    'functional_mode', '{"name":"active","when":["PRODUCTION"]}'::jsonb
  ))),
  p_day AS (VALUES ('2021-11-04'::date)),
  p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
  p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '5.05 hr') * 1000)::bigint))
SELECT * FROM get_metrics((TABLE p_trackers), 'Line1', (TABLE p_from), (TABLE p_to));



---------------------------------------------------------------------
-- get_uptime
---------------------------------------------------------------------

-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_uptime(text, bigint, bigint);

--CREATE OR REPLACE FUNCTION get_uptime (
--  IN p_device TEXT, -- the device name, eg 'Line1'
--  IN p_from bigint, -- start time in milliseconds since 1970-01-01
--  IN p_to bigint -- stop time in milliseconds since 1970-01-01
--)
--RETURNS TABLE ("time" timestamp, "uptime" float)
--AS
--$BODY$
--DECLARE
--  _trackers jsonb := jsonb_build_object(
--   'time_available', '{"path":"availability","when":["AVAILABLE"]}'::jsonb,
--   'time_active', '{"path":"functional_mode","when":["PRODUCTION"]}'::jsonb
--  );
--  _rec record;
--  _time_block_size constant int := 3600; -- size of time blocks (secs) --. pass in estimate
--  _time_block int; -- current record's time block, since 1970-01-01
--BEGIN  
--END; 
--$BODY$
--LANGUAGE plpgsql;


--.... turn this off before committing .....................
--WITH
--  p_day AS (VALUES ('2021-11-04'::date)),
--  p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
--  p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '5.05 hr') * 1000)::bigint))
--SELECT * FROM get_uptime('Line1', (TABLE p_from), (TABLE p_to));

  