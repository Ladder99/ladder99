import * as domain from './domain.js'
import tree from '../example-sample.js'

domain.traverse(tree, console.log)
// domain.traverse(tree, dataItems => console.log(dataItems[0]))
