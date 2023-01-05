---------------------------------------------------------------------
-- utiliz factors
---------------------------------------------------------------------

--. this splits from the 'main' branch - will want to bring there also

---------------------------------------------------------------------
-- get the utilization factor for each machine.
---------------------------------------------------------------------

-- these values come from a spreadsheet, Grafana Allowance Calculation.xlsx.
--. hardcode values here for now.
--. next step is to fetch these from a table that guy can update via a ui.
--. turning these off for now (setting to 1.0) - will develop setup allowance instead.

create or replace function get_utilization_factor(device text)
returns float language sql immutable parallel safe as
$$
  select case 
    when device='Jumbo' then 1.0
    -- when device='Jumbo' then 1.21
    -- when device='Marumatsu' then 1.33
    -- when device='Solarco' then 1.0
    -- when device='PAC48' then 1.0
    -- when device='Bahmuller' then 1.0
    -- when device='Gazzella' then 1.0
    else 1.0 
  end
$$;

-- select get_utilization_factor('Marumatsu')


-- now make fns to use the utilization factors

---------------------------------------------------------------------
-- get_availability_from_metrics_view
---------------------------------------------------------------------
-- see 009-metrics.sql for the original version of this fn
-- this adds in the utilization factor

--. call this get_availability_timeline?

drop function if exists get_availability_from_metrics_view(text, bigint, bigint, text);

create or replace function get_availability_from_metrics_view(
  in p_device text, -- the device name, eg 'Cutter'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint, -- stop time in milliseconds since 1970-01-01
  in p_binsize text = null -- override calculated bin size, eg 'day'
)
returns table ("time" timestamptz, "availability" float)
language plpgsql
as
$body$
declare
  v_start timestamptz := ms2timestamptz(p_start);
  v_stop timestamptz := ms2timestamptz(p_stop);
  v_range interval := v_stop - v_start;
  -- choose v_binsize based on v_range size
  v_binsize interval := case 
    when (p_binsize is not null) then '1 '||p_binsize -- eg '1 day'
    -- note: interval of month or greater is not supported by postgres!
    -- when (v_range > interval '2 months') then '1 month'
    when (v_range > interval '2 weeks') then '1 week'
    when (v_range > interval '2 days') then '1 day'
    when (v_range > interval '2 hours') then '1 hour'
    else '1 minute' --. handle 5 min interval?
  end;
  v_utilization_factor float := get_utilization_factor(p_device);
begin
  return query
    select 
      metrics.time, metrics.availability * v_utilization_factor as availability
    from 
      metrics
    where 
      metrics.device = p_device -- eg 'Marumatsu'
      and resolution = v_binsize -- eg '1 day'
      and metrics.time between v_start and v_stop
    order by 
      time
    ;
end;
$body$;

-- test

-- -- --set timezone to 'America/Chicago';
--  select time, availability
--  from get_availability_from_metrics_view(
--    'Marumatsu',
--    timestamptz2ms('2021-12-29 18:00:00'),
--    timestamptz2ms('2021-12-29 19:00:00')
--  --  timestamptz2ms('2021-12-29 20:00:00')
--  );



---------------------------------------------------------------------
-- get_availability_value
---------------------------------------------------------------------
-- get a single record with time, avg availability over the current time range.
-- availability will be an average between 0 and 1, or -1 if no records for the day.
-- note: this is a brute-force sum over all minutes in the time range,
-- so eg if select 7 days you'd be summing over ~10k records!
-- and we use the bins table rather than the metrics view to potentially avoid
-- the view creating the calculated 'availability' column, which would be expensive.

drop function if exists get_availability_value(text, bigint, bigint);

create or replace function get_availability_value(
  in p_device text, -- the device name, eg 'Marumatsu'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint -- stop time in milliseconds since 1970-01-01
)
returns table ("time" timestamptz, "availability" float)
language plpgsql
as
$body$
begin
  return query
    select
      min(bins.time) as time,
      case 
        when count(*) = 0 then -1
        else sum(active)::float / sum(available)::float * get_utilization_factor(p_device)
      end
        as availability
    from 
      bins
      join nodes on nodes.node_id = bins.device_id
    where
      nodes.props->>'name' = p_device -- eg 'Marumatsu'
      and resolution = '00:01:00'::interval -- one minute bins
      and bins.time >= ms2timestamptz(p_start)
      and bins.time < ms2timestamptz(p_stop);
end;
$body$;


-- test
-- select * from get_availability_value('Marumatsu', timestamptz2ms('2022-12-20'), timestamptz2ms('2022-12-27'))


---------------------------------------------------------------------
-- get_department_availability
---------------------------------------------------------------------
-- get availability for all machines in a department.
-- need to scale each machine by its utilization factor.
-- this will be used by selected and today's utilization dials at top of main page.

--. pass in department name, eg 'Corrugated' - currently we assume all devices are in that dept.

-- drop function if exists get_department_availability(text, bigint, bigint);
drop function if exists get_department_availability(bigint, bigint);

create or replace function get_department_availability(
  -- in p_department text, -- the department name, eg 'Corrugated'
  in p_start bigint, -- start time in milliseconds since 1970-01-01
  in p_stop bigint -- stop time in milliseconds since 1970-01-01
)
returns table ("time" timestamptz, "availability" float)
language plpgsql
as
$body$
begin
  return query
    select time_bin as time, avg(foo.availability * get_utilization_factor(device)) as availability from (
      select
        nodes.props->>'name' as device, -- eg 'Marumatsu'
        date_trunc('day', bins.time) as time_bin, -- binsize=day
        sum(coalesce(active::float,0)) / sum(nullif(available::float,0.0)) as availability
      from bins
        join nodes on nodes.node_id = bins.device_id
      where
        resolution = '00:01:00'::interval -- resolution=1min
        and bins.time >= ms2timestamptz(p_start)
        and bins.time < ms2timestamptz(p_stop)
      group by device, time_bin
      order by device, time_bin
    ) as foo
  group by time_bin;
end;
$body$;


-- test
-- -- select * from get_department_availability('Corrugated', timestamptz2ms('2022-12-20'), timestamptz2ms('2022-12-27'))
-- select * from get_department_availability(timestamptz2ms('2022-12-20'), timestamptz2ms('2022-12-27'))
-- select * from get_department_availability(timestamptz2ms('2023-01-01'), timestamptz2ms('2023-01-05'))





