export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isObject(node) {
  return node !== null && typeof node === 'object'
}

export function print(...obj) {
  console.dir(...obj, { depth: null })
}
