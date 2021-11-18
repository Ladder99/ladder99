---------------------------------------------------------------------
-- get_events
---------------------------------------------------------------------

-- get table of events by generating sql like
-- SELECT "time", "path", "value"
-- FROM (
-- SELECT "time", 'functional_mode' as "path", "value"
-- FROM get_timeline('Line1', 'functional_mode', 1636070400000, 1636156800000, false)
-- UNION
-- SELECT "time", 'availability' as "path", "value"
-- FROM get_timeline('Line1', 'availability', 1636070400000, 1636156800000, false)
-- ) AS subquery1
-- ORDER BY "time";
CREATE OR REPLACE FUNCTION get_events (
  IN p_device TEXT, -- the device name, eg 'Line1'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- stop time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, "path" TEXT, "value" TEXT)
AS
$BODY$
DECLARE
  -- dataitems to track --. pass in from grafana, or another fn eg get_uptime
  _trackers jsonb := jsonb_build_object(
    'time_available', '{"path":"availability","when":["AVAILABLE"]}'::jsonb,
    'time_active', '{"path":"functional_mode","when":["PRODUCTION"]}'::jsonb
  );
  _rec record;
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
    SELECT * FROM jsonb_each(_trackers)
  LOOP
    _path := (_value->>'path')::TEXT;

    _sql_inner := _sql_inner || _union || 
    format('
SELECT "time", %L as "path", "value"
FROM get_timeline(%L, %L, %s, %s, false)', 
_path, p_device, _path, p_from, p_to);

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


--WITH
--  p_day AS (VALUES ('2021-11-05'::date)),
--  p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
--  p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '1 day') * 1000)::bigint))
--SELECT * FROM get_events'Line1', (TABLE p_from), (TABLE p_to));


---------------------------------------------------------------------
-- get_uptime
---------------------------------------------------------------------

-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_uptime(text, bigint, bigint);

--. call this get_metrics, make generic
--. then make a get_uptime query that passes in the jsonb struct with events to watch

CREATE OR REPLACE FUNCTION get_uptime (
  IN p_device TEXT, -- the device name, eg 'Line1'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- stop time in milliseconds since 1970-01-01
)
RETURNS TABLE ("time" timestamp, "uptime" float)
AS
$BODY$
DECLARE
  -- dataitems to track --. pass in from caller
--  trackers jsonb := jsonb_build_object(
--    'time_available', '{"path":"availability","when":["AVAILABLE"]}'::jsonb,
--    'time_active', '{"path":"functional_mode","when":["PRODUCTION"]}'::jsonb
--  );
  _rec record;
  _time_block_size constant int := 3600; -- size of time blocks (secs) --. pass in estimate
  _time_block int; -- current record's time block, since 1970-01-01
  _last_time_block int := 0; -- previous record's time block
  --_start_times timestamp[]; -- array of start times --. make a dict eh?
  _start_times jsonb := '{}'; -- dict of starttimes
  _key TEXT;
  _value jsonb;
  _path TEXT;
--  _recs record;
  _dimensions jsonb := '{}';
  _values jsonb := '{}';
  _tbl jsonb := '{}'; -- an intermediate table, keyed on a dimension blob, values a json obj  
  _row jsonb;
--  _dimchange boolean;
--  _start_time timestamp;
--  _duration INTERVAL;
  _delta INTERVAL;
  _time_available INTERVAL := 0;
  _time_production INTERVAL := 0;
--  _sql TEXT := '';
--  _sql_inner TEXT := '';
--  _union TEXT := '';

BEGIN
  RAISE NOTICE '---------';

  -- get table of events and loop over
  -- each with _rec.time, _rec.path, _rec.value
  FOR _rec IN SELECT * FROM get_events(p_device, p_from, p_to)
  LOOP
    -- get time blocks since 1970-01-01 (hours, 15mins, days, etc)
    _time_block := EXTRACT(EPOCH FROM _rec.time) / _time_block_size; -- converts to int

    RAISE NOTICE '%, %', _time_block, _rec;

    -- check for dimension changes
    --_dimchange := FALSE;
  
    -- if time block has changed, update the dimensions where we'll be putting the time amounts.
    --  
    IF NOT _time_block = _last_time_block THEN
      --. loop over timeblocks, carrying forward values for each intermediate timeblock,
      --  setting their values to one full timeblocksize.
      --. for timeblock = last_time_block to time_block - 1 loop
    
      _dimensions := _dimensions || jsonb_build_object('time_block', _time_block);
      --_values := '{}'::jsonb;
      --_dimchange := TRUE;
    END IF;
  
    -- check for value changes - merge any into _values jsonb dict
    --. make these generic - loop over jsonb dicts etc
    IF _rec.path = 'availability' THEN
      IF _rec.value IN ('AVAILABLE') THEN -- state changed to ON
        _start_times := _start_times || jsonb_build_object('available', _rec.time);
      ELSE -- state changed to OFF
        _delta := _rec.time - (_start_times->>'available')::timestamp;
        _time_available := _time_available + _delta;
        -- _start_time_available := NULL;
      END IF;
      --_values := _values || ('{"availability":"' || _rec.value || '"}')::jsonb;
      -- _time_available := _rec.time - _start_time; -- keep duration up-to-date
      -- _values := _values || ('{"duration":"' || _duration::text || '"}')::jsonb;
      --. need to write to _values dict on dimension change?
      -- _count := _rec.value;
      -- _duration := _rec.time - _start_time; 
    ELSEIF _rec.path = 'functional_mode' THEN
      IF _rec.value IN ('PRODUCTION') THEN
        _start_times := _start_times || jsonb_build_object('production', _rec.time);
        RAISE NOTICE '%', _start_times;
      ELSE
        -- _start_time_active := NULL;
        _delta := _rec.time - (_start_times->>'production')::timestamp;
        RAISE NOTICE '%', _delta;
        -- _delta will be NULL the first time through
        -- _time_production := _time_production + COALESCE(_delta, 0); -- error
        IF _delta IS NOT NULL THEN
          _time_production := _time_production + _delta;
        END IF;
        RAISE NOTICE '_time_production %', _time_production; 
      END IF;
    END IF;

--    -- if dimension changed, start a 'timer' for this job
--    IF (_dimchange) THEN
--      _start_time := _rec.time;
--    END IF;
--

    -- store dimensions (as json string) and dataitems to an intermediate 'table'.
    _key := REPLACE(_dimensions::TEXT, '"', '^^'); -- convert " to ^^ so can use as a json key
    -- _row := ('{"' || _key || '":' || _values::TEXT || '}')::jsonb;
    _row := jsonb_build_object(_key, _values);
    RAISE NOTICE '%', _row;
    IF ((NOT _row IS NULL) AND (NOT _values = '{}'::jsonb)) THEN 
      _tbl := _tbl || _row;
    END IF;
  
  END LOOP;

--  RAISE NOTICE 'Building output...';
  DECLARE
    _key TEXT;
    _value jsonb;
    _key2 TEXT;
    _value2 TEXT;
  BEGIN
    
    RAISE NOTICE '%', _tbl;
  
    -- loop over records in our intermediate table
    FOR _key, _value IN 
      SELECT * FROM jsonb_each(_tbl)
    LOOP 
      -- loop over dimensions for this row, update our output table dimension cells
      FOR _key2, _value2 IN
        SELECT * FROM jsonb_each_text(REPLACE(_key, '^^', '"')::jsonb)
      LOOP
        IF _key2 = 'time_block' THEN
          "time" := time_block * time_block_size;
        END IF;
      END LOOP;
    
      -- now assign values to output table row
  --    "line" := p_device; -- eg 'Line1'
  --    "count" := _value->>'count';
  --    "duration" := _value->>'duration';
    
      -- add the cell values to a row for the returned table
      RETURN NEXT; 
    
    END LOOP;
  END;
END;
$BODY$
LANGUAGE plpgsql;


--.... turn this off before committing .....................
WITH
  p_day AS (VALUES ('2021-11-04'::date)),
  p_from AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint)),
  p_to AS (VALUES ((EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '5.05 hr') * 1000)::bigint))
SELECT * FROM get_uptime('Line1', (TABLE p_from), (TABLE p_to));


