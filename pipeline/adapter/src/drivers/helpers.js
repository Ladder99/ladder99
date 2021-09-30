const getMacros = prefix => ({
  // replace all occurrences of msg('foo') with $['foo'].
  addr: {
    syntax: /msg\('(.*?)'\)/gm, // eg msg('foo')
    transform: `$['$1']`, // $1 is the matched substring
    extract: /\$\['(.*?)'\]/gm, // eg $['foo']
  },
  // replace all occurrences of <foo> with cache.get('pr1-foo').
  cache: {
    syntax: /(<(.*?)>)/gm, // eg <foo>
    transform: `cache.get('${prefix}$2')`, // $2 is the matched substring
    extract: /cache\.get\('(.*?)'\)/gm, // eg cache.get('foo')
  },
})

// find all references in the given code
// eg precompile(`msg('foo') + <bar>`, macros)
// returns {
//   code: `$['foo'] + <bar>`,
//   refs: new Set(['foo']),
// }
export function precompile(code, macros) {
  // note: .*? is a non-greedy match, so doesn't eat other occurrences also.
  // note: replaceAll needs node15
  let js = code.replace(macros.syntax, macros.transform)
  //. better to make user add any braces
  // if (js.includes('\n')) {
  //   js = '{\n' + js + '\n}'
  // }

  // get list of message addrs or cache keys the code references.
  // need to get AFTER transforms, because user could specify this manually also.
  const refs = new Set()
  let match
  while ((match = macros.extract.exec(js)) !== null) {
    const key = match[1]
    refs.add(key)
  }
  return { js, refs }
}

export function compile(code, prefix) {
  const macros = getMacros(prefix)
  const res = precompile(code, macros)
  return res
}
