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
  // latest agents can provide json, but best to always get xml and
  // transform to js, so don't need to know agent version.
  // type is 'probe', 'current', or 'sample'.
  // called by data.js
  async fetchJsTree(type, from, count) {
    const url = this.getUrl(type, from, count)
    let jsTree
    do {
      try {
        const response = await fetch(url)
        const xml = await response.text() // try to parse response as xml
        jsTree = convert.xml2js(xml, convertOptions) // try to convert to js tree
        // make sure we have a valid agent response
        if (
          !jsTree.MTConnectDevices &&
          !jsTree.MTConnectStreams &&
          !jsTree.MTConnectError
        ) {
          throw new Error(
            'Invalid agent response - should have MTConnectDevices, MTConnectStreams, or MTConnectError.'
          )
        }
      } catch (error) {
        // error.code could be ENOTFOUND, ECONNREFUSED, EHOSTUNREACH, etc
        // console.error('Relay error', error)
        console.log(`Relay error reading`, url)
        console.log(`Relay error -`, error.message)
        console.log(`Relay jsTree:`)
        console.dir(jsTree, { depth: 3 })
        console.log(`Relay error - retrying in ${waitTryAgain} ms...`)
        await lib.sleep(waitTryAgain)
        jsTree = null // so loop again
      }
    } while (!jsTree)
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
