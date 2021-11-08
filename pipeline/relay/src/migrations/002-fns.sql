---------------------------------------------------------------------
-- FUNCTIONS
---------------------------------------------------------------------

---------------------------------------------------------------------
-- get_timeline
---------------------------------------------------------------------
-- get data for a timeline view (eg the 'discrete' plugin for grafana).
-- like a regular query but also gets the last value before the start time,
-- and assigns it to that start time.
-- returns time, value, with value being text, coerced from top-level jsonb value.
-- use from grafana like
--   SELECT time, value AS "Availability" 
--   FROM get_timeline('Line$line', 'availability', $__from, $__to);

-- DROP FUNCTION IF EXISTS get_timeline;

CREATE OR REPLACE FUNCTION get_timeline (
  IN devicename text, -- the device name, eg 'Line1'
  IN pathname text, -- the history view path, eg 'availability'
  IN from_ms bigint, -- start time in milliseconds since 1970-01-01
  IN to_ms bigint, -- end time in milliseconds since 1970-01-01
  IN clamp boolean = TRUE -- return left edge as first time 
)
RETURNS TABLE ("time" timestamp, "value" text) -- ANSI standard SQL
LANGUAGE sql
AS
$BODY$
-- this union query gets the regular data for the graph,
-- then tacks on the value for the left edge.
-- first define some SQL variables
-- referenced below with eg '(TABLE from_time)'
WITH
  from_time AS (VALUES (to_timestamp(cast(from_ms/1000 as bigint))::timestamp)),
  to_time AS (VALUES (to_timestamp(cast(to_ms/1000 as bigint))::timestamp))
-- do a straightforward query for time and value for the 
-- given device, path, and timestamp
SELECT time, value->>0 AS value -- note: ->>0 extracts the top-level jsonb value
FROM history_all
WHERE
  device = devicename and
  path = pathname and
  time >= (TABLE from_time) and
  time <= (TABLE to_time)
-- now tack on the time and value for the left edge with a UNION query
UNION
SELECT time, value->>0 AS value -- note: ->>0 extracts the top-level jsonb value
FROM
  -- need this subquery so can order the results by time descending,
  -- so can get the last value before the left edge.
  (
  SELECT
    --(TABLE from_time) as time,
    CASE WHEN clamp THEN (TABLE from_time) ELSE history_all.time END AS time,
    value
  FROM history_all
  WHERE
    device = devicename and
    path = pathname and
    time <= (TABLE from_time)
  ORDER BY history_all.time DESC
  LIMIT 1 -- just want the last value
  ) AS subquery1 -- subquery name is required but not used
ORDER BY time -- sort the combined query results
$BODY$;



--SELECT time, value AS "Sales Order" 
--FROM get_timeline(
--  'Line1',
--  'controller/processOccurrence/process_aggregate_id-order_number[sales_order]', 
--  1635887998265, 
--  1635891598266
--);


---------------------------------------------------------------------
-- get_jobs
---------------------------------------------------------------------

-- DROP FUNCTION IF EXISTS get_jobs(TEXT, date);


--. develop in dbeaver, copy to migrate.sql - DO NOT EDIT THERE!

--DROP FUNCTION IF EXISTS get_jobs(date, TEXT);
-- DROP FUNCTION IF EXISTS get_jobs(TEXT, bigint, bigint);

CREATE OR REPLACE FUNCTION get_jobs (
  IN p_device TEXT, -- the device name, eg 'Line1'
  IN p_from bigint,
  IN p_to bigint
)
RETURNS TABLE ("line" TEXT, "order" TEXT, "item" TEXT, "count" TEXT, "duration" interval, "rework" TEXT)
AS
$BODY$
DECLARE
  path_order constant TEXT = 'controller/processOccurrence/process_aggregate_id-order_number[sales_order]';
  --path_item constant TEXT = 'controller/partOccurrence/part_kind_id-part_number';
  path_item constant TEXT = 'controller/partOccurrence/part_kind_id-part_name';
  path_count constant TEXT = 'controller/partOccurrence/part_count-complete';
  --  path_rework constant TEXT = 'controller/partOccurrence/part_count-complete'; --...
  path_all constant TEXT[] = ARRAY[path_order, path_item, path_count];
  _rec record;
  _key TEXT;
  _value json;
  _key2 TEXT;
  _value2 TEXT;
  _dimensions jsonb := '{}';
  _values jsonb := '{}';
  _tbl jsonb := '{}'; -- an intermediate table, keyed on a dimension blob, values a json obj  
  _row jsonb;
  _dimchange boolean;
  _start_time timestamp;
  _duration INTERVAL;
  -- _from bigint := EXTRACT(epoch FROM p_day) * 1000;
  -- _to bigint := EXTRACT(epoch FROM p_day + INTERVAL '1 day') * 1000;
BEGIN
  RAISE NOTICE '------';
  RAISE NOTICE 'Collecting data...';

  FOR _rec IN (
    SELECT "time", "path", "value" 
    FROM (
      SELECT "time", 'order' AS "path", "value"
      FROM get_timeline(p_device, path_order, p_from, p_to, FALSE)
      UNION
      SELECT "time", 'item' AS "path", "value"
      FROM get_timeline(p_device, path_item, p_from, p_to, FALSE)
      UNION
      SELECT "time", 'count' AS "path", "value"
      FROM get_timeline(p_device, path_count, p_from, p_to, FALSE)
    ) AS subquery1 -- name required but not used
    ORDER BY "time"
  )
  LOOP

    --RAISE NOTICE '_rec %', _rec;

    -- update dimensions
    _dimchange := FALSE;
    IF _rec.path = 'order' THEN
      _dimensions := _dimensions || ('{"order":"' || _rec.value || '"}')::jsonb;
      _values := '{}'::jsonb;
      _dimchange := TRUE;
    ELSEIF _rec.path = 'item' THEN
      _dimensions := _dimensions || ('{"item":"' || _rec.value || '"}')::jsonb;  
      _values := '{}'::jsonb;
      _dimchange := TRUE;
    
    -- update values
    ELSEIF _rec.path = 'count' THEN
      --. track these in plain variables instead for speed
      _values := _values || ('{"count":"' || _rec.value || '"}')::jsonb;
      _duration := _rec.time - _start_time;
      _values := _values || ('{"duration":"' || _duration::text || '"}')::jsonb;    
      -- _count := _rec.value;
      -- _duration := _rec.time - _start_time; 
    END IF;
  
    _key := REPLACE(_dimensions::TEXT, '"', ''''); -- convert " to ' so can use as a json key
    _row := ('{"' || _key || '":' || _values::TEXT || '}')::jsonb;  

    --RAISE NOTICE '_row %', _row;

    -- if dimension changed, start a 'timer' for this job
    IF (_dimchange) THEN
      _start_time := _rec.time;
    END IF;

    -- merge row into our intermediate table
    IF ((NOT _row IS NULL) AND (NOT _values = '{}'::jsonb)) THEN 
      _tbl := _tbl || _row;
    END IF;
  
  END LOOP;

--  RAISE NOTICE '_tbl %', _tbl;

  RAISE NOTICE 'Building output...';
  
  FOR _key, _value IN 
    SELECT * FROM jsonb_each(_tbl)
  LOOP 
--    RAISE NOTICE '% %', _key, _value;
  
    -- loop over dimensions for this row, update our output table cells
    FOR _key2, _value2 IN
      SELECT * FROM jsonb_each_text(REPLACE(_key, '''', '"')::jsonb)
    LOOP
      IF _key2 = 'order' THEN 
        "order" := _value2;
      ELSEIF _key2 = 'item' THEN
        "item" := _value2;
      END IF;
    END LOOP;
  
    -- assign values to output table row
    "line" := p_device;
    "count" := _value->>'count';
    "duration" := _value->>'duration';
    -- extract (epoch from duration)/60.0
    --"duration" := EXTRACT(epoch FROM round((_value->>'duration')::numeric, 1)::interval) / 60.0; -- minutes
  
    -- add row to the returned table of the function
    RETURN NEXT; 
  
  END LOOP;
END;
$BODY$
LANGUAGE plpgsql;


--. turn this off before committing
SELECT * FROM get_jobs('2021-11-05', 'Line1');
 WITH
   p_day AS (VALUES ('2021-11-05'::date))
 SELECT * FROM get_jobs('Line1',
   (EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint,
   (EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '1 day') * 1000)::bigint
 );
