// translate devices.yaml to devices.xml

import fs from 'fs' // node lib filesys
import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
import libxml from 'xml-js' // https://github.com/nashwaan/xml-js
import sets from './sets.js'
import xmltree from './xmltree.js'

const sourcefile = process.argv[2] // eg 'setups/demo/devices.yaml'

// main
const devices = getDevices(sourcefile)
xmltree.MTConnectDevices[0].Devices.Device = devices
const xml = getXml(xmltree)
// console.log(xml)

/**
 * get list of devices from devices.yaml
 */
function getDevices(sourcefile) {
  const devices = importYaml(sourcefile).devices
  // dir({ devices })

  // iterate over device definitions
  for (const device of devices) {
    const { id, model, properties } = device

    // get output.yaml, which defines the dataItems for the model
    const outputPath = `models/${model}/outputs.yaml`
    const outputs = importYaml(outputPath).outputs
    const outputDict = {}
    for (const output of outputs) {
      const key = output.key
      const obj = {
        id: id + '-' + key,
        type: output.type,
        subType: output.subType,
        category: output.category,
      }
      outputDict[key] = obj
    }

    // define text transforms to perform on model.yaml
    properties.deviceId = id
    const transforms = Object.keys(properties).map(key => {
      const value = properties[key]
      return str => str.replaceAll('${' + key + '}', value) // requires node15
    })

    // get model.yaml, making text substitutions with properties
    const modelPath = `models/${model}/model.yaml`
    const modelTree = importYaml(modelPath, transforms).model

    // now recurse down the model tree,
    // replacing dataItems with their output defs
    attachDataItems(modelTree, outputDict)
    dir({ modelTree })
  }

  // dir({ devices })

  // for (const sourcefile of sourcefiles) {
  //   const xmltree = translate(yamltree) // recurses
  //   const device = xmltree.Device[0]
  //   devices.push(device)
  // }

  return devices
}

/**
 * attach dataItems from outputs.yaml to model.yaml tree recursively.
 */
function attachDataItems(node, outputs) {
  // if node is an array, recurse down each element
  if (Array.isArray(node)) {
    for (const el of node) {
      attachDataItems(el, outputs)
    }
    // else if node is an object, check if it has dataItems
  } else if (node !== null && typeof node === 'object') {
    if (node.dataItems) {
      const arr = node.dataItems.dataItem
      for (let i = 0; i < arr.length; i++) {
        if (outputs[arr[i]]) {
          arr[i] = outputs[arr[i]]
        }
      }
      // no dataItems - recurse down dict values?
    }
    for (const key of Object.keys(node)) {
      if (key !== 'dataItems') {
        const el = node[key]
        attachDataItems(el, outputs)
      }
    }
  }
}

/**
 * translate yaml tree to xml tree recursively
 */
function translate(yamltree) {
  if (Array.isArray(yamltree)) {
    return yamltree.map(el => translate(el))
  } else if (typeof yamltree === 'object') {
    const obj = {}
    const attributes = {}
    const elements = {}
    const keys = Object.keys(yamltree)
    for (const key of keys) {
      const el = yamltree[key]
      if (sets.attributes.has(key)) {
        attributes[key] = el
      } else if (sets.values.has(key)) {
        obj._text = el
      } else if (sets.hidden.has(key)) {
        // ignore
      } else {
        const element = translate(el)
        elements[capitalize(key)] = element
      }
    }
    return { _attributes: attributes, ...elements, ...obj }
  } else {
    return null
  }
}

/**
 * capitalize a string
 */
function capitalize(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

/**
 * import a yaml file, apply any transforms, parse it,
 * and return as a js structure.
 * @param path {string}
 * @returns {object}
 */
function importYaml(path, transforms = []) {
  let yaml = fs.readFileSync(path, 'utf8')
  for (const transform of transforms) {
    yaml = transform(yaml)
  }
  const yamltree = libyaml.load(yaml) // parse yaml
  return yamltree
}

/**
 * convert xmltree js structure to xml string
 */
function getXml(xmltree) {
  const xml = libxml.js2xml(xmltree, { compact: true, spaces: 2 })
  return xml
}

/**
 * print an object with unlimited depth
 */
function dir(obj) {
  console.dir(obj, { depth: null })
}
