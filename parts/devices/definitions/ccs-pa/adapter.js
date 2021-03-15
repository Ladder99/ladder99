// we/user write this code, then `just devices` will copy it to adapter/plugins -
// see that for the dev version.
// get it working there, then move it here.

//. will need text substitution here
const topics = {
  sendQuery: 'l99/${serialNumber}/cmd/query',
  receiveQuery: 'l99/${serialNumber}/evt/query',
  receiveStatus: 'l99/${serialNumber}/evt/status',
  receiveRead: 'l99/${serialNumber}/evt/read',
}
