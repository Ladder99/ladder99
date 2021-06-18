export class Graph {
  constructor() {
    this.nodes = new Nodes()
    this.edges = new Edges()
  }
  addNodes(nodes) {
    this.nodes.add(nodes)
  }
  addEdges(edges) {
    this.edges.add(edges)
  }
}

class Nodes {
  constructor() {
    this.nodes = []
    this.index = {}
  }
  //. crud - get, add, update, delete
  add(nodes) {
    this.nodes.push(...nodes)
    //. add to index
  }
}

class Edges {
  constructor() {
    this.edges = []
    this.index = {}
  }
  add(edges) {
    this.edges.push(...edges)
    //. add both dirs to indexes
  }
}
