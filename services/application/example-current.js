// this is example json data from mtconnect agent 5000/current

export default {
  MTConnectStreams: {
    Header: {
      '@bufferSize': 131072,
      '@creationTime': '2021-04-03T14:53:29Z',
      '@firstSequence': 1,
      '@instanceId': 1617461605,
      '@lastSequence': 7,
      '@nextSequence': 8,
      '@sender': 'a7c87ed17539',
      '@testIndicator': false,
      '@version': '1.6',
    },
    Streams: [
      {
        DeviceStream: {
          '@name': 'ccs-pa-001',
          '@uuid': 'ccs-pa-001',
          ComponentStreams: [
            {
              ComponentStream: {
                '@component': 'Device',
                '@componentId': 'ccs-pa-001',
                '@name': 'ccs-pa-001',
                Events: [
                  {
                    Availability: {
                      '@dataItemId': 'ccs-pa-001-connection',
                      '@sequence': 1,
                      '@timestamp': '2021-04-03T14:53:25.573274Z',
                      Value: 'UNAVAILABLE',
                    },
                  },
                  {
                    EmergencyStop: {
                      '@dataItemId': 'ccs-pa-001-e_stop',
                      '@sequence': 2,
                      '@timestamp': '2021-04-03T14:53:25.573274Z',
                      Value: 'UNAVAILABLE',
                    },
                  },
                  {
                    ActuatorState: {
                      '@dataItemId': 'ccs-pa-001-printer_start_print',
                      '@sequence': 4,
                      '@timestamp': '2021-04-03T14:53:25.573274Z',
                      Value: 'UNAVAILABLE',
                    },
                  },
                  {
                    Execution: {
                      '@dataItemId': 'ccs-pa-001-state',
                      '@sequence': 5,
                      '@timestamp': '2021-04-03T14:53:25.573274Z',
                      Value: 'UNAVAILABLE',
                    },
                  },
                  {
                    AssetChanged: {
                      '@assetType': '',
                      '@dataItemId': 'ccs-pa-001_asset_chg',
                      '@sequence': 6,
                      '@timestamp': '2021-04-03T14:53:25.573274Z',
                      Value: 'UNAVAILABLE',
                    },
                  },
                  {
                    AssetRemoved: {
                      '@assetType': '',
                      '@dataItemId': 'ccs-pa-001_asset_rem',
                      '@sequence': 7,
                      '@timestamp': '2021-04-03T14:53:25.573274Z',
                      Value: 'UNAVAILABLE',
                    },
                  },
                ],
              },
            },
            {
              ComponentStream: {
                '@component': 'Personnel',
                '@componentId': 'personnel',
                '@name': 'personnel',
                Events: [
                  {
                    User: {
                      '@dataItemId': 'ccs-pa-001-operator',
                      '@sequence': 3,
                      '@subType': 'OPERATOR',
                      '@timestamp': '2021-04-03T14:53:25.573274Z',
                      Value: 'UNAVAILABLE',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  },
}
