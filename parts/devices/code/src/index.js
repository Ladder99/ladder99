const fs = require('fs') // node lib
const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml

const buildXml = require('./build-xml.js')
const buildJs = require('./build-js.js')

const sourcefiles = process.argv.slice(2) // eg ['input/device-ccs-pa.yaml']

function main() {
  const ytrees = []
  for (const sourcefile of sourcefiles) {
    // read yaml string
    const ystr = fs.readFileSync(sourcefile, 'utf8')
    // convert to yaml tree
    const ytree = yaml.load(ystr)
    ytrees.push({ sourcefile, ytree })
  }
  if (buildXml(ytrees) && buildJs(ytrees)) {
    process.exit(0)
  }
  process.exit(1)
}

main()
