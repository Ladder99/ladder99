---------------------------------------------------------------------
-- add functions to postgres
---------------------------------------------------------------------

-- timescaledb - lets you make hypertables for storing time-series data
-- see https://www.timescale.com/
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- tablefunc - makes crosstab function available for debugging
-- see https://www.postgresql.org/docs/13/tablefunc.html
-- and https://stackoverflow.com/questions/3002499/postgresql-crosstab-query
CREATE EXTENSION IF NOT EXISTS tablefunc;
