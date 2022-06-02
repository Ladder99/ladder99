//. see here for an implementation, via will sobel -
// need to handle chunks weirdly
// https://github.com/mtconnect/ros_bridge/blob/master/mtconnect/mtconnect_ros_bridge/scripts/src/long_pull.py

import fetch from 'node-fetch'

console.log('hello')

async function foo() {
  // const response = await fetch('https://httpbin.org/stream/3')
  const response = await fetch(
    'http://mtconnect.mazakcorp.com:5717/sample?interval=1000'
  )
  try {
    const boundary =
      '--' + getHeaderSubvalue(response.headers, 'content-type', 'boundary')

    for await (const chunk of response.body) {
      const s = chunk.toString()
      console.log(s)
      const i = s.indexOf(boundary)
      if (i !== -1) {
        // boundary marker found
        // console.log(s.slice(boundary.length))
        // if (j === -1) {
        // } else {
        //   const t = s.slice(j + 4)
        //   console.log(t.slice(60))
        //   console.log()
        // }
      } else {
        console.log('.')
      }
    }
  } catch (err) {
    console.error(err.stack)
  }
}

foo()

function getHeaderSubvalue(headers, name, subname) {
  const type = headers.get(name)
  const subdelim = ';' + subname + '='
  const i = type.indexOf(subdelim)
  const subvalue = type.slice(i + subdelim.length)
  return subvalue
}
