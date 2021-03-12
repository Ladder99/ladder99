const buildXml = require('./build-xml.js')
// const buildJs = require('./build-js.js')

const sourcefiles = process.argv.slice(2) // eg ['input/device-ccs-pa.yaml']

buildXml(sourcefiles)
