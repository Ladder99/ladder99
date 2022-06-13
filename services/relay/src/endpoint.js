// endpoint
// fetch data from url endpoint as xml or json

// import fs from 'fs' // node filesystem lib
import fetch from 'node-fetch' // https://github.com/node-fetch/node-fetch
import convert from 'xml-js' // convert xml to json https://github.com/nashwaan/xml-js
import * as lib from './common/lib.js'

export class Endpoint {
  constructor(baseUrl) {
    this.baseUrl = baseUrl // eg http://agent:5000
  }

  // get array of Endpoint objects
  // note this is a STATIC fn!
  static getEndpoints(setup) {
    const urls = setup.agents || ['http://agent:5000'] // defaults to the agent docker service
    const endpoints = urls.map(url => new Endpoint(url))
    return endpoints
  }

  // get data from agent rest endpoint as json.
  // best to always get xml and transform to json,
  // so don't need to know agent version.
  // type is 'probe', 'current', or 'sample'.
  //. q. why do we convert from xml to json then parse it?
  //  can't we just parse the xml directly?
  //  was this a leftover of initially reading json from the agent?
  //  (gave up on that as older agents didn't support it)
  async fetchJson(type, from, count) {
    let json
    do {
      const url = this.getUrl(type, from, count)
      // console.log(`Relay - getting data from ${url}...`)
      try {
        const response = await fetch(url)
        const xml = await response.text()
        json = JSON.parse(convert.xml2json(xml, { compact: true }))
      } catch (error) {
        if (error.code === 'ENOTFOUND') {
          console.log(`Relay error - Agent not found at ${url}...`)
        } else if (error.code === 'ECONNREFUSED') {
          console.log(`Relay error - Connection refused at ${url}...`)
        } else {
          throw error
        }
      }
      if (!json) {
        console.log(`Relay no data available - will wait and try again...`)
        await lib.sleep(4000)
      }
    } while (!json)
    return json
  }

  // get url
  // type is 'probe', 'current', or 'sample'.
  // from and count are optional.
  getUrl(type, from, count) {
    // const url =
    //   from === undefined
    //     ? `${this.baseUrl}/${type}`
    //     : `${this.baseUrl}/${type}?${
    //         from !== null ? 'from=' + from + '&' : ''
    //       }count=${count}`
    const base = `${this.baseUrl}/${type}`
    const fromStr = from !== null ? `from=${from}&` : ''
    const url = from === undefined ? base : `${base}?${fromStr}count=${count}`
    return url
  }
}
