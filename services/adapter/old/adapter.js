// const outputPort = Number(process.env.OUTPUT_PORT || 7878)
// const outputHost = process.env.OUTPUT_HOST || 'localhost'

// // get shdr strings
// const output = getOutput(cache)
// // send shdr to agent via tcp socket
// console.log(`TCP sending string`, output.slice(0, 40), `...`)
// outputSocket.write(output)

// console.log(`Hit ctrl-c to stop adapter.`)
// process.on('SIGINT', shutdown)

// // get all shdr outputs for the cache values
// function getOutput(cache) {
//   const output = []
//   for (const calc of calcs) {
//     const timestamp = new Date().toISOString()
//     const key = calc.key
//     const value = calc.value(cache) // do calculation
//     const shdr = `${timestamp}|${key}|${value}`
//     console.log(shdr)
//     output.push(shdr)
//   }
//   return output.join('\n') + '\n'
// }

// // exit nicely
// function shutdown() {
//   console.log(`Exiting...`)
//   // if (outputSocket) {
//   //   console.log(`TCP closing socket...`)
//   //   outputSocket.end()
//   // }
//   // console.log(`Closing plugins`)
//   // for (const plugin of plugins) {
//   //   plugin.end()
//   // }
//   process.exit()
// }
