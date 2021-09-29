// find all message address refs in the given code
// eg getReferences(`msg('foo') + <bar>`, regexp1, regexp2)
// returns {
//   code: `$['foo'] + <bar>`
//   refs: new Set(['foo'])
// }
// export function getReferences(code, regexFind, subst, regexReplace) {
export function getReferences(code, regexs) {
  // for regexp1 and 2, replace all occurrences of msg('foo') with $['foo'].
  // for regexp3 and 4, replace all occurrences of <foo> with cache.get('pr1-foo').
  // note: .*? is a non-greedy match, so doesn't eat other occurrences also.
  // replaceAll works but needs node15
  code = code.replace(regexs.find1, regexs.subst)
  // if (code.includes('\n')) {
  //   code = '{\n' + code + '\n}'
  // }
  // get list of message addrs this calculation references.
  // get AFTER transforms, because user could specify this manually.
  const refs = new Set()
  let match
  while ((match = regexs.find2.exec(code)) !== null) {
    const key = match[1]
    refs.add(key)
  }
  return { code, refs }
}
