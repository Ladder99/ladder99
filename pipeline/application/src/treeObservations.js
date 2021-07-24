//. put this in a different file? dataObservations.js?

// get flat list of objects from given json tree
export function getObservationObjects(json) {
  const objs = []
  recurseObservations(json, objs)
  return objs
}

const appendTags2 = getSet('Angle')
const skipTags2 = getSet('')

// traverse a tree of elements, adding them to an array
//. refactor, add comments
//. handle parents differently - do in separate pass?
function recurseObservations(el, objs, tag = '', parents = []) {
  // el can be an object, an array, or an atomic value

  // handle object with keyvalue pairs
  if (libapp.isObject(el)) {
    // start object, which is a translation of the json element to something usable.
    // tag is eg 'DataItem', parents is list of ancestors - will be deleted before return.
    let obj = { tag, parents }

    // add obj to return list if one of certain tags (eg DataItem)
    // if (appendTags2.has(tag)) objs.push(obj)

    // get keyvalue pairs, skipping unwanted tags
    const pairs = Object.entries(el).filter(([key]) => !skipTags2.has(key))

    // iterate over keyvalue pairs
    // eg key='_attributes', value={ id: 'd1', name: 'M12346', uuid: 'M80104K162N' }
    for (const [key, value] of pairs) {
      const handler = elementHandlers[key] || ignore // get keyvalue handler
      handler(obj, value) // adds value data to obj
      const newparents = [...parents, obj] // push obj onto parents path list
      recurseObservations(value, objs, key, newparents) // recurse
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

    if (obj.dataItemId) objs.push(obj)

    // get rid of the parents list
    delete obj.parents
    //
  } else if (Array.isArray(el)) {
    // handle array of subelements
    for (const subel of el) {
      recurseObservations(subel, objs, tag, parents) // recurse
    }
  } else {
    // ignore atomic values
    // console.log('>>what is this?', { el })
  }
}
