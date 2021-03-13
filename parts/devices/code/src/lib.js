const fs = require('fs') // node lib
// const yaml = require('js-yaml') // https://github.com/nodeca/js-yaml

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

module.exports = { getArgs }
