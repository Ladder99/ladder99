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

//   // console.log(itemKey, subitemDict)
//   if (Array.isArray(subitemDict)) {
//     // eg fsSize is an array

// // get total disk space as { size, used, use }

// // . a single fn could check for existence of overlay key, use that or a sum reduction.
// // . could store the fn in the inputs.yaml, or just use a fn name like 'sum' or 'overlay'.

// console.log('Host fsSize', data.fsSize)
// console.log(data.fsSize.map(d => d.fs))
// // data.fsSize is sthing like this - reduce to single object - or just use drvfs?
// // windows:
// // [
// //   { fs: 'overlay', size: 269490393088, used: 26778972160, use: 10.47 },
// //   { fs: 'drvfs', size: 489472126976, used: 420276023296, use: 85.86 },
// //   { fs: '/dev/sdc', size: 269490393088, used: 26778972160, use: 10.47 }
// // ]
// // linux: pi just has overlay

// // const disk = data.fsSize.reduce(
// //   (acc, fs) => {
// //     acc.size += fs.size
// //     acc.used += fs.used
// //     acc.available += fs.available
// //     return acc
// //   },
// //   { size: 0, used: 0, available: 0 }
// // )
// // disk.use = (disk.used / (disk.size || 1)) * 100
// // const disk = data.fsSize?.find(o => o.fs === 'drvfs') || {}
// const disk = data.fsSize?.find(o => o.fs === 'overlay') || {}
