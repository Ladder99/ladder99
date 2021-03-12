// // get devices from yaml files
// function getDevices(sourcefiles) {
//   const devices = []

//     // walk yaml tree and translate elements to xml tree recursively
//     const xtree = translate(ytree)

//     // extract the device and add to list
//     const xdevice = xtree.Device[0]
//     devices.push(xdevice)
//   }
//   return devices
// }

function main(ytrees) {
  // try {
  //   // // get devices and attach to xml tree
  //   // const devices = getDevices(sourcefiles)
  //   // xdoc.MTConnectDevices[0].Devices.Device = devices

  //   // // convert xml tree to string and output
  //   // const xstr = convert.js2xml(xdoc, { compact: true, spaces: 2 })
  //   // console.log(xstr)
  //   return 0
  // } catch (e) {
  //   console.error(e)
  //   return 1
  // }
  return 1
}

module.exports = main
