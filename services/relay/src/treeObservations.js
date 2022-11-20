// helper fns for dataObservations.js
//. move into that file

import * as lib from './common/lib.js'

// const skipTags = lib.getSet('')

// get flat list of elements from given js tree
// returns eg [{
//   tag: 'Availability',
//   dataItemId: 'm1-avail',
//   name: 'availability',
//   sequence: '30',
//   timestamp: '2021-09-14T17:53:21.414Z',
//   value: 'AVAILABLE'
// }, ...]
export function getNodes(jsTree, agent) {
  const nodes = []
  recurse(jsTree, nodes)
  for (let el of nodes) {
    el.uid = agent.alias + '/' + el.dataItemId // eg 'main/avail'
  }
  // console.log(nodes)
  // process.exit(0)
  return nodes
}

const ignore = () => {}
const elementHandlers = {
  // handle attributes, eg { id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
  _: (obj, value) => Object.keys(value).forEach(key => (obj[key] = value[key])),
  // handle text/value, eg value = 'Mill w/Smooth-G'
  $: (obj, value) => (obj.value = value),
}

// traverse a tree of elements, adding them to an array
//. refactor, add comments
//. handle parents differently - do in separate pass?
// element can be an object, an array, or an atomic value
function recurse(element, elements, tag = '', parents = []) {
  //
  // handle object with keyvalue pairs
  if (lib.isObject(element)) {
    //
    // start object, which is a translation of the json element to something usable.
    // tag is eg 'DataItem', parents is list of ancestors - will be deleted before return.
    let obj = { tag, parents }

    // get keyvalue pairs, skipping unwanted tags
    // const pairs = Object.entries(element).filter(([key]) => !skipTags.has(key))
    const pairs = Object.entries(element)

    // iterate over keyvalue pairs
    // eg key='_', value={ id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
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

// assign device node_id and dataitem node_id to observation objects
export function assignNodeIds(observations, indexes) {
  for (let obs of observations) {
    const node = indexes.nodeByUid[obs.uid]
    if (node) {
      // note: these had been tacked onto the node objects during index creation.
      obs.device_id = node.device_id
      obs.dataitem_id = node.dataitem_id
    } else {
      // don't print if it starts with an underscore - those are (usually) uninteresting
      // agent dataitems like '_7546f731da_observation_update_rate', and they
      // fill up the logs.
      if (!obs.dataItemId.startsWith('_')) {
        console.log(
          `Relay warning: nodeByUid index missing dataItem ${obs.uid}`
        )
      }
    }
  }
}
