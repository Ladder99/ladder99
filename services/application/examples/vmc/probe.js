export default {
  MTConnectDevices: {
    Devices: [
      {
        Agent: {
          Components: [
            {
              Adapters: {
                Components: [
                  {
                    Adapter: {
                      DataItems: [
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: '_24956f03ad_connection_status',
                            type: 'CONNECTION_STATUS',
                          },
                        },
                        {
                          DataItem: {
                            Constraints: {
                              value: ['shdr://127.0.0.1:7878'],
                            },
                            category: 'EVENT',
                            id: '_24956f03ad_adapter_uri',
                            type: 'ADAPTER_URI',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: '_24956f03ad_observation_update_rate',
                            nativeUnits: 'COUNT/SECOND',
                            statistic: 'AVERAGE',
                            type: 'OBSERVATION_UPDATE_RATE',
                            units: 'COUNT/SECOND',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: '_24956f03ad_asset_update_rate',
                            nativeUnits: 'COUNT/SECOND',
                            statistic: 'AVERAGE',
                            type: 'ASSET_UPDATE_RATE',
                            units: 'COUNT/SECOND',
                          },
                        },
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: '_24956f03ad_adapter_software_version',
                            type: 'ADAPTER_SOFTWARE_VERSION',
                          },
                        },
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: '_24956f03ad_mtconnect_version',
                            type: 'MTCONNECT_VERSION',
                          },
                        },
                      ],
                      id: '_24956f03ad',
                      name: '127.0.0.1:7878',
                    },
                  },
                ],
                id: '__adapters__',
              },
            },
          ],
          DataItems: [
            {
              DataItem: {
                category: 'EVENT',
                id: 'agent_avail',
                type: 'AVAILABILITY',
              },
            },
            {
              DataItem: {
                category: 'EVENT',
                id: 'device_added',
                type: 'DEVICE_ADDED',
              },
            },
            {
              DataItem: {
                category: 'EVENT',
                id: 'device_removed',
                type: 'DEVICE_REMOVED',
              },
            },
            {
              DataItem: {
                category: 'EVENT',
                id: 'device_changed',
                type: 'DEVICE_CHANGED',
              },
            },
            {
              DataItem: {
                category: 'EVENT',
                discrete: 'true',
                id: 'agent_2cde48001122_asset_chg',
                type: 'ASSET_CHANGED',
              },
            },
            {
              DataItem: {
                category: 'EVENT',
                id: 'agent_2cde48001122_asset_rem',
                type: 'ASSET_REMOVED',
              },
            },
          ],
          id: 'agent_2cde48001122',
          mtconnectVersion: '1.7',
          name: 'Agent',
          uuid: '0b49a3a0-18ca-0139-8748-2cde48001122',
        },
      },
      {
        Device: {
          Components: [
            {
              Axes: {
                Components: [
                  {
                    Rotary: {
                      DataItems: [
                        {
                          DataItem: {
                            Source: { text: 'spindle_speed' },
                            category: 'SAMPLE',
                            id: 'c2',
                            name: 'Sspeed',
                            nativeUnits: 'REVOLUTION/MINUTE',
                            subType: 'ACTUAL',
                            type: 'SPINDLE_SPEED',
                            units: 'REVOLUTION/MINUTE',
                          },
                        },
                        {
                          DataItem: {
                            Source: { text: 'SspeedOvr' },
                            category: 'SAMPLE',
                            id: 'c3',
                            name: 'Sovr',
                            nativeUnits: 'PERCENT',
                            subType: 'OVERRIDE',
                            type: 'SPINDLE_SPEED',
                            units: 'PERCENT',
                          },
                        },
                        {
                          DataItem: {
                            Constraints: { value: ['SPINDLE'] },
                            category: 'EVENT',
                            id: 'cm',
                            name: 'Cmode',
                            type: 'ROTARY_MODE',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'Cloadc',
                            type: 'LOAD',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'Csystem',
                            type: 'SYSTEM',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'cl3',
                            name: 'Cload',
                            nativeUnits: 'PERCENT',
                            type: 'LOAD',
                            units: 'PERCENT',
                          },
                        },
                      ],
                      id: 'c1',
                      name: 'C',
                    },
                  },
                  {
                    Linear: {
                      DataItems: [
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'x2',
                            name: 'Xact',
                            nativeUnits: 'MILLIMETER',
                            subType: 'ACTUAL',
                            type: 'POSITION',
                            units: 'MILLIMETER',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'x3',
                            name: 'Xcom',
                            nativeUnits: 'MILLIMETER',
                            subType: 'COMMANDED',
                            type: 'POSITION',
                            units: 'MILLIMETER',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'n3',
                            name: 'Xload',
                            nativeUnits: 'PERCENT',
                            type: 'LOAD',
                            units: 'PERCENT',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'Xloadc',
                            type: 'LOAD',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'Xsystem',
                            type: 'SYSTEM',
                          },
                        },
                      ],
                      id: 'x1',
                      name: 'X',
                    },
                  },
                  {
                    Linear: {
                      DataItems: [
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'y2',
                            name: 'Yact',
                            nativeUnits: 'MILLIMETER',
                            subType: 'ACTUAL',
                            type: 'POSITION',
                            units: 'MILLIMETER',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'y3',
                            name: 'Ycom',
                            nativeUnits: 'MILLIMETER',
                            subType: 'COMMANDED',
                            type: 'POSITION',
                            units: 'MILLIMETER',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'y4',
                            name: 'Yload',
                            nativeUnits: 'PERCENT',
                            type: 'LOAD',
                            units: 'PERCENT',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'Yloadc',
                            type: 'LOAD',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'Ysystem',
                            type: 'SYSTEM',
                          },
                        },
                      ],
                      id: 'y1',
                      name: 'Y',
                    },
                  },
                  {
                    Linear: {
                      DataItems: [
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'z2',
                            name: 'Zact',
                            nativeUnits: 'MILLIMETER',
                            subType: 'ACTUAL',
                            type: 'POSITION',
                            units: 'MILLIMETER',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'z3',
                            name: 'Zcom',
                            nativeUnits: 'MILLIMETER',
                            subType: 'COMMANDED',
                            type: 'POSITION',
                            units: 'MILLIMETER',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'z4',
                            name: 'Zload',
                            nativeUnits: 'PERCENT',
                            type: 'LOAD',
                            units: 'PERCENT',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'Zloadc',
                            type: 'LOAD',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'Zsystem',
                            type: 'SYSTEM',
                          },
                        },
                      ],
                      id: 'z1',
                      name: 'Z',
                    },
                  },
                ],
                id: 'ax',
                name: 'Axes',
              },
            },
            {
              Controller: {
                Components: [
                  {
                    Path: {
                      DataItems: [
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: 'cn2',
                            name: 'block',
                            type: 'BLOCK',
                          },
                        },
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: 'cn3',
                            name: 'mode',
                            type: 'CONTROLLER_MODE',
                          },
                        },
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: 'cn4',
                            name: 'line',
                            type: 'LINE',
                          },
                        },
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: 'cn5',
                            name: 'program',
                            type: 'PROGRAM',
                          },
                        },
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: 'cn6',
                            name: 'execution',
                            type: 'EXECUTION',
                          },
                        },
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: 'cnt1',
                            name: 'tool_id',
                            type: 'TOOL_ID',
                          },
                        },
                        {
                          DataItem: {
                            category: 'SAMPLE',
                            id: 'Ppos',
                            nativeUnits: 'MILLIMETER_3D',
                            subType: 'ACTUAL',
                            type: 'PATH_POSITION',
                            units: 'MILLIMETER_3D',
                          },
                        },
                        {
                          DataItem: {
                            Source: { text: 'path_feedrate' },
                            category: 'SAMPLE',
                            id: 'Frt',
                            nativeUnits: 'MILLIMETER/SECOND',
                            type: 'PATH_FEEDRATE',
                            units: 'MILLIMETER/SECOND',
                          },
                        },
                        {
                          DataItem: {
                            Source: { text: 'feed_ovr' },
                            category: 'SAMPLE',
                            id: 'Fovr',
                            nativeUnits: 'PERCENT',
                            type: 'PATH_FEEDRATE',
                            units: 'PERCENT',
                          },
                        },
                      ],
                      id: 'pth',
                      name: 'path',
                    },
                  },
                ],
                DataItems: [
                  {
                    DataItem: {
                      category: 'EVENT',
                      id: 'msg',
                      type: 'MESSAGE',
                    },
                  },
                  {
                    DataItem: {
                      category: 'EVENT',
                      id: 'estop',
                      type: 'EMERGENCY_STOP',
                    },
                  },
                  {
                    DataItem: {
                      category: 'CONDITION',
                      id: 'clp',
                      type: 'LOGIC_PROGRAM',
                    },
                  },
                  {
                    DataItem: {
                      category: 'CONDITION',
                      id: 'motion',
                      type: 'MOTION_PROGRAM',
                    },
                  },
                  {
                    DataItem: {
                      category: 'CONDITION',
                      id: 'system',
                      type: 'SYSTEM',
                    },
                  },
                ],
                id: 'cn1',
                name: 'controller',
              },
            },
            {
              Systems: {
                Components: [
                  {
                    Electric: {
                      DataItems: [
                        {
                          DataItem: {
                            category: 'EVENT',
                            id: 'p2',
                            name: 'power',
                            type: 'POWER_STATE',
                          },
                        },
                      ],
                      id: 'el',
                      name: 'electric',
                    },
                  },
                  {
                    Coolant: {
                      DataItems: [
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'clow',
                            type: 'LEVEL',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'coolpres',
                            type: 'PRESSURE',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'filter',
                            type: 'x:FILTER',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'coolantmotor',
                            type: 'ACTUATOR',
                          },
                        },
                      ],
                      id: 'cool',
                      name: 'coolant',
                    },
                  },
                  {
                    Hydraulic: {
                      DataItems: [
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'hlow',
                            type: 'LEVEL',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'hpres',
                            type: 'PRESSURE',
                          },
                        },
                        {
                          DataItem: {
                            category: 'CONDITION',
                            id: 'htemp',
                            type: 'TEMPERATURE',
                          },
                        },
                      ],
                      id: 'hsys',
                      name: 'hydrolic',
                    },
                  },
                ],
                id: 'systems',
                name: 'systems',
              },
            },
          ],
          DataItems: [
            {
              DataItem: {
                category: 'EVENT',
                id: 'avail',
                type: 'AVAILABILITY',
              },
            },
            {
              DataItem: {
                category: 'EVENT',
                discrete: 'true',
                id: 'dev_asset_chg',
                type: 'ASSET_CHANGED',
              },
            },
            {
              DataItem: {
                category: 'EVENT',
                id: 'dev_asset_rem',
                type: 'ASSET_REMOVED',
              },
            },
          ],
          Description: { manufacturer: 'SystemInsights' },
          id: 'dev',
          iso841Class: '6',
          name: 'VMC-3Axis',
          sampleInterval: '10',
          uuid: '000',
        },
      },
    ],
    Header: {
      assetBufferSize: 1024,
      assetCount: 0,
      bufferSize: 131072,
      creationTime: '2021-05-18T03:48:24Z',
      instanceId: 1621309480,
      schemaVersion: '1.7',
      sender: 'b28197f93e9b',
      testIndicator: false,
      version: '1.7.0.3',
    },
  },
}
