-- update raw.bins to allow partial minutes in active and available columns -
-- then can use resolution=15seconds etc.

-- drop view so can change underlying raw.bins table
drop view if exists metrics;

-- update raw.bins table
alter table raw.bins alter column active type float; -- will convert values from int to float
alter table raw.bins alter column available type float; -- ditto
alter table raw.bins rename column active to active_mins;
alter table raw.bins rename column available to available_mins;

-- recreate metrics view
create or replace view metrics as
select 
  devices.props->>'path' as device, -- eg 'Main/ConversionPress'
  bins.resolution, -- eg '1 minute'::interval
  bins.time,
  
  -- counts
  bins.active_mins,
  bins.available_mins,
  bins.good_count,
  bins.total_count,
  bins.reject_count,
  time_mins,
  downtime_mins,

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

-- epoch is seconds, so divide by 60 to get minutes
cross join lateral (select extract(epoch from resolution)/60.0 as time_mins) as e1
cross join lateral (select time_mins - coalesce(active_mins,0) as downtime_mins) as e2

cross join lateral (select get_rate(total_count, time, resolution) as actual_rate) as r1
cross join lateral (select get_rate(reject_count, time, resolution) as reject_rate) as r2

cross join lateral (select divide(active_mins, available_mins) as availability) as c1
cross join lateral (select divide(good_count, total_count) as quality) as c2
cross join lateral (select divide(actual_rate, 200) as performance) as c3 --. fix
cross join lateral (select divide(reject_rate, 200) as reject_performance) as c4 --. fix

cross join lateral (select availability * quality * performance as oee) as o1

join raw.nodes as devices on raw.bins.device_id = devices.node_id;
