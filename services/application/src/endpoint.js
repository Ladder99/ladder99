// endpoint
// fetch data from url endpoint as xml or json

import fs from 'fs' // node lib - filesystem
import fetch from 'node-fetch' // https://github.com/node-fetch/node-fetch
import convert from 'xml-js' // https://github.com/nashwaan/xml-js
import * as libapp from './libapp.js'

export class Endpoint {
  constructor(baseUrl) {
    this.baseUrl = baseUrl // eg http://localhost:5000
  }

  // get array of endpoint objects
  // str can be a url, a comma-separated list of urls, or a .txt file with a url per line
  // note this is a STATIC fn
  static getEndpoints(endpointsStr) {
    let arr = []
    if (endpointsStr.includes(',')) {
      arr = endpointsStr.split(',')
    } else if (endpointsStr.endsWith('.txt')) {
      const s = String(fs.readFileSync(endpointsStr)).trim()
      arr = s.split('\n')
    } else {
      arr = [endpointsStr]
    }
    const endpoints = arr.map(url => new Endpoint(url))
    return endpoints
  }

  // get data from agent rest endpoint as json.
  // best to always get xml and transform to json,
  // so don't need to know agent version.
  // type is 'probe', 'current', or 'sample'.
  async fetchJson(type, from, count) {
    let json
    do {
      const url = this.getUrl(type, from, count)
      console.log(`Getting data from ${url}...`)
      try {
        const response = await fetch(url)
        const xml = await response.text()
        json = JSON.parse(convert.xml2json(xml, { compact: true }))
      } catch (error) {
        if (error.code === 'ENOTFOUND') {
          console.log(`Agent not found at ${url}...`)
        } else {
          throw error
        }
      }
      if (!json) {
        console.log(`No data available - will wait and try again...`)
        await libapp.sleep(4000)
      }
    } while (!json)
    return json
  }

  // get url
  // type is 'probe', 'current', or 'sample'.
  // from and count are optional.
  getUrl(type, from, count) {
    const url =
      from === undefined
        ? `${this.baseUrl}/${type}`
        : `${this.baseUrl}/${type}?${
            from !== null ? 'from=' + from + '&' : ''
          }count=${count}`
    return url
  }
}
