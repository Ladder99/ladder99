import * as domain from './domain.js'
import tree from '../example-current.js'

domain.traverse(tree, node => {
  console.log(node)
})
