DROP TABLE IF EXISTS execution;

CREATE TABLE IF NOT EXISTS execution (
  time timestamptz NOT NULL,
  value text NOT NULL
);

SELECT create_hypertable('execution', 'time');
