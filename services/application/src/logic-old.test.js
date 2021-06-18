import * as logic from './logic.js'
// import json from '../examples/ccs-pa/current.js'
// import json from '../examples/ccs-pa/sample.js'
import json from '../examples/vmc/probe.js'

// logic.traverse(json, console.log)

// logic.traverse(json, dataItems => console.log(dataItems[0]))

logic.traverse(json, dataItems => {
  if (dataItems[0].type === 'Execution') {
    console.log(dataItems[0])
  }
})
