
------------------------------------------------------------
-- bins table
------------------------------------------------------------
-- add more columns

-- create table if not exists bins (
--   device_id integer references nodes, -- node_id of a device
--   resolution interval, -- 1min, 1hr, 1day, 1week, 1month, 1quarter, 1year
--   time timestamptz, -- rounded down to start of current minute, hour, day, etc
--   active int, -- number of minutes device was active during time resolution
--   available int, -- number of minutes device was available during time resolution
--   primary key (device_id, resolution, time) -- need this so can find right record quickly for updating
-- );

alter table raw.bins add column good_count int;
alter table raw.bins add column total_count int;
alter table raw.bins add column reject_count int; -- client wants this to track rejects per shift
alter table raw.bins add column actual_rate int; --. not needed? ie view can calc rate=count/timerangefn?
alter table raw.bins add column ideal_rate int; --. better place for this?


------------------------------------------------------------
-- metrics view
------------------------------------------------------------
-- drop view if exists metrics_secondary; -- depends on metrics view
drop view if exists metrics;

create or replace view metrics as
select 
  devices.props->>'path' as device,
  bins.resolution,
  bins.time,
  bins.active, --. rename to active_mins
  bins.available, --. rename to available_mins
  -- note: coalesce returns the first non-null value (works like an or operator),
  -- and nullif returns the first value, unless it equals 0.0, when it returns null -
  -- then the whole expression is null. avoids div by zero error.
  coalesce(bins.active::float,0) / nullif(bins.available::float,0.0) as availability,
  bins.good_count,
  bins.total_count,
  bins.reject_count,
  coalesce(bins.good_count::float,0) / nullif(bins.total_count::float,0.0) as quality,
  bins.actual_rate,
  bins.ideal_rate,
  coalesce(bins.actual_rate::float,0) / nullif(bins.ideal_rate::float,0.0) as performance
from raw.bins
join raw.nodes as devices on raw.bins.device_id = devices.node_id;


------------------------------------------------------------
-- metrics_secondary view
------------------------------------------------------------

drop view if exists metrics_secondary;

create or replace view metrics_secondary as
select 
  device,
  resolution,
  time,
  availability * quality * performance as oee
from metrics;

