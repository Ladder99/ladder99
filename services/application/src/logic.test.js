import * as logic from './logic.js'
// import tree from '../examples/ccs-pa/current.js'
import tree from '../examples/ccs-pa/sample.js'

// logic.traverse(tree, console.log)

// logic.traverse(tree, dataItems => console.log(dataItems[0]))

logic.traverse(tree, dataItems => {
  if (dataItems[0].type === 'Execution') {
    console.log(dataItems[0])
  }
})
