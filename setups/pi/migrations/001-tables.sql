-- create tables

CREATE TABLE IF NOT EXISTS execution (
  time timestamptz NOT NULL,
  value text NOT NULL
);

-- convert to timescaledb hypertable
SELECT create_hypertable('execution', 'time');


-- create views

-- CREATE VIEW execution_summary_minute WITH (timescaledb.continuous) AS
-- SELECT time_bucket(INTERVAL '1 minute', time) AS bucket,
--        AVG(temperature) AS avg_temp,
--        AVG(humidity) AS avg_humidity
-- FROM sensor_data
-- WHERE avg_humidity >= 0.0
--   AND avg_humidity <= 100.0
-- GROUP BY device_id,
--          bucket;
