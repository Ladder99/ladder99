
---------------------------------------------------------------------
-- get_metrics
---------------------------------------------------------------------
-- get bin values for different dataitem states.

-- returns table of time, values - with times rounded to timeblock sizes,
-- and jsonb object containing value bins, e.g. 
-- time, values
--. 

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
  _timeblock_size constant int := 3600; -- size of time blocks (secs) --. pass in estimate
  _timeblock int; -- current record's time block - blocks since 1970-01-01
  _last_timeblock int := 0; -- previous record's time block
  _event record; -- a record from the get_events fn with time, path, value
  _start_times jsonb := '{}'; -- dict of starttimes - keyed on tracker name, values are timestamps 
  _key TEXT; --. rename
  _value jsonb; --. rename
  _path TEXT; --.
  _dimensions jsonb := '{}'; --.
  _dataitems jsonb := '{}'; --.
  _rows jsonb := '{}'; -- an intermediate key-value table - keyed on dimension (as json string), values a jsonb obj with accumulated times 
  _row jsonb; -- a row in above table
  _dimchanged boolean; -- flag set if a dimension we're tracking has changed
  _time_delta INTERVAL; -- time interval 
  _time_bins jsonb := '{}'; --.
  _dataitem TEXT; --.
  _tracker jsonb; -- tracker definition
  _newtime INTERVAL; --.
  _name TEXT;
  _on_state_values TEXT[];
  _currently_on jsonb := '{}'; -- dict of booleans keyed on name we're tracking - is state ON?
  _is_dataitem_already_on BOOLEAN; -- is the current dataitem already in an ON state?
  _is_event_state_on BOOLEAN; -- is the current event in an ON state?
BEGIN
  RAISE NOTICE '------------- get_metrics --------------';

  -- get table of events and loop over, each with time, path, value.
  -- note: augmented events includes artificial events for start of each time block.
  -- _event is a 'record' variable.
  FOR _event IN SELECT * FROM get_augmented_events(p_trackers, p_device, p_from, p_to)
  LOOP

    -- get event's timeblock - since 1970-01-01 (hours, or 15mins, or days, etc)
    _timeblock := timestamp2timeblock(_event.time, _timeblock_size);

    RAISE NOTICE '%, %', _timeblock, _event;

    -- check for dimension changes
    -- if timeblock has changed, update the dimensions where we'll be putting the time amounts.
    _dimchanged := FALSE;
    --. note: may have additional IF THEN blocks here to handle other dimensions
    IF NOT _timeblock = _last_timeblock THEN
      _dimensions := _dimensions || jsonb_build_object('timeblock', _timeblock);
      _last_timeblock := _timeblock;
      _dimchanged := TRUE;
    END IF;

    -- check for dataitem updates - merge time deltas into _time_bins jsonb dict.
    -- first, get tracker definition - path is eg 'availability', 'functional_mode', etc.
    _tracker := (p_trackers->(_event.path));
    IF _tracker IS NOT NULL THEN
      _name := _tracker->>'name'; -- eg 'available', 'active'
      _on_state_values := jsonb_arr2text_arr(_tracker->'when'); -- eg ['AVAILABLE']

      -- if this dataitem is already in an ON state, 
      -- add time delta to time bin for this dataitem.
      _is_dataitem_already_on := (_currently_on->_name);
      raise notice 'is data item on? % %', _name, _is_dataitem_already_on;
      IF _is_dataitem_already_on THEN
        _time_delta := _event.time - (_start_times->>_name)::timestamp;
        RAISE NOTICE 'time delta %', _time_delta;
        IF _time_delta IS NOT NULL THEN
          _newtime := COALESCE((_time_bins->_name)->>0, '0')::INTERVAL + _time_delta;
          RAISE NOTICE 'newtime %', _newtime;
          _time_bins := _time_bins || jsonb_build_object(_name, _newtime);
        END IF;
      END IF;

      -- is the current event an ON state?
      _is_event_state_on := (_event.value = ANY(_on_state_values));
      RAISE NOTICE 'event state on? %', _is_event_state_on;
      IF _is_event_state_on THEN -- yes, so start timer
        RAISE NOTICE 'start timer for % at %', _name, _event.time;
        _start_times := _start_times || jsonb_build_object(_name, _event.time);
      ELSE -- no, so stop timer
        RAISE NOTICE 'stop timer for %', _name;
        _start_times := _start_times || jsonb_build_object(_name, NULL);
      END IF;

      -- update currently_on value for this dataitem to TRUE or FALSE
      _currently_on := _currently_on || jsonb_build_object(_name, _is_event_state_on);
    
    END IF;

    -- if dimension changed (ie time), start 'timers' for each tracked dataitem
    IF _dimchanged THEN
      RAISE NOTICE 'dimchanged';
      FOR _path, _tracker IN SELECT * FROM jsonb_each(p_trackers) LOOP
        _name := _tracker->>'name'; -- eg 'available', 'active'
        -- add clock time to time bin for this dataitem
        _time_delta := _event.time - (_start_times->>_name)::timestamp;
        RAISE NOTICE 'time delta % %', _name, _time_delta;
        IF _time_delta IS NOT NULL THEN
          _newtime := COALESCE((_time_bins->_name)->>0, '0')::INTERVAL + _time_delta;
          RAISE NOTICE 'new time %', _newtime;
          _time_bins := _time_bins || jsonb_build_object(_name, _newtime);
        ELSE
          _time_bins := _time_bins || jsonb_build_object(_name, NULL);
        END IF;
        _start_times := jsonb_build_object(_name, _event.time);
      END LOOP;
--      _time_bins := '{}';
    END IF;

    -- store dimensions and dataitems to an intermediate 'table'.
    -- this overwrites the existing _row object as bins fill up.
    -- note: _rows is a dict keyed on _dimensions formatted as a JSON string.
    _row := jsonb_build_object(_dimensions::TEXT, _time_bins);
--    IF ((_row IS NOT NULL) AND (NOT _time_bins = '{}'::jsonb)) THEN 
    IF _row IS NOT NULL THEN 
      _rows := _rows || _row;
    END IF;
  
  END LOOP;

  RAISE NOTICE '------------ _rows -----------';
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
      -- _dimension is eg 'timeblock'
      -- _dimension_value is eg 454440
      FOR _dimension, _dimension_value IN SELECT * FROM jsonb_each(_dimensions::jsonb)
      LOOP
        RAISE NOTICE 'dimension, value % %', _dimension, _dimension_value;
        RAISE NOTICE '%', pg_typeof(_dimension_value);
--        IF _dimension = 'timeblock' THEN
        IF _dimension = 'timeblock' AND pg_typeof(_dimension_value) = to_regtype('integer') THEN
          RAISE NOTICE 'here';
          "time" := timeblock2timestamp(_dimension_value::int, _timeblock_size);
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
--        IF NOT _interval = '' THEN
          "values" := "values" || jsonb_build_object(_name, date_part('second', _interval));
--        END IF;
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


