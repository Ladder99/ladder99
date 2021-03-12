const buildXml = require('./build-xml.js')
const buildJs = require('./build-js.js')

const sourcefiles = process.argv.slice(2) // eg ['input/device-ccs-pa.yaml']

function main() {
  if (buildXml(sourcefiles)) {
    if (buildJs(sourcefiles)) {
      return 0
    }
  }
  return 1
}

main()
