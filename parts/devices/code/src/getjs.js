// build js from code entries in the yaml trees

function main(ytrees) {
  for (const { sourcefile, ytree } of ytrees) {
    // console.log(ytree)
    // console.dir(ytree, { depth: null })
    const arr = getCode(ytree)
    console.dir(arr, { depth: null })
    // const s = flatten(arr).join('')
  }
  return true
}

// find all code entries and extract as string
function getCode(ytree) {
  if (Array.isArray(ytree)) {
    return ytree.map(el => getCode(el))
  } else if (typeof ytree === 'object') {
    const elements = []
    const keys = Object.keys(ytree)
    for (const key of keys) {
      const el = ytree[key]
      if (key === 'javascript') {
        elements.push({ key, el })
      } else {
        const element = getCode(el)
        elements.push(element)
      }
    }
    return elements
  } else {
    return ytree
  }
}

main()
