// graph
// generic timegraph class - nodes, edges, history

// note: we don't implement addNode etc as would lead to too many
// pass-through methods - just say graph.nodes.add() etc
export class Graph {
  constructor() {
    this.nodes = new Nodes(this)
    this.edges = new Edges(this)
    this.history = new History(this)
    // this.nextId = 1 //. let db handle this
  }

  // getNextId() {
  //   this.nextId++
  //   return this.nextId
  // }

  // read graph from a timegraph db - STATIC fn
  static async read(db) {
    const graph = new Graph()
    // get nodes
    let sql = `SELECT * FROM nodes;`
    let res = await db.query(sql)
    const nodes = res.rows // [{ _id, props }]
    for (const node of nodes) {
      graph.nodes.add(node)
    }
    // get edges
    sql = `SELECT * from edges;`
    res = await db.query(sql)
    const edges = res.rows // [{_from, _to, props}]
    for (const edge of edges) {
      graph.edges.add(edge)
    }
    // but don't do history - don't need. too much anyway.
    return graph
  }

  //. write nodes and edges to a timegraph db
  //. assume it's sql?
  async write(db) {
    //. do we need to iterate over nodes one by one and see
    // what needs update/add/delete?
  }
}

//

class Nodes {
  constructor(graph) {
    // this.graph = graph
    // this.nodes = {}
    this.nodes = []
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
    return node
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
