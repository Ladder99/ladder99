
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

alter table raw.bins add column if not exists good_count int;
alter table raw.bins add column if not exists total_count int;
alter table raw.bins add column if not exists reject_count int; -- client wants this to track rejects per shift
-- alter table raw.bins add column ideal_rate int; --. better place for this?

--. customers might want to track stats for different products also, 
-- so could add another column to the bins primary key for product - 
-- but will leave that out for now. 


------------------------------------------------------------
-- metrics view
------------------------------------------------------------

-- see https://blog.jooq.org/lateral-is-your-friend-to-create-local-column-variables-in-sql/

drop view if exists metrics;
create or replace view metrics as
select 
  devices.props->>'path' as device, -- eg 'Main/ConversionPress'
  bins.resolution, -- eg '1 minute'::interval
  bins.time,
  
  -- counts
  bins.active, --. rename to active_mins
  bins.available, --. rename to available_mins
  bins.good_count,
  bins.total_count,
  bins.reject_count,
  
  -- rates (ppm)
  actual_rate,
  reject_rate,
  
  -- components (percent)
  availability,
  quality,
  performance,
  reject_performance,

  -- operations (percent)
  oee

from raw.bins

cross join lateral (select get_rate(total_count, time, resolution) as actual_rate) as r1
cross join lateral (select get_rate(reject_count, time, resolution) as reject_rate) as r2

cross join lateral (select divide(active, available) as availability) as c1
cross join lateral (select divide(good_count, total_count) as quality) as c2
cross join lateral (select divide(actual_rate, 200) as performance) as c3 --. fix
cross join lateral (select divide(reject_rate, 200) as reject_performance) as c4 --. fix

cross join lateral (select availability * quality * performance as oee) as o1

join raw.nodes as devices on raw.bins.device_id = devices.node_id;
