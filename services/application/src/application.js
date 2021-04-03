import fetch from 'node-fetch'

const url = 'http://agent:5000/current'

async function shovel() {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
  const json = await response.json()
  console.log(json)
  const streams = json.MTConnectStreams.Streams
  for (const stream of streams) {
    const device = stream.DeviceStream
    const components = device.ComponentStreams
    for (const component of components) {
      console.log(component)
      const events = component.ComponentStream.Events
      for (const event of events) {
        console.log(event)
        // eg
        //   application          | {
        //   application          |   User: {
        //   application          |     '@dataItemId': 'ccs-pa-001-operator',
        //   application          |     '@sequence': 8,
        //   application          |     '@subType': 'OPERATOR',
        //   application          |     '@timestamp': '2021-04-03T14:45:25.643Z',
        //   application          |     Value: 'AMANDA DAVIS'
        //   application          |   }
        //   application          | }
      }
    }
  }
}

setInterval(shovel, 2000)
