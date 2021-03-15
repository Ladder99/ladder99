//. this is experimental for development

export const handlers = {
  'l99/CCS123/evt/status': status,
  'l99/CCS123/evt/read': read,
}

function status() {}

function read() {}

export function getData(buffer) {
  let data = JSON.parse(buffer.toString())
  if (!Array.isArray(data)) {
    data = [data]
  }
  return data
}

// // get output transform for given topic
// export function getGetOutput(topic) {
//   return getOutput
// }

// // get output for given item and cache
// function getOutput(cache, item) {}

// export function getState(lookup) {
//   const topic = 'l99/ccs/evt/status'
//   const prop = 'state'
//   const names = {
//     50: 'WAIT',
//     100: 'WAIT',
//     200: 'PROGRAM_STOPPED',
//     250: 'WAIT',
//     300: 'WAIT',
//     400: 'ACTIVE',
//   }
//   return lookup(topic, prop, names)
// }
