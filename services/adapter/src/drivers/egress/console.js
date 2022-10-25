// console egress driver
// writes to js console

export class Transform {
  constructor(source, sink) {
    this.source = source
    this.sink = sink
  }
  start() {
    this.source.on('data', data => {
      this.sink.write(data)
    })
  }
}
