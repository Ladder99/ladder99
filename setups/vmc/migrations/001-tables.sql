\c vmc;

-- create table
CREATE TABLE IF NOT EXISTS values (
  id text NOT NULL,
  time timestamptz NOT NULL,
  value json
);

-- convert to timescaledb hypertable
SELECT create_hypertable('values', 'time');
