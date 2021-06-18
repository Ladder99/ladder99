import fs from 'fs' // node lib
import fetch from 'node-fetch' // see https://github.com/node-fetch/node-fetch
// import * as libapp from './libapp.js'

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

  // get json data from agent rest endpoint
  static async fetchData(url) {
    console.log(`Getting data from ${url}...`)
    try {
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

  async fetchData(type, from, count) {
    const url = this.getUrl(type, from, count)
    const data = await Endpoint.fetchData(url)
    return data
  }
}
