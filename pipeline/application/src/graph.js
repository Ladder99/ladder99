// graph
// generic timegraph class - nodes, edges, history

import * as libapp from './libapp.js'

export class Graph {
  constructor() {
    this.nodes = new Nodes(this)
    this.edges = new Edges(this)
    this.history = new History(this)
  }

  // NOTE: we don't implement addNode etc as would lead to too many
  // pass-through methods - just say graph.nodes.add() etc

  // read graph from a timegraph db
  //. ditch the sql - do simple translation? or use knex js?
  async read(db) {
    // nodes
    let sql = `SELECT * FROM nodes;`
    let result = await db.query(sql)
    const nodes = result.rows // [{ node_id, props }]
    for (const node of nodes) {
      this.nodes.add(node)
    }
    // edges
    sql = `SELECT * from edges;`
    result = await db.query(sql)
    const edges = result.rows // [{from_id, to_id, props}]
    for (const edge of edges) {
      this.edges.add(edge)
    }
    // history - don't need
  }

  //. synchronize nodes and edges to a timegraph db
  // assume the db is sql
  async synchTo(db) {
    // read graph from db to compare and write to
    const graphDb = new Graph()
    await graphDb.read(db)
    //. iterate over nodes one by one and see what needs update/add/delete
    //. maybe get list of nodes and edges to add/update/delete, then sort them,
    // then execute them?
    //. for now, get list of nodes to write
    const actions = { add: [], update: [], delete: [] }
    const nodes = this.nodes.get() // gets all
    if (nodes) {
      for (const node of nodes) {
        if (!graphDb.nodes.has(node)) {
          actions.add.push(node)
        }
      }
    }
    //. sort nodes and edges topologically/depth first? oy
    //. execute actions
    // db.execute(actions)
    console.log(actions)
  }
}

//. split this into graph, graphNodes, graphEdges, graphHistory.js files?

class Nodes {
  constructor(graph) {
    this.nodes = []
    this.indexByNodeId = {}
    this.indexByProps = {}
    this.indexByProps.id = {}
  }

  //. crud - add, get, update, delete

  // add node and return with any updated info (eg node_id)
  add(node) {
    // if (node._id) {
    // } else {
    //   node._id = 1 //. uhhhh
    //   // node._id = this.graph.getNextId()
    // }
    // this.nodes[node._id] = node
    this.nodes.push(node)
    //. add to index also
    if (node.props.id) {
      this.indexByProps.id[node.props.id] = node
    }
    return node
  }

  get(spec) {
    if (spec) {
      if (libapp.isObject(spec)) {
        //. find node equal to spec
        //. need index, but on what? hash the props object?
        for (const node of this.nodes) {
          if (libapp.shallowCompare(spec.props, node.props)) {
            return node
          }
        }
      } else {
        const id = spec
        const node = this.indexByProps.id[id]
        return node
      }
      return null
    }
    return this.nodes
  }

  //. extra methods - merge into crud?

  // has is useful as it doesn't return all the data
  has(spec) {
    return this.get(spec) !== null
  }
}

//

class Edges {
  constructor(graph) {
    // this.graph = graph
    // this.edges = {}
    // this.reverse = {}
    this.edges = []
  }
  //. crud - add, get, update, delete
  // add edge and return with any updated info
  // edge is { from, to } //. ?
  add(edge) {
    // if (!this.edges[edge._from]) {
    //   this.edges[edge._from] = []
    // }
    // this.edges[edge._from].push(edge)
    // if (!this.reverse[edge._to]) {
    //   this.reverse[edge._to] = []
    // }
    // this.reverse[edge._to].push(edge)
    this.edges.push(edge)
    return edge
  }
}

class History {
  constructor(graph) {
    // this.graph = graph
  }
}
