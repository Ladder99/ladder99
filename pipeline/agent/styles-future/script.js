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
  // window.location = '../sample?from=' + f + '&count=' + c
  if (p) {
    window.location = '../current?path=' + p
  } else if (f || c) {
    window.location = '../sample?path=' + p + '&from=' + f + '&count=' + c
  } else {
    window.location = '../probe'
    // alert('enter somethings')
  }
}

function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
}
