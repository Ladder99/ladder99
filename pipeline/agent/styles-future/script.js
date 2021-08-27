let timer = null

window.onload = function () {
  document.getElementById('pathText').value = getParameterByName('path')
  document.getElementById('fromText').value = getParameterByName('from')
  document.getElementById('countText').value = getParameterByName('count')

  // document
  //   .querySelector('#tab-probe a')
  //   .addEventListener('shown.bs.tab', () => alert('hi'))

  // $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
  //   var target = $(e.target).attr('href') // activated tab
  //   alert(target)
  // })

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
  var path = document.getElementById('pathText').value
  var from = document.getElementById('fromText').value
  var count = document.getElementById('countText').value
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
  const query = base + (params.length === 0) ? '' : '?' + params.join('&')
  console.log(base, params, query)
  window.location = query
}

function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
}
