let timer = null

window.onload = function () {
  // typescript complains if use .value here
  document.getElementById('path')['value'] = getParameterByName('path')
  document.getElementById('from')['value'] = getParameterByName('from')
  document.getElementById('count')['value'] = getParameterByName('count')

  // // autorefresh
  // document.querySelector("#autorefresh").
  // timer = setTimeout(() => window.location.reload(), 2000)

  // highlight the current tab
  const tabname = window.location.pathname.slice(1).split('?')[0] // probe|current|sample
  document.getElementById('tab-' + tabname).classList.add('selected')

  // restore to last vertical position
  const scrollTop = localStorage.getItem('scrollTop-' + tabname)
  if (scrollTop != null) {
    const container = document.getElementById('main-container')
    container.scrollTop = parseInt(scrollTop)
  }
}

// save last vertical position
window.onbeforeunload = function () {
  const container = document.getElementById('main-container')
  const scrollTop = container != null ? container.scrollTop : 0
  const tabname = window.location.pathname.slice(1).split('?')[0] // probe|current|sample
  localStorage.setItem('scrollTop-' + tabname, String(scrollTop))
}

// user clicked on fetch data button
function fetchData() {
  // typescript complains if use .value here
  var path = document.getElementById('path')['value']
  var from = document.getElementById('from')['value']
  var count = document.getElementById('count')['value']
  let base = '../current'
  let params = []
  if (path) {
    params.push('path=' + path)
  }
  if (from) {
    params.push('from=' + from)
    base = '../sample'
  }
  if (count) {
    params.push('count=' + count)
    base = '../sample'
  }
  const query = base + (params.length === 0 ? '' : '?' + params.join('&'))
  console.log(base, params, params.length, query)
  window.location.assign(query)
}

function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
}
