export class Graph {
  constructor() {
    this.nodes = new Nodes()
    this.edges = new Edges()
  }
  addNode(node) {
    return this.nodes.add(node)
  }
  addEdge(edge) {
    return this.edges.add(edge)
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
