import fetch from 'node-fetch'

const url = 'http://agent:5000/current'

fetch(url, {
  method: 'GET',
  headers: {
    Accept: 'application/json',
  },
})
  .then(response => response.json())
  .then(json => console.log(json))
