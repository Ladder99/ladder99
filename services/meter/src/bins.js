// wrap bins table

const resolutions = 'minute,hour,day,week,month,year'.split(',') //. 5min? 15min?

// increment values in the bins table.
// rounds the given time down to nearest min, hour, day, week etc,
// and increments the given column for each.
// column is 'active', 'available', 'good_count', etc.
//. this is an alternative to aggregated queries, which might use in future.
//. make this a stored procedure so pg won't have to parse the sql each time.
export async function add(db, node_id, time, column, delta = 1) {
  //. what timezone is time in? what about timeISO?
  const timeISO = time.toISOString()
  // rollup counts for different time-scales
  for (let resolution of resolutions) {
    // upsert/increment the given column by delta
    const sql = `
        insert into raw.bins (device_id, resolution, time, ${column})
          values (
            ${node_id},
            ('1 '||'${resolution}')::interval,
            date_trunc('${resolution}', '${timeISO}'::timestamptz),
            ${delta}
          )
            on conflict (device_id, resolution, time) do
              update set ${column} = coalesce(raw.bins.${column}, 0) + ${delta};
      `
    await db.query(sql)
  }
}
