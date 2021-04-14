// // build up dependsOn array during parse from what cache keys are seen
// const dependsOn = []
// // m will be undefined if no match, or array with elements 1,2,3 with contents
// //. handle multiple <>'s in a string also - how do? .* needs to be greedy for one thing
// //. also check if str is multiline - then need to wrap in braces?
// const regexp = /(.*)<(.*)>(.*)/
// const m = (template.value || '').match(regexp)
// let value = cache => template.value // by default just return string value
// // got match
// if (m) {
//   const str = m[1] + `cache.get('${deviceId}-${m[2]}').value` + m[3]
//   value = cache => eval(str) // evaluate the cache access string
//   //. assume each starts with deviceId?
//   const dependency = `${deviceId}-${m[2]}`
//   dependsOn.push(dependency)
// }
