export default {
  _declaration: { _attributes: { version: '1.0', encoding: 'UTF-8' } },
  MTConnectDevices: {
    _attributes: {
      'xmlns:m': 'urn:mtconnect.org:MTConnectDevices:1.7',
      xmlns: 'urn:mtconnect.org:MTConnectDevices:1.7',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation':
        'urn:mtconnect.org:MTConnectDevices:1.7 http://schemas.mtconnect.org/schemas/MTConnectDevices_1.7.xsd',
    },
    Header: {
      _attributes: {
        creationTime: '2021-06-25T14:08:24Z',
        sender: 'DMZ-MTCNCT',
        instanceId: '1622761005',
        version: '1.7.0.3',
        assetBufferSize: '8096',
        assetCount: '73',
        bufferSize: '4096',
      },
      AssetCounts: {
        AssetCount: { _attributes: { assetType: 'CuttingTool' }, _text: '73' },
      },
    },
    Devices: {
      Agent: {
        _attributes: {
          id: 'agent_2cde48001122',
          mtconnectVersion: '1.7',
          name: 'Agent',
          uuid: '0b49a3a0-18ca-0139-8748-2cde48001122',
        },
        DataItems: {
          DataItem: [
            {
              _attributes: {
                category: 'EVENT',
                id: 'agent_avail',
                type: 'AVAILABILITY',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'device_added',
                type: 'DEVICE_ADDED',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'device_removed',
                type: 'DEVICE_REMOVED',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'device_changed',
                type: 'DEVICE_CHANGED',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                discrete: 'true',
                id: 'agent_2cde48001122_asset_chg',
                type: 'ASSET_CHANGED',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'agent_2cde48001122_asset_rem',
                type: 'ASSET_REMOVED',
              },
            },
          ],
        },
        Components: {
          Adapters: {
            _attributes: { id: '__adapters__' },
            Components: {
              Adapter: {
                _attributes: { id: '_414ef97208', name: 'M12346' },
                DataItems: {
                  DataItem: [
                    {
                      _attributes: {
                        category: 'EVENT',
                        id: '_414ef97208_connection_status',
                        type: 'CONNECTION_STATUS',
                      },
                    },
                    {
                      _attributes: {
                        category: 'SAMPLE',
                        id: '_414ef97208_observation_update_rate',
                        nativeUnits: 'COUNT/SECOND',
                        statistic: 'AVERAGE',
                        type: 'OBSERVATION_UPDATE_RATE',
                        units: 'COUNT/SECOND',
                      },
                    },
                    {
                      _attributes: {
                        category: 'SAMPLE',
                        id: '_414ef97208_asset_update_rate',
                        nativeUnits: 'COUNT/SECOND',
                        statistic: 'AVERAGE',
                        type: 'ASSET_UPDATE_RATE',
                        units: 'COUNT/SECOND',
                      },
                    },
                    {
                      _attributes: {
                        category: 'EVENT',
                        id: '_414ef97208_adapter_software_version',
                        type: 'ADAPTER_SOFTWARE_VERSION',
                      },
                    },
                    {
                      _attributes: {
                        category: 'EVENT',
                        id: '_414ef97208_mtconnect_version',
                        type: 'MTCONNECT_VERSION',
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      Device: {
        _attributes: { id: 'd1', name: 'M12346', uuid: 'M80104K162N' },
        Description: {
          _attributes: { manufacturer: 'Mazak_Corporation' },
          _text: 'Mill w/SMooth-G',
        },
        DataItems: {
          DataItem: [
            {
              _attributes: {
                category: 'EVENT',
                id: 'avail',
                type: 'AVAILABILITY',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'functionalmode',
                type: 'FUNCTIONAL_MODE',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'emloaded',
                subType: 'LOADED',
                type: 'EQUIPMENT_MODE',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'emworking',
                subType: 'WORKING',
                type: 'EQUIPMENT_MODE',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'emoperating',
                subType: 'OPERATING',
                type: 'EQUIPMENT_MODE',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'empowered',
                subType: 'POWERED',
                type: 'EQUIPMENT_MODE',
              },
            },
            {
              _attributes: {
                category: 'EVENT',
                id: 'emdelay',
                subType: 'DELAY',
                type: 'EQUIPMENT_MODE',
              },
            },
          ],
        },
        Components: {
          Axes: {
            _attributes: { id: 'a', name: 'base' },
            DataItems: {
              DataItem: [
                {
                  _attributes: {
                    category: 'CONDITION',
                    id: 'servo_cond',
                    type: 'ACTUATOR',
                  },
                },
                {
                  _attributes: {
                    category: 'CONDITION',
                    id: 'spindle_cond',
                    type: 'SYSTEM',
                  },
                },
              ],
            },
          },
          Door: {
            _attributes: { id: 'door1', name: 'door' },
            DataItems: {
              DataItem: {
                _attributes: {
                  category: 'EVENT',
                  id: 'doorstate',
                  type: 'DOOR_STATE',
                },
              },
            },
          },
          Resources: {
            _attributes: { id: 'resources', name: 'resources' },
            Components: {
              Personnel: {
                _attributes: { id: 'personnel', name: 'personnel' },
                DataItems: {
                  DataItem: {
                    _attributes: {
                      category: 'EVENT',
                      id: 'operator',
                      type: 'USER',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
