
---------------------------------------------------------------------
-- get_uptime
---------------------------------------------------------------------

-- RAISE NOTICE '_tbl %', _tbl;

-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_uptime(text, bigint, bigint);

CREATE OR REPLACE FUNCTION get_uptime (
  IN p_device TEXT, -- the device name, eg 'Line1'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- stop time in milliseconds since 1970-01-01
)
RETURNS TABLE ("timestamp" timestamp, "uptime" float)
AS
$BODY$
DECLARE
  path_availability constant TEXT := 'availability';
  path_functional_mode constant TEXT := 'functional_mode';
  -- dataitems to track --. pass in from grafana?
  trackers jsonb := jsonb_build_object(
    'time_available', '{"path":"availability","when":["AVAILABLE"]}'::jsonb,
    'time_active', '{"path":"functional_mode","when":["PRODUCTION"]}'::jsonb
  );
  _rec record;
  _time_block_size constant int := 3600; -- size of time blocks --. pass in hint from grafana
  _time_block int; -- current record's time block, since 1970-01-01
  _last_time_block int := 0; -- previous record's time block
  _start_times timestamp[]; -- array of start times
  _key TEXT;
  _value jsonb;
--  _dimensions jsonb := '{}';
--  _values jsonb := '{}';
--  _tbl jsonb := '{}'; -- an intermediate table, keyed on a dimension blob, values a json obj  
--  _row jsonb;
--  _dimchange boolean;
--  _start_time timestamp;
--  _duration INTERVAL;
  _delta INTERVAL;
  _time_available INTERVAL := 0;
  _sql TEXT := '';
  _sql_inner TEXT := '';
  _union TEXT := '';
BEGIN
  RAISE NOTICE '---------';
  RAISE NOTICE 'Collecting data...';

  FOR _key, _value IN
    SELECT * FROM jsonb_each(trackers)
  LOOP
    RAISE NOTICE '%, %', _key, _value;
    _sql_inner := _sql_inner || _union || '
  SELECT "time", ''functional_mode'' AS "path", "value"
  FROM get_timeline(p_device, path_functional_mode, p_from, p_to, FALSE)
';
    _union := '
UNION
';
  END LOOP;

  _sql := '
SELECT "time", "path", "value"
FROM (' || _sql_inner || ') AS subquery1
ORDER BY "time";
';

  RAISE NOTICE '%', _sql;

  -- get timeline data for all the dataitems we're interested in,
  -- then merge/union them and sort by time. 
  -- this way we get a stream of events that we can process in order.
  -- we pass FALSE so we get the actual timestamp for the first value,
  -- instead of the 'left' edge (p_from).
  --.. build up a union query string from array of search terms, execute it here
  FOR _rec IN (
    SELECT "time", "path", "value" 
    FROM (
      SELECT "time", 'availability' AS "path", "value"
      FROM get_timeline(p_device, path_availability, p_from, p_to, FALSE)
      UNION
      SELECT "time", 'functional_mode' AS "path", "value"
      FROM get_timeline(p_device, path_functional_mode, p_from, p_to, FALSE)
    ) AS subquery1 -- name required but not used
    ORDER BY "time"
  )  

  -- loop over the events - each with _rec.time, _rec.path, _rec.value
  LOOP
    -- get time blocks since 1970-01-01 (hours, 15mins, days, etc)
    _time_block := EXTRACT(EPOCH FROM _rec.time) / _time_block_size;

    RAISE NOTICE '%, %', _rec, _time_block;

    -- check for dimension changes
    --_dimchange := FALSE;
    IF NOT _time_block = _last_time_block THEN
      --. loop over timeblocks, carrying forward values for each intermediate timeblock,
      --  setting their values to one full timeblocksize.
      --. for timeblock = last_time_block to time_block - 1
    
--      _dimensions := _dimensions || ('{"time_block":"' || _time_block || '"}')::jsonb;
      --_values := '{}'::jsonb;
      --_dimchange := TRUE;
    END IF;
  
    -- check for value changes - merge any into _values jsonb dict
    --. make these generic - loop over jsonb dicts etc
    IF _rec.path = 'availability' THEN
      IF _rec.value = 'AVAILABLE' THEN --. (or other values) -- state changed to ON
        --_start_time_available := _rec.time; -- start clock
        _start_times[1] := _rec.time;
      ELSE -- state changed to OFF
        --_delta := _rec.time - _start_time_available;
        _delta := _rec.time - _start_times[1];
        _time_available := _time_available + _delta;
        -- _start_time_available := NULL;
        --_start_times[1] := _rec.time;
      END IF;
      --_values := _values || ('{"availability":"' || _rec.value || '"}')::jsonb;
      -- _time_available := _rec.time - _start_time; -- keep duration up-to-date
      -- _values := _values || ('{"duration":"' || _duration::text || '"}')::jsonb;
      --. need to write to _values dict on dimension change?
      -- _count := _rec.value;
      -- _duration := _rec.time - _start_time; 
--    ELSEIF _rec.path = 'functional_mode' THEN
--      IF _rec.value = 'PRODUCTION' THEN
--        _start_time_active := _rec.time; -- start clock
--      ELSE
--        _delta := _rec.time - _start_time_active;
--        _time_active := _time_active + _delta;
--        _start_time_active := NULL;
--      END IF;
    END IF;

--    -- if dimension changed, start a 'timer' for this job
--    IF (_dimchange) THEN
--      _start_time := _rec.time;
--    END IF;
--
--    -- store dimensions (as json string) and values to an intermediate 'table'.
--    _key := REPLACE(_dimensions::TEXT, '"', ''''); -- convert " to ' so can use as a json key
--    _row := ('{"' || _key || '":' || _values::TEXT || '}')::jsonb;  
--    IF ((NOT _row IS NULL) AND (NOT _values = '{}'::jsonb)) THEN 
--      _tbl := _tbl || _row;
--    END IF;
  
  END LOOP;

--  RAISE NOTICE 'Building output...';
--
--  -- loop over records in our intermediate table
--  FOR _key, _value IN 
--    SELECT * FROM jsonb_each(_tbl)
--  LOOP 
--    -- loop over dimensions for this row, update our output table dimension cells
--    FOR _key2, _value2 IN
--      SELECT * FROM jsonb_each_text(REPLACE(_key, '''', '"')::jsonb)
--    LOOP
--      IF _key2 = 'order' THEN 
--        "order" := _value2;
--      ELSEIF _key2 = 'item' THEN
--        "item" := _value2;
--      END IF;
--    END LOOP;
--  
--    -- now assign values to output table row
--    "line" := p_device; -- eg 'Line1'
--    "count" := _value->>'count';
--    "duration" := _value->>'duration';
--  
--    -- add the cell values to a row for the returned table
--    RETURN NEXT; 
--  
--  END LOOP;
END;
$BODY$
LANGUAGE plpgsql;


--....... turn this off before committing
WITH
  p_day AS (VALUES ('2021-11-05'::date)),
  p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
  p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '1 day') * 1000)::bigint))
SELECT * FROM get_uptime('Line1', (TABLE p_from), (TABLE p_to));




