
these are compiled from yaml sources


old, from outputs.js
better to compile the types.yaml to types.js so can import directly - otherwise would need to make models into a npm package with node_modules etc
// import fs from 'fs' // node lib for filesys
// import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
// const yamlfile = '../types.yaml'
// const yaml = fs.readFileSync(yamlfile, 'utf8')
// const yamltree = libyaml.load(yaml)
// // @ts-ignore okay to cast here
// const { types } = yamltree
