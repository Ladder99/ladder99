import * as domain from './domain.js'
import tree from '../example-current.js'

domain.traverse(tree, dataItems => console.log(dataItems[0]))
