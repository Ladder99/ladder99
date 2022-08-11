// endpoint
// fetch data from url endpoint as xml/js tree

import fetch from 'node-fetch' // https://github.com/node-fetch/node-fetch
import convert from 'xml-js' // convert xml to json https://github.com/nashwaan/xml-js
import * as lib from './common/lib.js'

const waitTryAgain = 4000 // ms

// xml to js conversion options
// https://github.com/nashwaan/xml-js#compact-vs-non-compact
// https://github.com/nashwaan/xml-js#options-for-converting-xml--js-object--json
// https://github.com/nashwaan/xml-js#options-for-changing-key-names
const convertOptions = {
  compact: true,
  ignoreDoctype: true,
  ignoreDeclaration: true,
  ignoreInstruction: true,
  trim: true, // ditch whitespace around text values
  attributesKey: '_', // default is '_attributes'
  textKey: '$', // default is '_text'
}

export class Endpoint {
  //
  // each endpoint has an agent object, which comes from setup yaml
  constructor(agent) {
    this.agent = agent // eg { alias, url, ignore, retention, devices, ... }
  }

  // get data from agent rest endpoint as js object tree.
  // later agents can provide json, but best to always get xml and
  // transform to js, so don't need to know agent version.
  // type is 'probe', 'current', or 'sample'.
  // called by data.js
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
        await lib.sleep(waitTryAgain)
      }
    } while (!jsTree)
    return jsTree
  }

  // get url
  // type is 'probe', 'current', or 'sample'.
  // from and count are optional.
  getUrl(type, from, count) {
    const base = `${this.agent.url}/${type}`
    const fromStr = from !== null ? `from=${from}&` : ''
    const url = from === undefined ? base : `${base}?${fromStr}count=${count}`
    return url
  }
}
