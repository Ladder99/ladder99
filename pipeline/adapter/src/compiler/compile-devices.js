// translate setup.yaml to devices.xml

// note: we use 'yaml' and 'xml' for the strings,
// 'yamltree' and 'xmltree' for the corresponding js structures.

import fs from 'fs' // node lib filesys
import libyaml from 'js-yaml' // https://github.com/nodeca/js-yaml
import libxml from 'xml-js' // https://github.com/nashwaan/xml-js
import xmltree from './xmltree.js' // base xml structure
import sets from './sets.js' // vocabulary

const yamlfile = process.argv[2] // eg 'setups/demo/setup.yaml'
const xmlfile = process.argv[3] // eg 'setups/demo/volumes/agent/devices.xml'

// main
const devices = loadYamlTree(yamlfile).setup.devices // array of objs
attachDevices(xmltree, devices)
saveXmlTree(xmltree, xmlfile)

/**
 * attach devices from setup.yaml to xml tree
 * @param {object} xmltree
 * @param {array} devices
 */
function attachDevices(xmltree, devices) {
  const xmldevices = []

  // iterate over device definitions
  for (const device of devices) {
    const { id: deviceId, model, properties, sources } = device

    // get dataItems map - maps from key to dataItem object
    const dataItemsMap = getDataItemsMap(sources, deviceId)

    // get model.yaml, making text substitutions with properties
    const transforms = getTransforms(properties, deviceId)
    const modelPath = `models/${model}/model.yaml`
    const modelTree = loadYamlTree(modelPath, transforms).model

    // recurse down the model tree, replacing dataItems with their output defs.
    attachDataItems(modelTree, dataItemsMap)

    // report any dataItems not used
    const unused = Object.values(dataItemsMap).filter(item => !item.used)
    if (unused.length > 0) {
      const unusedStr = unused.map(item => "'" + item.id + "'").join(', ')
      console.log(`warning: unused dataItems ${unusedStr}`)
    }

    // convert model to xml and add to list
    const xmltree = translateYamlToXml(modelTree)
    xmldevices.push(xmltree)
  }

  // attach array of devices to tree
  xmltree.MTConnectDevices[0].Devices.Device = xmldevices
}

/**
 * get text transforms to substitute properties into a string.
 * eg '${deviceId}' => 'ccs-pa-001'
 */
function getTransforms(properties, deviceId) {
  properties.deviceId = deviceId
  const transforms = Object.keys(properties).map(key => {
    const value = properties[key]
    // return str => str.replaceAll('${' + key + '}', value) // replaceAll needs node15
    const regexp = new RegExp('\\${' + key + '}', 'g')
    return str => str.replace(regexp, value)
  })
  return transforms
}

/**
 * get map from keys to dataItems
 * @param {array} sources
 * @param {string} deviceId
 * @returns {object} map from key to dataItem object
 */
function getDataItemsMap(sources, deviceId) {
  const dataItemsMap = {}
  for (const source of sources) {
    const { model } = source

    // get array of outputs from output.yaml, which defines dataItems for model.
    // each output is like -
    //   { key: 'connection', category: 'EVENT', type: 'AVAILABILITY', value: ... }
    const outputPath = `models/${model}/outputs.yaml`
    const outputs = loadYamlTree(outputPath).outputs

    // iterate over outputs, getting dataItems for each, adding to map
    for (const output of outputs) {
      const key = output.key
      const id = deviceId + '-' + key
      let dataItem = { id, ...output } // copy the dataItem, put id first
      if (!dataItem.type) {
        console.log(
          `warning: type not specified for output '${key}' - setting to UNKNOWN`
        )
        dataItem.type = 'UNKNOWN' // else agent dies
      }
      // remove unneeded props from the dataItem copy
      delete dataItem.key
      delete dataItem.value
      // save to map
      dataItemsMap[key] = dataItem
    }
  }
  return dataItemsMap
}

/**
 * attach dataItems from outputs.yaml to model.yaml tree recursively.
 * @param {object} node - the xml node to attach to
 * @param {object} dataItemsMap - map from key to dataItem object
 */
function attachDataItems(node, dataItemsMap) {
  // if node is an array, recurse down each element
  if (Array.isArray(node)) {
    for (const subnode of node) {
      attachDataItems(subnode, dataItemsMap) // recurse
    }
    // else if node is an object, recurse down values
  } else if (node !== null && typeof node === 'object') {
    // iterate over dict values
    for (const key of Object.keys(node)) {
      // if dataItems, replace each element with its corresponding dataItem obj
      if (key === 'dataItems') {
        const keys = node.dataItems.dataItem
        for (let i = 0; i < keys.length; i++) {
          const dataItem = dataItemsMap[keys[i]]
          if (dataItem) {
            keys[i] = dataItem
            dataItem.used = true
          } else {
            console.log(`warning: unknown dataItem '${keys[i]}' in model.yaml`)
            keys[i] = { id: keys[i], type: 'UNKNOWN', category: 'UNKNOWN' }
          }
        }
      } else {
        const subnode = node[key]
        attachDataItems(subnode, dataItemsMap) // recurse
      }
    }
  }
}

/**
 * translate yaml tree to xml tree recursively
 * @param {object} node - a yaml tree node
 * @returns {object} xml tree
 */
function translateYamlToXml(node) {
  if (Array.isArray(node)) {
    return node.map(el => translateYamlToXml(el)) // recurse
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
        const element = translateYamlToXml(el) // recurse
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
 * import a yaml file, apply any transforms, parse it, and return as a js structure.
 * @param yamlfile {string} file path
 * @returns {object} yaml tree
 */
function loadYamlTree(yamlfile, transforms = []) {
  let yaml = fs.readFileSync(yamlfile, 'utf8')
  for (const transform of transforms) {
    yaml = transform(yaml)
  }
  const yamltree = libyaml.load(yaml) // parse yaml
  return yamltree
}

/**
 * convert xml structure to xml string and save to a file.
 * @param {object} xmltree - js structure
 * @param {string} xmlfile - file path
 */
function saveXmlTree(xmltree, xmlfile) {
  const xml = libxml.js2xml(xmltree, { compact: true, spaces: 2 })
  fs.writeFileSync(xmlfile, xml)
}

/**
 * print an object with unlimited depth
 */
function dir(obj) {
  console.dir(obj, { depth: null })
}
