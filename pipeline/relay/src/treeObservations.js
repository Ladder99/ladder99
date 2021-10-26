// helper fns for dataObservations.js

import * as lib from './lib.js'

//.
// const appendTags2 = lib.getSet('Angle')

//.
const skipTags2 = lib.getSet('')

// get flat list of elements from given json tree
// eg [{
//   tag: 'Availability',
//   dataItemId: 'm1-avail',
//   name: 'availability',
//   sequence: '30',
//   timestamp: '2021-09-14T17:53:21.414Z',
//   value: 'AVAILABLE'
// }, ...]
export function getElements(json) {
  const elements = []
  recurse(json, elements)
  return elements
}

//. copypasted from treeProbe.js - fix
const ignore = () => {}
const elementHandlers = {
  // handle attributes, eg { id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
  _attributes: (obj, value) =>
    Object.keys(value).forEach(key => (obj[key] = value[key])),
  // handle text/value, eg value = 'Mill w/Smooth-G'
  _text: (obj, value) => (obj.value = value),
}

// traverse a tree of elements, adding them to an array
//. refactor, add comments
//. handle parents differently - do in separate pass?
// element can be an object, an array, or an atomic value
function recurse(element, elements, tag = '', parents = []) {
  // handle object with keyvalue pairs
  if (lib.isObject(element)) {
    // start object, which is a translation of the json element to something usable.
    // tag is eg 'DataItem', parents is list of ancestors - will be deleted before return.
    let obj = { tag, parents }

    // add obj to return list if one of certain tags (eg DataItem)
    // if (appendTags2.has(tag)) elements.push(obj)

    // get keyvalue pairs, skipping unwanted tags
    const pairs = Object.entries(element).filter(([key]) => !skipTags2.has(key))

    // iterate over keyvalue pairs
    // eg key='_attributes', value={ id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
    for (const [key, value] of pairs) {
      const handler = elementHandlers[key] || ignore // get keyvalue handler
      handler(obj, value) // adds value data to obj
      const newparents = [...parents, obj] // push obj onto parents path list
      recurse(value, elements, key, newparents) // recurse
    }

    // // get device and signature for dataitems
    // // eg 'Device(a234)' and 'DataItem(event,availability)'
    // if (tag === 'DataItem') {
    //   obj.device = getPathStep(obj.parents[3])
    //   obj.signature = [...obj.parents.slice(4), obj]
    //     .map(getPathStep)
    //     .filter(step => !!step)
    //     .join('/')
    // }

    if (obj.dataItemId) elements.push(obj)

    // get rid of the parents list
    delete obj.parents
    //
  } else if (Array.isArray(element)) {
    // handle array of subelements
    for (const subel of element) {
      recurse(subel, elements, tag, parents) // recurse
    }
  } else {
    // ignore atomic values
    // console.log('>>what is this?', { element })
  }
}
