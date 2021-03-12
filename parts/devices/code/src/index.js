const buildXml = require('./build-xml.js')
const buildJs = require('./build-js.js')

const sourcefiles = process.argv.slice(2) // eg ['input/device-ccs-pa.yaml']

if (buildXml(sourcefiles)) {
  if (buildJs(sourcefiles)) {
    process.exit(0)
  }
}
process.exit(1)
