window.onload = function () {
  document.getElementById('fromText').value = getParameterByName('from')
  document.getElementById('countText').value = getParameterByName('count')
  // document.getElementById('queryText').value = getParameterByName('query')
  // // autorefresh - this works but resets page position
  // setTimeout(() => window.location.reload(), 2000)
}

function getSample() {
  var f = document.getElementById('fromText').value
  var c = document.getElementById('countText').value
  // var q = document.getElementById('queryText').value
  window.location = '../sample?from=' + f + '&count=' + c
}

function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search)
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '))
}
