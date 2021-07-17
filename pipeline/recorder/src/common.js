// keep this in synch by copying between services:
// adapter, recorder
// simpler than making a library somehow

import fs from 'fs' // node lib for filesystem
import libyaml from 'js-yaml' // see https://github.com/nodeca/js-yaml

// import a yaml file and parse to js struct.
// returns the js struct or null if file not avail.
/** @returns {object} */
export function importYaml(path) {
  try {
    const yaml = fs.readFileSync(path, 'utf8')
    const yamlTree = libyaml.load(yaml)
    return yamlTree
  } catch (error) {
    console.log(error.message)
  }
  return null
}
