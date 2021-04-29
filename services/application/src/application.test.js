import * as domain from './domain.js'
import tree from '../example-current.js'

domain.traverse(tree, node => {
  // console.log(node)
  const types = Object.keys(node)
  types.forEach(type => {
    const dataItem = node[type]
    const id = dataItem['@dataItemId']
    const sequence = dataItem['@sequence']
    const timestamp = dataItem['@timestamp']
    const value = dataItem.Value
    console.log(id, value)
  })
})
