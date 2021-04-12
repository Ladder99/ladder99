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
  // const devices = []
  const yamltree = importYaml(sourcefile)
  dir({ yamltree })
  // @ts-ignore
  const devices = yamltree.devices
  for (const device of devices) {
    const { id, model, properties, sources, destinations } = device
    const devicePath = `models/${model}/device.yaml`
    properties.deviceId = id
    const transforms = Object.keys(properties).map(key => {
      const value = properties[key]
      return str => str.replaceAll('${' + key + '}', value)
    })
    dir({ transforms })
    const deviceTree = importYaml(devicePath, transforms)
    dir({ deviceTree })
    for (const source of sources) {
      const { model, protocol, url } = source
      const outputsPath = `models/${model}/outputs.yaml`
      const outputsTree = importYaml(outputsPath)
      // dir({ outputsTree })
    }
  }
  // for (const sourcefile of sourcefiles) {
  //   const xmltree = translate(yamltree) // recurses
  //   const device = xmltree.Device[0]
  //   devices.push(device)
  // }
  return devices
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
