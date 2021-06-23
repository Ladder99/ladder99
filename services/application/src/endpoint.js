import fs from 'fs' // node lib
import fetch from 'node-fetch' // see https://github.com/node-fetch/node-fetch
// import * as libapp from './libapp.js'
import convert from 'xml-js' // see https://github.com/nashwaan/xml-js

export class Endpoint {
  constructor(baseUrl) {
    this.baseUrl = baseUrl // eg http://localhost:5000
  }

  // get array of endpoint objects - static method
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

  // get data from agent rest endpoint as xml or json
  // note this is the STATIC fn
  static async fetchData(url, fetchJson = true) {
    console.log(`Getting data from ${url}...`)
    const headers = fetchJson ? { Accept: 'application/json' } : {}
    try {
      const response = await fetch(url, { method: 'GET', headers })
      if (fetchJson) {
        const json = await response.json()
        return json
      }
      const xml = await response.text()
      // console.log(xml)
      const json = JSON.parse(convert.xml2json(xml, { compact: true }))
      //. will need some more processing to align with agent json
      // console.log(json)
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

  // type is 'probe', 'current', or 'sample'.
  async fetchData(type, from, count) {
    const url = this.getUrl(type, from, count)
    const data = await Endpoint.fetchData(url)
    return data
  }
}
