// capture agent json output and save to example.json or xml

import fs from 'fs'
import fetch from 'node-fetch'

const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:5000'

shovel()

async function shovel() {
  // const url = `${baseUrl}/probe`
  const url = `${baseUrl}/current`
  // const from = 1
  // const count = 200
  // const url = `${baseUrl}/sample?from=${from}&count=${count}`
  try {
    const response = await fetch(url, {
      method: 'GET',
      // headers: { Accept: 'application/json' }, // turn on for json
    })
    // save as json
    // const tree = await response.json()
    // save example output - rename to example-current.json etc
    // fs.writeFileSync('./example.json', JSON.stringify(tree))

    // save as xml
    const tree = await response.text()
    fs.writeFileSync('./example.xml', tree) // rename as needed
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log(`Agent not found at ${url} - waiting...`)
    } else {
      throw error
    }
  }
}
