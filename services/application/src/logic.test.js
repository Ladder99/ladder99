import * as logic from './logic.js'
import tree from '../examples/example-current.js'
// import tree from '../example-sample.js'

// logic.traverse(tree, console.log)

// logic.traverse(tree, dataItems => console.log(dataItems[0]))

logic.traverse(tree, dataItems => {
  if (dataItems[0].type === 'Execution') {
    console.log(dataItems[0])
  }
})
