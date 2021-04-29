import * as domain from './domain.js'
import tree from '../example-current.js'

domain.traverse(tree, (group, node) => {
  const types = Object.keys(node)
  types.forEach(type => {
    const data = node[type]
    const id = data['@dataItemId']
    const sequence = data['@sequence']
    const timestamp = data['@timestamp']
    const value = data.Value
    const dataItem = {
      group,
      type,
      id,
      sequence,
      timestamp,
      value,
    }
    console.log(dataItem)
  })
})
