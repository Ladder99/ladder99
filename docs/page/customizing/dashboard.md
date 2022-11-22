# Dashboard

Open up Grafana at http://localhost/d/host - note the header has a time range of 3 hours, and a refresh rate of 5 seconds. 


## Queries

Now let's look at a query. Click on the CPU header and select 'Edit', then look in the 'Data Source' box -

```sql
SELECT time, value as total
FROM history_float
WHERE
  path='$device/CpuTotal'
  and $__timeFilter("time")
ORDER BY time
```

This is a SQL query, fetching data from the local Postgres database, which is running in Docker. 

`$device` is a variable, which can be specified in the Grafana page settings. In this case, it's equivalent to 'Main/Host', so the complete path is 'Main/Host/cpu-total'. 

`$__timeFilter("time")` is a Grafana maco, which expands to something like *"time" BETWEEN '2022-08-22T12:03:25.593Z' AND '2022-08-22T15:03:25.593Z'* in the final query. 

This query will be run every 5 seconds, and the graph updated. 

Click 'Discard' to exit the query editor. 


## Functions

Now let's look at another query, for the timeline on the main page - click on 'Main' in the header. 

Click on 'Timeline', and 'Edit'. This has a series of queries, starting with

```sql
SELECT time, value as "Availability"
FROM get_timeline('$device', '$device/Availability', $__from, $__to, true, '1d')
```

In this case, we're calling a function defined in the database that can be used for timeline graphs. It's basically a wrapper around this -

```sql
SELECT history_all.time, history_all.value->>0 AS value -- note: ->>0 extracts the top-level jsonb value
FROM history_all
WHERE
  device = devicename and
  path = pathname and
  history_all.time >= from_time and
  history_all.time <= to_time
```

We're selecting time and value from the history_all view for a given device, path, and time range. 


## DataItems

You can see the available dataitems in the 'DataItems' page.
