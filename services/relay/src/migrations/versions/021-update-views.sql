---------------------------------------------------------------------
-- views
---------------------------------------------------------------------

DROP VIEW IF EXISTS history_text;
DROP VIEW IF EXISTS history_float;
DROP VIEW IF EXISTS history_all;


--. some fns have ->>0 etc in them
CREATE OR REPLACE VIEW history_all AS
SELECT
  devices.props->>'path' AS device, -- was 'name' as device
  dataitems.props->>'path' AS path,
  history.time,
  history.value->>0 as value, -- float or string - was just history.value
  dataitems.props->>'units' as units -- new column
FROM raw.history
JOIN raw.nodes AS devices ON raw.history.node_id=devices.node_id
JOIN raw.nodes AS dataitems ON raw.history.dataitem_id=dataitems.node_id;


-- note: float is an alias for 'double precision' or float8
--. how handle UNDEFINED? should translate to null in relay?
-- CREATE OR REPLACE VIEW history_float AS
-- -- SELECT device, path, time, value::float
-- SELECT device, path, time, value
-- FROM history_all
-- -- WHERE jsonb_typeof(value) = 'number';
-- WHERE pg_typeof(value) = 'number';

CREATE OR REPLACE VIEW history_float AS
SELECT
  devices.props->>'path' AS device, -- was 'name' as device
  dataitems.props->>'path' AS path,
  history.time,
  history.value::float,
  dataitems.props->>'units' as units -- new column
FROM raw.history
JOIN raw.nodes AS devices ON raw.history.node_id=devices.node_id
JOIN raw.nodes AS dataitems ON raw.history.dataitem_id=dataitems.node_id
WHERE jsonb_typeof(value) = 'number';


-- note: #>>'{}' extracts the top-level json string without enclosing double quotes
-- see https://dba.stackexchange.com/questions/207984/unquoting-json-strings-print-json-strings-without-quotes
-- CREATE OR REPLACE VIEW history_text AS
-- SELECT device, path, time, value#>>'{}' as value
-- FROM history_all
-- WHERE jsonb_typeof(value) = 'string';

CREATE OR REPLACE VIEW history_text AS
SELECT
  devices.props->>'path' AS device, -- was 'name' as device
  dataitems.props->>'path' AS path,
  history.time,
  history.value#>>'{}' as value,
  '' as units -- new column
FROM raw.history
JOIN raw.nodes AS devices ON raw.history.node_id=devices.node_id
JOIN raw.nodes AS dataitems ON raw.history.dataitem_id=dataitems.node_id
WHERE jsonb_typeof(value) = 'string';
