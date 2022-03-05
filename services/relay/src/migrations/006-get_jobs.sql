-- get_jobs

-- get information about sales orders and jobs for a given time range.
-- uses get_timeline fn.

-- use from grafana like
--  SELECT
--   "order" as "Sales Order",
--   "item" as "Item",
--   "count" as "Count",
--   extract (epoch from "duration")/60.0 as "Duration (mins)", --.  improve this
--   "rework" as "Rework"
--  FROM get_jobs('Line' || ${line_all}, $__from, $__to);


-- do this if change parameters OR return signature
-- DROP FUNCTION IF EXISTS get_jobs(TEXT, bigint, bigint);

CREATE OR REPLACE FUNCTION get_jobs (
  IN p_device TEXT, -- the device name, eg 'Line1'
  IN p_from bigint, -- start time in milliseconds since 1970-01-01
  IN p_to bigint -- stop time in milliseconds since 1970-01-01
)
RETURNS TABLE ("line" TEXT, "order" TEXT, "item" TEXT, "count" TEXT, "duration" interval, "rework" TEXT)
AS
$BODY$
DECLARE
  -- specify some paths
  --. pass these in with these as defaults?
  path_order constant TEXT = 'controller/processOccurrence/process_aggregate_id-order_number[sales_order]';
  path_item constant TEXT = 'controller/partOccurrence/part_kind_id-part_name';
  path_count constant TEXT = 'controller/partOccurrence/part_count-complete';
  --  path_rework constant TEXT = 'controller/partOccurrence/part_count-complete'; --...
  path_all constant TEXT[] = ARRAY[path_order, path_item, path_count];
  _rec record;
  _key TEXT;
  _value jsonb;
  _key2 TEXT;
  _value2 TEXT;
  _dimensions jsonb := '{}';
  _values jsonb := '{}';
  _tbl jsonb := '{}'; -- an intermediate table, keyed on a dimension blob, values a json obj  
  _row jsonb;
  _dimchange boolean;
  _start_time timestamp;
  _duration INTERVAL;
BEGIN
  RAISE NOTICE '------';
  RAISE NOTICE 'Collecting data...';

  -- get timeline data for all the dataitems we're interested in,
  -- then merge/union them and sort by time. 
  -- this way we get a stream of events that we can process in order.
  -- we pass FALSE so we get the actual timestamp for the first value,
  -- instead of the 'left' edge (p_from).
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

  -- loop over the events - each with _rec.time, _rec.path, _rec.value
  LOOP

    -- check for dimension changes - merge any into _dimensions jsonb dict,
    -- and clear the _values dict.
    _dimchange := FALSE;
    IF _rec.path = 'order' THEN
      _dimensions := _dimensions || jsonb_build_object('order', _rec.value);
      _values := '{}'::jsonb;
      _dimchange := TRUE;
    ELSEIF _rec.path = 'item' THEN
      _dimensions := _dimensions || jsonb_build_object('item', _rec.value);
      _values := '{}'::jsonb;
      _dimchange := TRUE;
    
    -- check for value changes - merge any into _values jsonb dict
    ELSEIF _rec.path = 'count' THEN
      _values := _values || jsonb_build_object('count', _rec.value);
      _duration := _rec.time - _start_time; -- keep duration up-to-date
      _values := _values || jsonb_build_object('duration', _duration);
      --. track those in plain variables instead for more speed?
      --  but then would need to write to _values dict on dimension change?
      -- _count := _rec.value;
      -- _duration := _rec.time - _start_time; 
    END IF;

    -- if dimension changed, start a 'timer' for this job
    IF (_dimchange) THEN
      _start_time := _rec.time;
    END IF;

    -- store dimensions (as json string) and values to an intermediate 'table', _tbl.
    _row := jsonb_build_object(_dimensions::TEXT, _values);
    IF ((NOT _row IS NULL) AND (NOT _values = '{}'::jsonb)) THEN 
      _tbl := _tbl || _row;
    END IF;
  
  END LOOP;

  RAISE NOTICE 'Building output...';

  -- loop over records in our intermediate table
  FOR _key, _value IN 
    SELECT * FROM jsonb_each(_tbl)
  LOOP 
    -- loop over dimensions for this row, update our output table dimension cells
    FOR _key2, _value2 IN
      SELECT * FROM jsonb_each_text(_key::jsonb)
    LOOP
      IF _key2 = 'order' THEN 
        "order" := _value2;
      ELSEIF _key2 = 'item' THEN
        "item" := _value2;
      END IF;
    END LOOP;
  
    -- now assign values to output table row
    "line" := p_device; -- eg 'Line1'
    "count" := _value->>'count';
    "duration" := _value->>'duration';
  
    -- add the cell values to a row for the returned table
    RETURN NEXT; 
  
  END LOOP;
END;
$BODY$
LANGUAGE plpgsql;


-- test get_jobs fn
--. turn this off before committing

-- WITH
--   p_day AS (VALUES ('2021-11-05'::date))
-- SELECT * FROM get_jobs('Line1',
--   (EXTRACT(epoch FROM (TABLE p_day)) * 1000)::bigint,
--   (EXTRACT(epoch FROM (TABLE p_day) + INTERVAL '1 day') * 1000)::bigint
-- );

