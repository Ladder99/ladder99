window.onload = function () {
  document.getElementById('pathText').value = getParameterByName('path')
  document.getElementById('fromText').value = getParameterByName('from')
  document.getElementById('countText').value = getParameterByName('count')

  // // autorefresh - this works but resets page position
  // setTimeout(() => window.location.reload(), 2000)

  // highlight the current tab
  const tabname = window.location.pathname.slice(1) // probe|current|sample
  document.getElementById('tab-' + tabname).classList.add('selected')
}

function fetchData() {
  var p = document.getElementById('pathText').value
  var f = document.getElementById('fromText').value
  var c = document.getElementById('countText').value
  let base = '../probe'
  let params = []
  if (p) {
    params.push('path=' + p)
    base = '../current'
  }
  if (f) {
    params.push('from=' + f)
    base = '../sample'
  }
  if (c) {
    params.push('count=' + c)
    base = '../sample'
  }
  const query = base + (params.length === 0) ? '' : '?' + params.join('&')
  console.log(base, params, query)
  window.location = query
}

function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
}
