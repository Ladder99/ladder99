// translate devices.yaml to devices.xml

// note: we use yaml and xml for the strings,
// yamltree and xmltree for the corresponding js structures.

import fs from 'fs' // node lib filesys
import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
import libxml from 'xml-js' // https://github.com/nashwaan/xml-js
import sets from './sets.js'
import xmltree from './xmltree.js' // base xml structure

const sourcefile = process.argv[2] // eg 'setups/demo/devices.yaml'
const destfile = process.argv[3] // eg 'setups/demo/volumes/agent/devices.xml'

// main
const devices = loadYamlTree(sourcefile).devices
attachDevices(xmltree, devices)
saveXmlTree(xmltree, destfile)

/**
 * get list of xml-js devices from devices.yaml
 */
function attachDevices(xmltree, devices) {
  const xmldevices = []

  // iterate over device definitions
  for (const device of devices) {
    const { id, model, properties } = device

    // get array of outputs from output.yaml,
    // which defines the dataItems for the model.
    // outputs is an array, with each element like
    //   { key: 'connection', category: 'EVENT', type: 'AVAILABILITY', value: ... }
    const outputPath = `models/${model}/outputs.yaml`
    const outputs = loadYamlTree(outputPath).outputs

    // get dataItems dict - maps from key to dataItem object.
    const dataItems = {}
    for (const output of outputs) {
      const key = output.key
      let dataItem = { ...output }
      dataItem.id = id + '-' + key
      //. print warning
      if (!dataItem.type) dataItem.type = 'UNKNOWN' // else agent dies
      delete dataItem.key
      delete dataItem.value
      dataItems[key] = dataItem
    }

    // define text transforms to perform on model.yaml
    properties.deviceId = id
    const transforms = Object.keys(properties).map(key => {
      const value = properties[key]
      return str => str.replaceAll('${' + key + '}', value) // replaceAll needs node15
    })

    // get model.yaml, making text substitutions with properties
    const modelPath = `models/${model}/model.yaml`
    const modelTree = loadYamlTree(modelPath, transforms).model

    // recurse down the model tree, replacing dataItems with their output defs.
    attachDataItems(modelTree, dataItems)

    //. report any dataItems not used

    // convert model to xml and add to list
    const xmltree = translate(modelTree)
    xmldevices.push(xmltree)
  }
  // attach devices to tree
  xmltree.MTConnectDevices[0].Devices.Device = xmldevices
}

/**
 * attach dataItems from outputs.yaml to model.yaml tree recursively.
 * @param {object} node - the xml node to attach to
 * @param {object} dataItems - dict of dataItem objects
 */
function attachDataItems(node, dataItems) {
  // if node is an array, recurse down each element
  if (Array.isArray(node)) {
    for (const subnode of node) {
      attachDataItems(subnode, dataItems)
    }
    // else if node is an object, recurse down values
  } else if (node !== null && typeof node === 'object') {
    // iterate over dict values
    for (const key of Object.keys(node)) {
      // if dataItems, replace each element with its corresponding dataItem obj
      if (key === 'dataItems') {
        const keys = node.dataItems.dataItem
        for (let i = 0; i < keys.length; i++) {
          const dataItem = dataItems[keys[i]]
          if (dataItem) {
            keys[i] = dataItem
          } else {
            console.log(`warning: unknown dataItem in model.yaml: ${keys[i]}`)
            keys[i] = { id: keys[i], type: 'UNKNOWN', category: 'UNKNOWN' }
          }
        }
      } else {
        const subnode = node[key]
        attachDataItems(subnode, dataItems)
      }
    }
  }
}

/**
 * translate yaml tree to xml tree recursively
 */
function translate(node) {
  if (Array.isArray(node)) {
    return node.map(el => translate(el))
  } else if (node !== null && typeof node === 'object') {
    const obj = {}
    const attributes = {}
    const elements = {}
    for (const key of Object.keys(node)) {
      const el = node[key]
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
function loadYamlTree(path, transforms = []) {
  let yaml = fs.readFileSync(path, 'utf8')
  for (const transform of transforms) {
    yaml = transform(yaml)
  }
  const yamltree = libyaml.load(yaml) // parse yaml
  return yamltree
}

/**
 * convert xml structure to xml string and save to a file.
 */
function saveXmlTree(xmltree, destfile) {
  const xml = libxml.js2xml(xmltree, { compact: true, spaces: 2 })
  fs.writeFileSync(destfile, xml)
}

/**
 * print an object with unlimited depth
 */
function dir(obj) {
  console.dir(obj, { depth: null })
}
