// graph
// timegraph class - nodes, edges, history

export class Graph {
  constructor() {
    this.nodes = new Nodes(this)
    this.edges = new Edges(this)
    // this.history = new History(this)
    this.nextId = 1
  }
  getNextId() {
    this.nextId++
    return this.nextId
  }
  //. read graph from a timegraph db
  static async read(db) {
    const graph = new Graph()
    // get nodes
    const sql = `SELECT * FROM nodes;`
    const res = await db.query(sql)
    const nodes = res.rows // [{ _id, props }]
    for (const node of nodes) {
      graph.nodes.add(node)
    }
    //. get edges

    return graph
  }
  //. write nodes and edges to a timegraph db
  //. assume it's sql?
  async write(db) {
    //. do we need to iterate over nodes one by one and see what needs update/add/delete? uhhh
  }
}

class Nodes {
  constructor(graph) {
    this.graph = graph
    this.nodes = {}
  }
  //. crud - add, get, update, delete
  add(node) {
    if (node._id) {
    } else {
      // node._id = 1 //. uhhhh
      node._id = this.graph.getNextId()
    }
    this.nodes[node._id] = node
    return node
  }
}

class Edges {
  constructor(graph) {
    this.graph = graph
    this.edges = {}
    this.reverse = {}
  }
  //. crud - add, get, update, delete
  add(edge) {
    if (!this.edges[edge._from]) {
      this.edges[edge._from] = []
    }
    this.edges[edge._from].push(edge)
    if (!this.reverse[edge._to]) {
      this.reverse[edge._to] = []
    }
    this.reverse[edge._to].push(edge)
    return edge
  }
}

class History {}
