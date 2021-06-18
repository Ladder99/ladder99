// timegraph class - nodes, edges, history

export class Graph {
  constructor() {
    this.nodes = new Nodes()
    this.edges = new Edges()
    // this.history = new History()
  }
  //. just use graph.nodes.add(node) - otherwise need crud ops
  // for all 3 * 4= 12 ops, and they're just pass-throughs.
  //. read graph from a timegraph db
  static async read(db) {}
  //. write nodes and edges to a timegraph db
  //. assume it's sql?
  async write(db) {
    //. do we need to iterate over nodes one by one and see what needs update/add/delete? uhhh
  }
}

class Nodes {
  constructor() {
    this.nodes = {}
  }
  //. crud - add, get, update, delete
  add(node) {
    if (node._id) {
    } else {
      node._id = 1
    }
    this.nodes[node._id] = node
    return node
  }
}

class Edges {
  constructor() {
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
