let container = null
let autorefreshTimer = null

window.onload = function () {
  container = document.getElementById('main-container')

  // typescript complains if use .value here
  document.getElementById('path')['value'] = getParameterByName('path')
  document.getElementById('from')['value'] = getParameterByName('from')
  document.getElementById('count')['value'] = getParameterByName('count')

  // highlight the current tab
  const tabname = window.location.pathname.slice(1).split('?')[0] // probe|current|sample
  document.getElementById('tab-' + tabname).classList.add('selected')

  // restore to last vertical position
  const scrollTop = localStorage.getItem('scrollTop-' + tabname)
  if (scrollTop != null) {
    // const container = document.getElementById('main-container')
    container.scrollTop = parseInt(scrollTop)
  }

  // autorefresh
  const autorefreshBtn = document.querySelector('#autorefresh')
  if (localStorage.getItem('autorefresh')) {
    autorefreshTimer = setTimeout(() => window.location.reload(), 2000)
    autorefreshBtn.classList.add('active')
  }
  autorefreshBtn['onclick'] = function () {
    if (autorefreshTimer) {
      clearTimeout(autorefreshTimer)
      autorefreshTimer = null
      localStorage.setItem('autorefresh', '')
      autorefreshBtn.classList.remove('active')
    } else {
      autorefreshTimer = setTimeout(() => window.location.reload(), 2000)
      localStorage.setItem('autorefresh', 'on')
      autorefreshBtn.classList.add('active')
    }
  }
}

// save last vertical position
window.onbeforeunload = function () {
  // const container = document.getElementById('main-container')
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

function gotoTop() {
  container.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const XML = {
  parse: (string, type = 'text/xml') =>
    new DOMParser().parseFromString(string, type), // like JSON.parse
  stringify: DOM => new XMLSerializer().serializeToString(DOM), // like JSON.stringify

  transform: (xml, xsl) => {
    let proc = new XSLTProcessor()
    proc.importStylesheet(typeof xsl == 'string' ? XML.parse(xsl) : xsl)
    let output = proc.transformToFragment(
      typeof xml == 'string' ? XML.parse(xml) : xml,
      document
    )
    return typeof xml == 'string' ? XML.stringify(output) : output // if source was string then stringify response, else return object
  },

  minify: node => XML.toString(node, false),
  prettify: node => XML.toString(node, true),
  toString: (node, pretty, level = 0, singleton = false) => {
    // einzelkind
    if (typeof node == 'string') node = XML.parse(node)
    // if (node === null) return ''
    let tabs = pretty
      ? Array(level + 1)
          .fill('')
          .join('\t')
      : ''
    let newLine = pretty ? '\n' : ''
    if (node.nodeType == 3)
      return (
        (singleton ? '' : tabs) +
        node.textContent.trim() +
        (singleton ? '' : newLine)
      )
    if (!node.tagName) return XML.toString(node.firstChild, pretty)
    let output = tabs + `<${node.tagName}` // >\n
    for (let i = 0; i < node.attributes.length; i++)
      output += ` ${node.attributes[i].name}="${node.attributes[i].value}"`
    if (node.childNodes.length == 0) return output + ' />' + newLine
    else output += '>'
    let onlyOneTextChild =
      node.childNodes.length == 1 && node.childNodes[0].nodeType == 3
    if (!onlyOneTextChild) output += newLine
    for (let i = 0; i < node.childNodes.length; i++)
      output += XML.toString(
        node.childNodes[i],
        pretty,
        level + 1,
        onlyOneTextChild
      )
    return (
      output + (onlyOneTextChild ? '' : tabs) + `</${node.tagName}>` + newLine
    )
  },
}

async function showXml() {
  const response = await fetch(window.location.href)
  let xml = await response.text()
  // xml = xml.replace('styles.xsl', 'styles-plain.xsl')

  // document.body.innerText = xml

  var parser = new DOMParser()
  var doc = parser.parseFromString(xml, 'text/xml') // type Document
  console.log(doc)

  const str = XML.prettify(doc)
  console.log(str)

  container.innerText = str

  // const xs = new XMLSerializer()
  // const str = xs.serializeToString(doc)
  // console.log(str)

  // container.innerHTML = str

  // const textarea = document.querySelector('#textarea')
  // textarea['innerText'] = xml
  // alert(xml)

  // document.body = str

  // var tab = window.open('about:blank', '_blank')
  // tab.document.write(xml)
  // tab.document.write('<textarea>' + xml + '</textarea>')
  // tab.document.close()
}
