--------------------------------------------------------------------
-- library
-- define various utility functions
--------------------------------------------------------------------

--------------------------------------------------------------------
-- arrays
--------------------------------------------------------------------

-- define some json array to text array functions

-- lacking from postgres as of v9? still not in there in v13?
-- see https://dba.stackexchange.com/questions/54283/how-to-turn-json-array-into-postgres-array/54289

CREATE OR REPLACE FUNCTION json_arr2text_arr(_js json)
  RETURNS text[] LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT ARRAY(SELECT json_array_elements_text(_js))';

CREATE OR REPLACE FUNCTION jsonb_arr2text_arr(_js jsonb)
  RETURNS text[] LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT ARRAY(SELECT jsonb_array_elements_text(_js))';


--------------------------------------------------------------------
-- timeblocks
--------------------------------------------------------------------

-- convert timestamp to/from timeblock (arbitrary intervals since 1970-01-01).
-- eg timestamp2timeblock('now', 3600) gives number of hours since 1970-01-01.
-- note: EPOCH gives seconds since 1970-01-01.
-- note: '/' here gives the integer floor of the division.
-- need trunc otherwise timeblock gets rounded UP when time >= 30 mins.

CREATE OR REPLACE FUNCTION timestamp2timeblock(_timestamp timestamp, _interval int)
  RETURNS int LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT trunc(EXTRACT(EPOCH FROM _timestamp) / _interval);';

CREATE OR REPLACE FUNCTION timeblock2timestamp(_timeblock int, _interval int)
  RETURNS timestamp LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT to_timestamp(_timeblock * _interval)::timestamptz at time zone ''UTC''';

-- test above fns

--SELECT timestamp2timeblock('now', 3600); -- hours since 1970, eg 454943
--SELECT timestamp2timeblock('2021-11-05 07:29:02.927', 3600); -- 454471
--SELECT timestamp2timeblock('2021-11-05 07:30:02.927', 3600); -- 454471
--SELECT timestamp2timeblock('2021-11-05 07:29:02.927', 60*60*24); -- 18936 days since 1970-01-01
--SELECT timestamp2timeblock('1970-01-01', 60*60*24); -- 0 days since 1970-01-01

--SELECT timeblock2timestamp(0, 3600); -- '1970-01-01 00:00:00.000'


--------------------------------------------------------------------
-- milliseconds
--------------------------------------------------------------------

-- convert to/from timestamp and milliseconds since 1970-01-01.
-- useful because grafana supplies times in milliseconds since 1970.

CREATE OR REPLACE FUNCTION timestamp2ms(p_timestamp timestamp)
  RETURNS bigint LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT EXTRACT(EPOCH FROM p_timestamp) * 1000;';

CREATE OR REPLACE FUNCTION ms2timestamp(p_ms bigint)
  RETURNS timestamp LANGUAGE SQL IMMUTABLE PARALLEL SAFE AS 
  'SELECT to_timestamp(p_ms / 1000)::timestamptz at time zone ''UTC''';


CREATE OR REPLACE FUNCTION timestamptz2ms(p_timestamp timestamptz)
  RETURNS bigint LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
  'SELECT EXTRACT(EPOCH FROM p_timestamp) * 1000;';

CREATE OR REPLACE FUNCTION ms2timestamptz(p_ms bigint)
  RETURNS timestamptz LANGUAGE SQL IMMUTABLE PARALLEL SAFE AS 
  'SELECT to_timestamp(p_ms / 1000)::timestamptz';

-- select timestamptz2ms(now()); -- 1130pm
-- select ms2timestamptz(1638941547739); -- 1130pm



--------------------------------------------------------------------

-- handle nulls and divbyzero
--. why should numer treat nulls as zero?
create or replace function divide(numer float, denom float)
  returns float language sql immutable parallel safe as
  'select coalesce(numer,0) / nullif(denom,0.0)';

-- select divide(null, 1);
-- select divide(1, null);
-- select divide(1, 0);


create or replace function get_rate(ct int, t timestamptz, resolution interval)
  returns float language sql immutable parallel safe as
  'select divide(ct, least(extract(epoch from now() - t), extract(epoch from resolution))) * 60';

-- select get_rate(100, now() - '5 sec'::interval, '1 min');


