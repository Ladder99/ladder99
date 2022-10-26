// this library causes highcpu on windows - 2022-02
// seems to be fixed, or at least works when run from git bash - 2022-09-26.
// see https://github.com/sebhildebrandt/systeminformation/issues/626

// this.setValue('temp', lib.round(data.cpuTemperature.main, 1))
// this.setValue('cputot', lib.round(data.currentLoad.currentLoad, 1))
// this.setValue('cpuuser', lib.round(data.currentLoad.currentLoadUser, 1))
// this.setValue(
//   'cpusys',
//   lib.round(data.currentLoad.currentLoadSystem, 1)
// )
// this.setValue('memtot', lib.round(data.mem.total, -6))
// this.setValue('memfree', lib.round(data.mem.free, -6))
// this.setValue('memused', lib.round(data.mem.used, -6))
// this.setValue('disksize', disk.size) // bytes
// this.setValue('diskused', lib.round(disk.used, -6)) // bytes round to mb
// this.setValue('diskuse', lib.round(disk.use, 0)) // percent
// this.setValue('diskavail', lib.round(disk.available, -6)) // bytes round to mb
// this.setValue('os', getDataSet(data.osInfo))
// //

//

// // get total disk space as { size, used, use }

//   // console.log(itemKey, subitemDict)
//   if (Array.isArray(subitemDict)) {
//     // eg fsSize is an array

//

// // . a single fn could check for existence of overlay key, use that or a sum reduction.
// // . could store the fn in the inputs.yaml, or just use a fn name like 'sum' or 'overlay'.

// console.log('Host fsSize', data.fsSize)

// data.fsSize is sthing like this - reduce to single object - or just use drvfs?
// windows:
// [
//   { fs: 'overlay', size: 269490393088, used: 26778972160, use: 10.47 },
//   { fs: 'drvfs', size: 489472126976, used: 420276023296, use: 85.86 },
//   { fs: '/dev/sdc', size: 269490393088, used: 26778972160, use: 10.47 }
// ]
// linux:
// [
//   { fs: 'overlay', size: 269490393088, used: 26778972160, use: 10.47 },
// ]

// const disk = data.fsSize.reduce(
//   (acc, fs) => {
//     acc.size += fs.size
//     acc.used += fs.used
//     acc.available += fs.available
//     return acc
//   },
//   { size: 0, used: 0, available: 0 }
// )
// disk.use = (disk.used / (disk.size || 1)) * 100
// const disk = data.fsSize?.find(o => o.fs === 'drvfs') || {}
// const disk = data.fsSize?.find(o => o.fs === 'overlay') || {}

// // build up a systeminformation query from inputs.yaml, like
// // {
// //   cpuTemperature: 'main',
// //   currentLoad: 'currentLoad, currentLoadUser, currentLoadSystem',
// //   mem: 'total, free, used',
// //   fsSize: 'fs, size, used, available', // gives an array
// //   osInfo: 'platform, distro, release, codename, arch, hostname',
// // }
// this.query = {}
// Object.keys(this.inputs).forEach(item => {
//   this.query[item] = Object.keys(this.inputs[item]).join(',')
// })
// console.log('Host query', this.query)

// this.poll() // first poll
// setInterval(this.poll.bind(this), pollInterval)

// // iterate over query inputs, extract info from data, write to cache
// // eg this.setValue('temp', lib.round(data.cpuTemperature.main, 1))
// // eg itemKey = 'cpuTemperature', subitemDict = {main: { name, decimals }}
// // fsSize returns an array though - see https://systeminformation.io/filesystem.html
// for (let [itemKey, subitemDict] of Object.entries(this.inputs)) {
//   // console.log(itemKey, subitemDict)
//   // subitemKey is eg 'main'
//   for (let subitemKey of Object.keys(subitemDict)) {
//     // subitem is like { name, decimals }
//     const subitem = subitemDict[subitemKey]
//     const value = data[itemKey][subitemKey] // pick value out of query response - won't work for fsSize
//     // const itemData = data[itemKey]
//     // let value
//     // // check if array, eg for fsSize
//     // if (Array.isArray(itemData)) {
//     //   //. pick out relevant drives and sum up values
//     //   //. depends on the os, which can get from process.platform = 'win32' | 'darwin' | 'linux' ...
//     //   //. but also need to calculate use%, so need size, used, available
//     //   // so better to hardcode most of this
//     // } else {
//     //   value = itemData[subitemKey]
//     // }
//     // console.log(subitemKey, subitem, value)
//     this.setValue(subitem.name, lib.round(value, subitem.decimals))
//   }
// }

// } catch (error) {
//   console.log(error.message)
//   // this.setUnavailable()
//   // this.setValue('avail', 'UNAVAILABLE')
//   // this.setValue('cond', 'FAULT')
// }

// // set all keys to unavailable
// setUnavailable() {
//   this.setValue('avail', 'UNAVAILABLE')
//   this.setValue('cond', 'UNAVAILABLE')
//   // for each input item, set each subitem.name to unavailable
//   Object.values(this.inputs).forEach(item => {
//     Object.values(item).forEach(subitem => {
//       this.setValue(subitem.name, 'UNAVAILABLE')
//     })
//   })
// }
