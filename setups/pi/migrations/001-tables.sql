CREATE TABLE IF NOT EXISTS execution (
  time timestamptz NOT NULL,
  state text NOT NULL
);
SELECT create_hypertable('execution', 'time');
