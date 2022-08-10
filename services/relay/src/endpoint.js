// endpoint
// fetch data from url endpoint as xml/js tree

import fetch from 'node-fetch' // https://github.com/node-fetch/node-fetch
import convert from 'xml-js' // convert xml to json https://github.com/nashwaan/xml-js
import * as lib from './common/lib.js'

// xml to js options
// https://github.com/nashwaan/xml-js#compact-vs-non-compact
// https://github.com/nashwaan/xml-js#options-for-converting-xml--js-object--json
// https://github.com/nashwaan/xml-js#options-for-changing-key-names
const convertOptions = {
  compact: true,
  ignoreDeclaration: true,
  ignoreInstruction: true,
  ignoreDoctype: true,
  trim: true,
  attributesKey: '_', // default '_attributes'
  textKey: '$', // default '_text'
}

export class Endpoint {
  //
  // each endpoint has a url and an alias, which come from setup yaml
  constructor(baseUrl, alias) {
    // remove any trailing slash
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1)
    }
    this.baseUrl = baseUrl // eg 'http://agent:5000'
    this.alias = alias
  }

  // get array of Endpoint objects - called from index.js
  // note this is a STATIC fn
  static getEndpoints(setup) {
    // const urls = setup.agents || ['http://agent:5000'] // defaults to the local agent docker service
    // const endpoints = urls.map(url => new Endpoint(url))
    // return endpoints
    const agents = setup.agents || { main: 'http://agent:5000' } // defaults to local agent service
    const endpoints = Object.keys(agents).map(
      alias => new Endpoint(agents[alias], alias) // ie url, alias
    )
    return endpoints
  }

  // get data from agent rest endpoint as js object tree.
  // later agents can provide json, but best to always get xml and
  // transform to js, so don't need to know agent version.
  // type is 'probe', 'current', or 'sample'.
  async fetchJsTree(type, from, count) {
    let jsTree
    do {
      const url = this.getUrl(type, from, count)
      try {
        const response = await fetch(url)
        const xml = await response.text()
        jsTree = convert.xml2js(xml, convertOptions)
        // console.dir(jsTree, { depth: 5 })
        // process.exit(0)
      } catch (error) {
        if (error.code === 'ENOTFOUND') {
          console.log(`Relay error - Agent not found at ${url}...`)
        } else if (error.code === 'ECONNREFUSED') {
          console.log(`Relay error - Connection refused at ${url}...`)
        } else {
          throw error
        }
      }
      if (!jsTree) {
        console.log(`Relay no data available - will wait and try again...`)
        await lib.sleep(4000)
      }
    } while (!jsTree)
    return jsTree
  }

  // get url
  // type is 'probe', 'current', or 'sample'.
  // from and count are optional.
  getUrl(type, from, count) {
    const base = `${this.baseUrl}/${type}`
    const fromStr = from !== null ? `from=${from}&` : ''
    const url = from === undefined ? base : `${base}?${fromStr}count=${count}`
    return url
  }
}
