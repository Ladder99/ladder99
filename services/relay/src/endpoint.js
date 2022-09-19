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
  constructor(url) {
    this.url = url
  }

  // get data from agent rest endpoint as js object tree.
  // later agents can provide json, but best to always get xml and
  // transform to js, so don't need to know agent version.
  // type is 'probe', 'current', or 'sample'.
  // called by data.js
  async fetchJsTree(type, from, count) {
    // get raw text response from endpoint - repeat until no error
    let response
    do {
      const url = this.getUrl(type, from, count)
      try {
        response = await fetch(url)
      } catch (error) {
        if (error.code === 'ENOTFOUND') {
          console.log(`Relay error - Agent not found at ${url}...`)
        } else if (error.code === 'ECONNREFUSED') {
          console.log(`Relay error - Connection refused at ${url}...`)
        } else if (error.code === 'EHOSTUNREACH') {
          console.log(`Relay error - Host unreachable at ${url}...`)
        } else {
          // throw error // don't throw error - would kill relay
          console.error('Relay error', error)
        }
        console.log('Relay error - fetch response', response)
        console.log(`Relay error - retrying in ${waitTryAgain} ms...`)
        await lib.sleep(waitTryAgain)
      }
    } while (!response)

    // parse response as xml, convert to a js tree
    const xml = await response.text()
    const jsTree = convert.xml2js(xml, convertOptions)
    // console.dir(jsTree, { depth: 5 })
    // process.exit(0)
    return jsTree
  }

  // get url
  // type is 'probe', 'current', or 'sample'.
  // from and count are optional.
  getUrl(type, from, count) {
    const base = `${this.url}/${type}`
    const fromStr = from !== null ? `from=${from}&` : ''
    const url = from === undefined ? base : `${base}?${fromStr}count=${count}`
    return url
  }
}
