// mtconnect application
// capture agent data and write to database

import fetch from 'node-fetch'
import pg from 'pg' // postgres driver - import { Client } from 'pg' gives error
const { Client } = pg
import * as logic from './logic.js'

console.log(`MTConnect Application starting`)
console.log(`---------------------------------------------------`)

// get envars
const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:5000'
const interval = Number(process.env.INTERVAL || 2000) // msec

;(async function () {
  // get postgres connection
  const client = new Client()
  await client.connect() // uses envars PGHOST, PGPORT, etc

  // // test connection
  // const res = await client.query('SELECT $1::text as message', ['Hello world!'])
  // console.log(res.rows[0].message) // Hello world!

  // await setupTables(client)

  // start polling
  setInterval(() => shovel(client), interval)
})()

let from = null
let count = 200
// let next = null

async function shovel(client) {
  const json = await getData('sample', from, count)

  // <MTConnectError xmlns:m="urn:mtconnect.org:MTConnectError:1.7" xmlns="urn:mtconnect.org:MTConnectError:1.7" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:mtconnect.org:MTConnectError:1.7 /schemas/MTConnectError_1.7.xsd">
  // <Header creationTime="2021-05-24T17:57:14Z" sender="b28197f93e9b" instanceId="1621875421" version="1.7.0.3" bufferSize="131072"/>
  // <Errors>
  // <Error errorCode="OUT_OF_RANGE">'from' must be greater than 647331</Error>
  // </Errors>
  // </MTConnectError >
  //. check errorCode
  if (json.MTConnectError) {
    console.log(`ERROR`)
    for (const err of json.MTConnectError.Errors) {
      console.log(err)
    }
    // reset the counter - we lost some data
    from = null
    return
  }

  // get sequence info from header
  // const { firstSequence, nextSequence, lastSequence } =
  //   json.MTConnectStreams.Header
  const { nextSequence } = json.MTConnectStreams.Header
  from = nextSequence

  // traverse the json tree and output state
  logic.traverse(json, dataItems => {
    dataItems.forEach(async dataItem => {
      const { dataItemId, timestamp, value } = dataItem
      // const tableName = dataItemId
      // const type = typeof value === 'string' ? 'text' : 'numeric'
      // const sql = `INSERT INTO "${tableName}" (time, value) VALUES($1, to_json($2::${type}));`
      // const values = [timestamp, value]
      const id = dataItemId
      const type = typeof value === 'string' ? 'text' : 'numeric'
      const sql = `INSERT INTO values (id, time, value) VALUES($1, $2, to_json($3::${type}));`
      const values = [id, timestamp, value]
      console.log(sql, { values })
      //. add try block
      await client.query(sql, values)
    })
  })
}

// fetch data from agent rest endpoint
async function getData(type, from, count) {
  // console.log(`Getting ${type} - from ${from} count ${count}...`)
  const url = getUrl(type, from, count)
  console.log(`Getting data - `, url)
  try {
    // get json from agent
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    const json = await response.json()
    return json
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log(`Agent not found at ${url}...`)
    } else {
      throw error
    }
  }
  return null
}

// get the rest endpoint url - from and count are optional
function getUrl(type, from, count) {
  const url =
    from !== null
      ? `${baseUrl}/${type}?from=${from}&count=${count}`
      : `${baseUrl}/${type}`
  return url
}
