// wrap bins table

// const resolutions = 'minute,hour,day,week,month,year'.split(',') //. 5min? 15min?
// const resolutions = '15seconds,1minute,1hour,1day,1week,1month,1year'.split(',') //. 5min? 15min?
// note: '15 secs' works with time_bucket, but not with date_trunc.
// 'month' works with date_trunc but not time_bucket.
// so, forget months.
// const resolutions = '15 seconds,1 minute,1 hour,1 day,1 week'.split(',') // ehh, don't need 15secs - grafana just uses 1min
const resolutions = '1 minute,1 hour,1 day,1 week'.split(',')

// increment values in the bins table.
// rounds the given time down to nearest min, hour, day, week etc,
// and increments the given column for each.
// column is 'active', 'available', 'good_count', etc.
//. this is an alternative to aggregated queries, which might use in future.
//. make this a stored procedure so pg won't have to parse the sql each time.
// export async function add(db, node_id, time, column, delta = 1) {
export async function add(db, node_id, time, column, delta = 1) {
  const timeISO = time.toISOString() // eg 4:13am -> '2023-03-03T10:13:04.873Z'
  // rollup counts for different time-scales
  for (let resolution of resolutions) {
    // upsert/increment the given column by delta
    // note: time_bucket is a timescaledb function, which is like pgsql's date_trunc fn,
    // but it allows arbitrary time intervals, like '15 seconds'.
    // BUT unlike date_trunc, time_bucket doesn't handle timezones until timescaledb 2.8.
    // and rather than having to upgrade the db manually,
    // need to handle timezone manually.
    // ie tried this but didn't work -
    //   time_bucket('${resolution}', '${timeISO}'::timestamptz),
    // see https://www.timescale.com/blog/nightmares-of-time-zone-downsampling-why-im-excited-about-the-new-time_bucket-capabilities-in-timescaledb/
    const sql = `
        insert into raw.bins (device_id, resolution, time, ${column})
          values (
            ${node_id},
            '${resolution}'::interval,
            time_bucket('${resolution}', timezone(current_setting('timezone'), '${timeISO}'::timestamptz)),
            ${delta}
          )
            on conflict (device_id, resolution, time) do
              update set ${column} = coalesce(raw.bins.${column}, 0) + ${delta};
      `
    // console.log(sql)
    await db.query(sql)
  }
}
