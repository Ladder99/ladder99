const fs = require('fs') // node lib
// const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml

function getArgs() {
  const nargs = process.argv.length
  const sourcefiles = process.argv.slice(2, nargs - 2) // eg ['input/device-ccs-pa.yaml']
  const outdir = process.argv[nargs - 1]
  return { sourcefiles, outdir }
}

// function getFiles() {
//   const ytrees = []
//   for (const sourcefile of sourcefiles) {
//     // read yaml string
//     const ystr = fs.readFileSync(sourcefile, 'utf8')
//     // convert to yaml tree
//     const ytree = yaml.load(ystr)
//     ytrees.push({ sourcefile, ytree })
//   }
// }
