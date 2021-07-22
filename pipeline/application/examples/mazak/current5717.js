export default {
  _declaration: {
    _attributes: {
      version: '1.0',
      encoding: 'UTF-8',
    },
  },
  MTConnectStreams: {
    _attributes: {
      'xmlns:m': 'urn:mtconnect.org:MTConnectStreams:1.7',
      xmlns: 'urn:mtconnect.org:MTConnectStreams:1.7',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation':
        'urn:mtconnect.org:MTConnectStreams:1.7 http://schemas.mtconnect.org/schemas/MTConnectStreams_1.7.xsd',
    },
    Header: {
      _attributes: {
        creationTime: '2021-06-29T05:38:11Z',
        sender: 'DMZ-MTCNCT',
        instanceId: '1622761005',
        version: '1.7.0.3',
        bufferSize: '4096',
        nextSequence: '1881543',
        firstSequence: '1877447',
        lastSequence: '1881542',
      },
    },
    Streams: {
      DeviceStream: [
        {
          _attributes: {
            name: 'Agent',
            uuid: '0b49a3a0-18ca-0139-8748-2cde48001122',
          },
          ComponentStream: [
            {
              _attributes: {
                component: 'Adapter',
                name: 'M12346',
                componentId: '_414ef97208',
              },
              Samples: {
                AssetUpdateRate: {
                  _attributes: {
                    dataItemId: '_414ef97208_asset_update_rate',
                    duration: '10',
                    sequence: '1881541',
                    statistic: 'AVERAGE',
                    timestamp: '2021-06-29T05:38:07.369971Z',
                  },
                  _text: '0',
                },
                ObservationUpdateRate: {
                  _attributes: {
                    dataItemId: '_414ef97208_observation_update_rate',
                    duration: '10',
                    sequence: '1881542',
                    statistic: 'AVERAGE',
                    timestamp: '2021-06-29T05:38:09.178259Z',
                  },
                  _text: '0',
                },
              },
              Events: {
                AdapterSoftwareVersion: {
                  _attributes: {
                    dataItemId: '_414ef97208_adapter_software_version',
                    sequence: '118',
                    timestamp: '2021-06-03T22:56:45.232404Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                ConnectionStatus: {
                  _attributes: {
                    dataItemId: '_414ef97208_connection_status',
                    sequence: '1879952',
                    timestamp: '2021-06-29T03:52:27.500873Z',
                  },
                  _text: 'ESTABLISHED',
                },
                MTConnectVersion: {
                  _attributes: {
                    dataItemId: '_414ef97208_mtconnect_version',
                    sequence: '119',
                    timestamp: '2021-06-03T22:56:45.232408Z',
                  },
                  _text: 'UNAVAILABLE',
                },
              },
            },
            {
              _attributes: {
                component: 'Agent',
                name: 'Agent',
                componentId: 'agent_2cde48001122',
              },
              Events: {
                AssetChanged: {
                  _attributes: {
                    dataItemId: 'agent_2cde48001122_asset_chg',
                    sequence: '6',
                    timestamp: '2021-06-03T22:56:45.227951Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                AssetRemoved: {
                  _attributes: {
                    dataItemId: 'agent_2cde48001122_asset_rem',
                    sequence: '5',
                    timestamp: '2021-06-03T22:56:45.227943Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                Availability: {
                  _attributes: {
                    dataItemId: 'agent_avail',
                    sequence: '2',
                    timestamp: '2021-06-03T22:56:45.227924Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                DeviceAdded: {
                  _attributes: {
                    dataItemId: 'device_added',
                    sequence: '123',
                    timestamp: '2021-06-03T22:56:45.240357Z',
                  },
                  _text: 'M80104K162N',
                },
                DeviceChanged: {
                  _attributes: {
                    dataItemId: 'device_changed',
                    sequence: '124',
                    timestamp: '2021-06-03T22:56:45.241549Z',
                  },
                  _text: 'M80104K162N',
                },
                DeviceRemoved: {
                  _attributes: {
                    dataItemId: 'device_removed',
                    sequence: '122',
                    timestamp: '2021-06-03T22:56:45.239127Z',
                  },
                  _text: 'Mazak',
                },
              },
            },
          ],
        },
        {
          _attributes: {
            name: 'M12346',
            uuid: 'M80104K162N',
          },
          ComponentStream: [
            {
              _attributes: {
                component: 'Axes',
                name: 'base',
                componentId: 'a',
              },
              Condition: {
                Normal: [
                  {
                    _attributes: {
                      dataItemId: 'servo_cond',
                      sequence: '1880026',
                      timestamp: '2021-06-29T03:52:27.553435Z',
                      type: 'ACTUATOR',
                    },
                  },
                  {
                    _attributes: {
                      dataItemId: 'spindle_cond',
                      sequence: '1880035',
                      timestamp: '2021-06-29T03:52:27.553564Z',
                      type: 'SYSTEM',
                    },
                  },
                ],
              },
            },
            {
              _attributes: {
                component: 'Rotary',
                name: 'B',
                componentId: 'ar',
              },
              Samples: {
                Angle: [
                  {
                    _attributes: {
                      dataItemId: 'Babs',
                      sequence: '1880074',
                      subType: 'ACTUAL',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: '180',
                  },
                  {
                    _attributes: {
                      dataItemId: 'Bpos',
                      sequence: '1880073',
                      subType: 'ACTUAL',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: '180.0318',
                  },
                ],
                AngularVelocity: {
                  _attributes: {
                    dataItemId: 'Bfrt',
                    sequence: '1878972',
                    timestamp: '2021-06-29T03:31:34.004446Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                Load: {
                  _attributes: {
                    dataItemId: 'Bload',
                    sequence: '1880078',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
                Temperature: {
                  _attributes: {
                    compositionId: 'Bmotor',
                    dataItemId: 'servotemp4',
                    sequence: '1880061',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '35',
                },
              },
              Events: {
                RotaryMode: {
                  _attributes: {
                    dataItemId: 'arfunc',
                    sequence: '56',
                    timestamp: '2021-06-03T22:56:45.22982Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                AxisState: {
                  _attributes: {
                    dataItemId: 'baxisstate',
                    sequence: '1880083',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: 'STOPPED',
                },
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'Btravel',
                    sequence: '1880041',
                    timestamp: '2021-06-29T03:52:27.553642Z',
                    type: 'ANGLE',
                  },
                },
              },
            },
            {
              _attributes: {
                component: 'Rotary',
                name: 'C',
                componentId: 'c',
              },
              Samples: {
                Angle: [
                  {
                    _attributes: {
                      dataItemId: 'Cabs',
                      sequence: '10',
                      subType: 'ACTUAL',
                      timestamp: '2021-06-03T22:56:45.229624Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                  {
                    _attributes: {
                      dataItemId: 'Cpos',
                      sequence: '42',
                      subType: 'ACTUAL',
                      timestamp: '2021-06-03T22:56:45.229753Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                ],
                AngularVelocity: {
                  _attributes: {
                    dataItemId: 'Cfrt',
                    sequence: '65',
                    timestamp: '2021-06-03T22:56:45.229849Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                Load: [
                  {
                    _attributes: {
                      dataItemId: 'Cload',
                      sequence: '63',
                      timestamp: '2021-06-03T22:56:45.229843Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                  {
                    _attributes: {
                      dataItemId: 'Sload',
                      sequence: '1878998',
                      timestamp: '2021-06-29T03:31:34.004807Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                ],
                RotaryVelocity: {
                  _attributes: {
                    dataItemId: 'Srpm',
                    sequence: '1880070',
                    subType: 'ACTUAL',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
                Temperature: {
                  _attributes: {
                    compositionId: 'Cmotor',
                    dataItemId: 'Stemp',
                    sequence: '1881487',
                    timestamp: '2021-06-29T05:33:56.31231Z',
                  },
                  _text: '25',
                },
              },
              Events: {
                AxisState: {
                  _attributes: {
                    dataItemId: 'caxisstate',
                    sequence: '70',
                    timestamp: '2021-06-03T22:56:45.229876Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                RotaryMode: {
                  _attributes: {
                    dataItemId: 'crfunc',
                    sequence: '1880066',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: 'SPINDLE',
                },
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'Ctravel',
                    sequence: '1880042',
                    timestamp: '2021-06-29T03:52:27.553654Z',
                    type: 'ANGLE',
                  },
                },
                Unavailable: [
                  {
                    _attributes: {
                      dataItemId: 'Sload_cond',
                      sequence: '1878999',
                      timestamp: '2021-06-29T03:31:34.004812Z',
                      type: 'LOAD',
                    },
                  },
                  {
                    _attributes: {
                      dataItemId: 'Stemp_cond',
                      sequence: '1788167',
                      timestamp: '2021-06-24T02:47:04.654375Z',
                      type: 'TEMPERATURE',
                    },
                  },
                ],
              },
            },
            {
              _attributes: {
                component: 'Controller',
                name: 'controller',
                componentId: 'cont',
              },
              Samples: {
                AccumulatedTime: [
                  {
                    _attributes: {
                      dataItemId: 'auto_time',
                      sequence: '1880093',
                      subType: 'X:AUTO',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: '32207900',
                  },
                  {
                    _attributes: {
                      dataItemId: 'cut_time',
                      sequence: '1880094',
                      subType: 'X:CUT',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: '14173623',
                  },
                  {
                    _attributes: {
                      dataItemId: 'total_auto_cut_time',
                      sequence: '1880092',
                      subType: 'X:TOTALCUTTIME',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: '0',
                  },
                  {
                    _attributes: {
                      dataItemId: 'total_time',
                      sequence: '1881534',
                      subType: 'X:TOTAL',
                      timestamp: '2021-06-29T05:37:34.224803Z',
                    },
                    _text: '126729217',
                  },
                ],
              },
              Events: {
                EmergencyStop: {
                  _attributes: {
                    dataItemId: 'estop',
                    sequence: '1880046',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: 'ARMED',
                },
                PalletId: {
                  _attributes: {
                    dataItemId: 'pallet_num',
                    sequence: '1880047',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
              },
              Condition: {
                Normal: [
                  {
                    _attributes: {
                      dataItemId: 'comms_cond',
                      sequence: '1880027',
                      timestamp: '2021-06-29T03:52:27.553462Z',
                      type: 'COMMUNICATIONS',
                    },
                  },
                  {
                    _attributes: {
                      dataItemId: 'system_cond',
                      sequence: '1880029',
                      timestamp: '2021-06-29T03:52:27.55349Z',
                      type: 'SYSTEM',
                    },
                  },
                ],
                Warning: [
                  {
                    _attributes: {
                      dataItemId: 'logic_cond',
                      nativeCode: '307',
                      nativeSeverity: '50',
                      sequence: '1880101',
                      timestamp: '2021-06-29T03:52:28.70962Z',
                      type: 'LOGIC_PROGRAM',
                    },
                    _text: 'COVER COOLANT OFF --> ON',
                  },
                  {
                    _attributes: {
                      dataItemId: 'logic_cond',
                      nativeCode: '333',
                      nativeSeverity: '50',
                      sequence: '1880102',
                      timestamp: '2021-06-29T03:52:28.709662Z',
                      type: 'LOGIC_PROGRAM',
                    },
                    _text: 'SET UP SW.MISS.OP.(SP.ORIENT)',
                  },
                  {
                    _attributes: {
                      dataItemId: 'logic_cond',
                      nativeCode: '351',
                      nativeSeverity: '50',
                      sequence: '1880104',
                      timestamp: '2021-06-29T03:52:28.709706Z',
                      type: 'LOGIC_PROGRAM',
                    },
                    _text: 'TOUCH SENSOR OFF',
                  },
                ],
                Fault: {
                  _attributes: {
                    dataItemId: 'logic_cond',
                    nativeCode: '230',
                    nativeSeverity: '90',
                    sequence: '1880103',
                    timestamp: '2021-06-29T03:52:28.709684Z',
                    type: 'LOGIC_PROGRAM',
                  },
                  _text: 'ILLEGAL MMS UNIT',
                },
              },
            },
            {
              _attributes: {
                component: 'Coolant',
                name: 'coolant',
                componentId: 'coolant',
              },
              Samples: {
                Concentration: {
                  _attributes: {
                    dataItemId: 'CONCENTRATION',
                    sequence: '107',
                    timestamp: '2021-06-03T22:56:45.230037Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                Temperature: {
                  _attributes: {
                    dataItemId: 'cooltemp',
                    sequence: '106',
                    timestamp: '2021-06-03T22:56:45.230033Z',
                  },
                  _text: 'UNAVAILABLE',
                },
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'coolant_cond',
                    sequence: '1880033',
                    timestamp: '2021-06-29T03:52:27.553539Z',
                    type: 'SYSTEM',
                  },
                },
              },
            },
            {
              _attributes: {
                component: 'Device',
                name: 'M12346',
                componentId: 'd1',
              },
              Events: {
                Availability: {
                  _attributes: {
                    dataItemId: 'avail',
                    sequence: '1880043',
                    timestamp: '2021-06-29T03:52:27.553665Z',
                  },
                  _text: 'AVAILABLE',
                },
                AssetChanged: {
                  _attributes: {
                    assetType: 'CuttingTool',
                    dataItemId: 'd1_asset_chg',
                    sequence: '1880181',
                    timestamp: '2021-06-29T03:52:46.565496Z',
                  },
                  _text: 'M80104K162N1.118',
                },
                AssetRemoved: {
                  _attributes: {
                    assetType: 'CuttingTool',
                    dataItemId: 'd1_asset_rem',
                    sequence: '1880025',
                    timestamp: '2021-06-29T03:52:27.553337Z',
                  },
                  _text: 'M80104K162N1.93',
                },
                EquipmentMode: [
                  {
                    _attributes: {
                      dataItemId: 'emdelay',
                      sequence: '1880088',
                      subType: 'DELAY',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: 'ON',
                  },
                  {
                    _attributes: {
                      dataItemId: 'emloaded',
                      sequence: '1880084',
                      subType: 'LOADED',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: 'OFF',
                  },
                  {
                    _attributes: {
                      dataItemId: 'emoperating',
                      sequence: '1880086',
                      subType: 'OPERATING',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: 'ON',
                  },
                  {
                    _attributes: {
                      dataItemId: 'empowered',
                      sequence: '1880087',
                      subType: 'POWERED',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: 'ON',
                  },
                  {
                    _attributes: {
                      dataItemId: 'emworking',
                      sequence: '1880085',
                      subType: 'WORKING',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: 'OFF',
                  },
                ],
                FunctionalMode: {
                  _attributes: {
                    dataItemId: 'functionalmode',
                    sequence: '9',
                    timestamp: '2021-06-03T22:56:45.229617Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                OperatingSystem: [
                  {
                    _attributes: {
                      dataItemId: 'os',
                      sequence: '27',
                      subType: 'VERSION',
                      timestamp: '2021-06-03T22:56:45.229697Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                  {
                    _attributes: {
                      dataItemId: 'osid',
                      sequence: '29',
                      subType: 'INSTALL_DATE',
                      timestamp: '2021-06-03T22:56:45.229705Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                  {
                    _attributes: {
                      dataItemId: 'osl',
                      sequence: '20',
                      subType: 'LICENSE',
                      timestamp: '2021-06-03T22:56:45.22967Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                  {
                    _attributes: {
                      dataItemId: 'osmfg',
                      sequence: '30',
                      subType: 'MANUFACTURER',
                      timestamp: '2021-06-03T22:56:45.229709Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                  {
                    _attributes: {
                      dataItemId: 'osrd',
                      sequence: '18',
                      subType: 'RELEASE_DATE',
                      timestamp: '2021-06-03T22:56:45.229663Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                ],
              },
            },
            {
              _attributes: {
                component: 'Door',
                name: 'door',
                componentId: 'door1',
              },
              Events: {
                DoorState: {
                  _attributes: {
                    dataItemId: 'doorstate',
                    sequence: '1880096',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: 'CLOSED',
                },
              },
            },
            {
              _attributes: {
                component: 'Electric',
                name: 'electric',
                componentId: 'elec',
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'electric_cond',
                    sequence: '1880032',
                    timestamp: '2021-06-29T03:52:27.553527Z',
                    type: 'SYSTEM',
                  },
                },
              },
            },
            {
              _attributes: {
                component: 'Hydraulic',
                name: 'hydraulic',
                componentId: 'hydraulic',
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'hydra_cond',
                    sequence: '1880031',
                    timestamp: '2021-06-29T03:52:27.553515Z',
                    type: 'SYSTEM',
                  },
                },
              },
            },
            {
              _attributes: {
                component: 'Lubrication',
                name: 'lubrication',
                componentId: 'lubrication',
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'lubrication_cond',
                    sequence: '1880034',
                    timestamp: '2021-06-29T03:52:27.55355Z',
                    type: 'SYSTEM',
                  },
                },
              },
            },
            {
              _attributes: {
                component: 'Path',
                name: 'path',
                componentId: 'path1',
              },
              Samples: {
                PathFeedrate: {
                  _attributes: {
                    dataItemId: 'Fact',
                    sequence: '1880054',
                    subType: 'ACTUAL',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
                CuttingSpeed: {
                  _attributes: {
                    dataItemId: 'cspeed',
                    sequence: '102',
                    subType: 'ACTUAL',
                    timestamp: '2021-06-03T22:56:45.230021Z',
                  },
                  _text: 'UNAVAILABLE',
                },
              },
              Events: {
                PathFeedrateOverride: [
                  {
                    _attributes: {
                      dataItemId: 'Fovr',
                      sequence: '1880067',
                      subType: 'PROGRAMMED',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: '100',
                  },
                  {
                    _attributes: {
                      dataItemId: 'Frapidovr',
                      sequence: '1880068',
                      subType: 'RAPID',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: '100',
                  },
                ],
                PartCount: {
                  _attributes: {
                    dataItemId: 'PartCountAct',
                    sequence: '1880048',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
                RotaryVelocityOverride: {
                  _attributes: {
                    dataItemId: 'Sovr',
                    sequence: '1880069',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '100',
                },
                ToolGroup: {
                  _attributes: {
                    dataItemId: 'Tool_group',
                    sequence: '1880053',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '17006001',
                },
                ToolNumber: {
                  _attributes: {
                    dataItemId: 'Tool_number',
                    sequence: '1880051',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '120',
                },
                ToolSuffix: {
                  _attributes: {
                    dataItemId: 'Tool_suffix',
                    sequence: '1880052',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                },
                Program: [
                  {
                    _attributes: {
                      dataItemId: 'activeprog',
                      sequence: '1873039',
                      subType: 'ACTIVE',
                      timestamp: '2021-06-28T15:19:28.055067Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                  {
                    _attributes: {
                      dataItemId: 'program',
                      sequence: '1880049',
                      subType: 'MAIN',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: 'EZTABJ',
                  },
                ],
                ProgramComment: [
                  {
                    _attributes: {
                      dataItemId: 'activeprogram_cmt',
                      sequence: '1788187',
                      subType: 'ACTIVE',
                      timestamp: '2021-06-24T02:47:04.654525Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                  {
                    _attributes: {
                      dataItemId: 'program_cmt',
                      sequence: '1880050',
                      subType: 'MAIN',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                  },
                ],
                ControllerModeOverride: [
                  {
                    _attributes: {
                      dataItemId: 'cmodryrun',
                      sequence: '1880090',
                      subType: 'DRY_RUN',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: 'OFF',
                  },
                  {
                    _attributes: {
                      dataItemId: 'cmomachineaxislock',
                      sequence: '1880091',
                      subType: 'MACHINE_AXIS_LOCK',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: 'OFF',
                  },
                  {
                    _attributes: {
                      dataItemId: 'cmosingleblock',
                      sequence: '1880089',
                      subType: 'SINGLE_BLOCK',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: 'OFF',
                  },
                ],
                VariableDataSet: {
                  _attributes: {
                    count: '259',
                    dataItemId: 'cvars',
                    sequence: '1880057',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  Entry: [
                    {
                      _attributes: {
                        key: '100',
                      },
                      _text: '54.1',
                    },
                    {
                      _attributes: {
                        key: '101',
                      },
                      _text: '112',
                    },
                    {
                      _attributes: {
                        key: '104',
                      },
                      _text: '20',
                    },
                    {
                      _attributes: {
                        key: '105',
                      },
                      _text: '2220',
                    },
                    {
                      _attributes: {
                        key: '106',
                      },
                      _text: '-1402.4154',
                    },
                    {
                      _attributes: {
                        key: '107',
                      },
                      _text: '-1014.3475',
                    },
                    {
                      _attributes: {
                        key: '108',
                      },
                      _text: '-1790.0371',
                    },
                    {
                      _attributes: {
                        key: '109',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '110',
                      },
                      _text: '-0.0318',
                    },
                    {
                      _attributes: {
                        key: '111',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '112',
                      },
                      _text: '2.75488702478323',
                    },
                    {
                      _attributes: {
                        key: '113',
                      },
                      _text: '-0.415350000000009',
                    },
                    {
                      _attributes: {
                        key: '114',
                      },
                      _text: '-9.0246625',
                    },
                    {
                      _attributes: {
                        key: '115',
                      },
                      _text: '-0.523149999999987',
                    },
                    {
                      _attributes: {
                        key: '116',
                      },
                      _text: '215.7765',
                    },
                    {
                      _attributes: {
                        key: '118',
                      },
                      _text: '-119.329080420354',
                    },
                    {
                      _attributes: {
                        key: '119',
                      },
                      _text: '5000',
                    },
                    {
                      _attributes: {
                        key: '120',
                      },
                      _text: '1',
                    },
                    {
                      _attributes: {
                        key: '121',
                      },
                      _text: '2',
                    },
                    {
                      _attributes: {
                        key: '122',
                      },
                      _text: '2',
                    },
                    {
                      _attributes: {
                        key: '123',
                      },
                      _text: '0.05',
                    },
                    {
                      _attributes: {
                        key: '124',
                      },
                      _text: '-0.07085',
                    },
                    {
                      _attributes: {
                        key: '125',
                      },
                      _text: '74.94285',
                    },
                    {
                      _attributes: {
                        key: '126',
                      },
                      _text: '143.75335',
                    },
                    {
                      _attributes: {
                        key: '127',
                      },
                      _text: '-0.48637500000001',
                    },
                    {
                      _attributes: {
                        key: '128',
                      },
                      _text: '-9.08185',
                    },
                    {
                      _attributes: {
                        key: '129',
                      },
                      _text: '1',
                    },
                    {
                      _attributes: {
                        key: '135',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '136',
                      },
                      _text: '75',
                    },
                    {
                      _attributes: {
                        key: '137',
                      },
                      _text: '-72.02315',
                    },
                    {
                      _attributes: {
                        key: '138',
                      },
                      _text: '-72.02315',
                    },
                    {
                      _attributes: {
                        key: '142',
                      },
                      _text: '-0.523149999999987',
                    },
                    {
                      _attributes: {
                        key: '143',
                      },
                      _text: '-0.523149999999987',
                    },
                    {
                      _attributes: {
                        key: '145',
                      },
                      _text: '0.523149999999987',
                    },
                    {
                      _attributes: {
                        key: '146',
                      },
                      _text: '-0.523149999999987',
                    },
                    {
                      _attributes: {
                        key: '147',
                      },
                      _text: '1',
                    },
                    {
                      _attributes: {
                        key: '148',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '149',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '150',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '165',
                      },
                      _text: '-1462.4561',
                    },
                    {
                      _attributes: {
                        key: '175',
                      },
                      _text: '-1401.2814',
                    },
                    {
                      _attributes: {
                        key: '176',
                      },
                      _text: '-930.8293',
                    },
                    {
                      _attributes: {
                        key: '177',
                      },
                      _text: '-1435.461',
                    },
                    {
                      _attributes: {
                        key: '500',
                      },
                      _text: '2.7544',
                    },
                    {
                      _attributes: {
                        key: '501',
                      },
                      _text: '2.754725',
                    },
                    {
                      _attributes: {
                        key: '502',
                      },
                      _text: '0.0710250000000001',
                    },
                    {
                      _attributes: {
                        key: '503',
                      },
                      _text: '0.0571874999999995',
                    },
                    {
                      _attributes: {
                        key: '504',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '506',
                      },
                      _text: '0.2',
                    },
                    {
                      _attributes: {
                        key: '508',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '509',
                      },
                      _text: '5000',
                    },
                    {
                      _attributes: {
                        key: '510',
                      },
                      _text: '2.75723920451595',
                    },
                    {
                      _attributes: {
                        key: '511',
                      },
                      _text: '2.75592887149216',
                    },
                    {
                      _attributes: {
                        key: '512',
                      },
                      _text: '2.7543684705369',
                    },
                    {
                      _attributes: {
                        key: '513',
                      },
                      _text: '2.75392461797731',
                    },
                    {
                      _attributes: {
                        key: '514',
                      },
                      _text: '2.75513869569358',
                    },
                    {
                      _attributes: {
                        key: '515',
                      },
                      _text: '2.75489073119331',
                    },
                    {
                      _attributes: {
                        key: '516',
                      },
                      _text: '2.75508335388797',
                    },
                    {
                      _attributes: {
                        key: '517',
                      },
                      _text: '2.75526736377035',
                    },
                    {
                      _attributes: {
                        key: '518',
                      },
                      _text: '2.96135714285714',
                    },
                    {
                      _attributes: {
                        key: '519',
                      },
                      _text: '3',
                    },
                    {
                      _attributes: {
                        key: '520',
                      },
                      _text: '-1402.4154',
                    },
                    {
                      _attributes: {
                        key: '521',
                      },
                      _text: '-1014.3475',
                    },
                    {
                      _attributes: {
                        key: '522',
                      },
                      _text: '-1790.0371',
                    },
                    {
                      _attributes: {
                        key: '523',
                      },
                      _text: '0.3619',
                    },
                    {
                      _attributes: {
                        key: '524',
                      },
                      _text: '0.0675',
                    },
                    {
                      _attributes: {
                        key: '525',
                      },
                      _text: '-2.41540000000009',
                    },
                    {
                      _attributes: {
                        key: '526',
                      },
                      _text: '-419.9629',
                    },
                    {
                      _attributes: {
                        key: '527',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '528',
                      },
                      _text: '-1512.4154',
                    },
                    {
                      _attributes: {
                        key: '529',
                      },
                      _text: '-1819.9629',
                    },
                    {
                      _attributes: {
                        key: '530',
                      },
                      _text: '-980.0371',
                    },
                    {
                      _attributes: {
                        key: '531',
                      },
                      _text: '-1507.5846',
                    },
                    {
                      _attributes: {
                        key: '532',
                      },
                      _text: '-1402.4154',
                    },
                    {
                      _attributes: {
                        key: '533',
                      },
                      _text: '-1790.0371',
                    },
                    {
                      _attributes: {
                        key: '535',
                      },
                      _text: '-2099.4091',
                    },
                    {
                      _attributes: {
                        key: '540',
                      },
                      _text: '171.3090125',
                    },
                    {
                      _attributes: {
                        key: '541',
                      },
                      _text: '170.1784625',
                    },
                    {
                      _attributes: {
                        key: '542',
                      },
                      _text: '1.13055',
                    },
                    {
                      _attributes: {
                        key: '555',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '556',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '575',
                      },
                      _text: '-84.3326',
                    },
                    {
                      _attributes: {
                        key: '576',
                      },
                      _text: '-83.61015',
                    },
                    {
                      _attributes: {
                        key: '577',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '578',
                      },
                      _text: '4.41804999999999',
                    },
                    {
                      _attributes: {
                        key: '579',
                      },
                      _text: '9.07944999999998',
                    },
                    {
                      _attributes: {
                        key: '580',
                      },
                      _text: '-0.0318410243458209',
                    },
                    {
                      _attributes: {
                        key: '581',
                      },
                      _text: '-83.9742',
                    },
                    {
                      _attributes: {
                        key: '582',
                      },
                      _text: '-83.96955',
                    },
                    {
                      _attributes: {
                        key: '583',
                      },
                      _text: '-0.00464999999999804',
                    },
                    {
                      _attributes: {
                        key: '584',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '585',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '586',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '600',
                      },
                      _text: '223.61285',
                    },
                    {
                      _attributes: {
                        key: '601',
                      },
                      _text: '374.5872',
                    },
                    {
                      _attributes: {
                        key: '602',
                      },
                      _text: '152.2962',
                    },
                    {
                      _attributes: {
                        key: '603',
                      },
                      _text: '219.53625',
                    },
                    {
                      _attributes: {
                        key: '604',
                      },
                      _text: '326.06245',
                    },
                    {
                      _attributes: {
                        key: '605',
                      },
                      _text: '357.55185',
                    },
                    {
                      _attributes: {
                        key: '606',
                      },
                      _text: '340.84785',
                    },
                    {
                      _attributes: {
                        key: '607',
                      },
                      _text: '337.3536',
                    },
                    {
                      _attributes: {
                        key: '608',
                      },
                      _text: '-174.066975',
                    },
                    {
                      _attributes: {
                        key: '609',
                      },
                      _text: '266.27055',
                    },
                    {
                      _attributes: {
                        key: '610',
                      },
                      _text: '335.9601',
                    },
                    {
                      _attributes: {
                        key: '611',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '612',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '613',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '614',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '615',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '616',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '617',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '618',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '619',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '620',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '621',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '622',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '623',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '624',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '625',
                      },
                      _text: '0.00520000000000209',
                    },
                    {
                      _attributes: {
                        key: '626',
                      },
                      _text: '-0.851400000000012',
                    },
                    {
                      _attributes: {
                        key: '627',
                      },
                      _text: '134.932075',
                    },
                    {
                      _attributes: {
                        key: '628',
                      },
                      _text: '-135.748875',
                    },
                    {
                      _attributes: {
                        key: '629',
                      },
                      _text: '20.06125',
                    },
                    {
                      _attributes: {
                        key: '630',
                      },
                      _text: '-48.2598',
                    },
                    {
                      _attributes: {
                        key: '631',
                      },
                      _text: '-152.82105',
                    },
                    {
                      _attributes: {
                        key: '632',
                      },
                      _text: '224.458975',
                    },
                    {
                      _attributes: {
                        key: '633',
                      },
                      _text: '-225.674625',
                    },
                    {
                      _attributes: {
                        key: '634',
                      },
                      _text: '104.302442174115',
                    },
                    {
                      _attributes: {
                        key: '635',
                      },
                      _text: '74.3548',
                    },
                    {
                      _attributes: {
                        key: '636',
                      },
                      _text: '51.9975',
                    },
                    {
                      _attributes: {
                        key: '637',
                      },
                      _text: '90.2721',
                    },
                    {
                      _attributes: {
                        key: '638',
                      },
                      _text: '921.98505',
                    },
                    {
                      _attributes: {
                        key: '639',
                      },
                      _text: '58.39585',
                    },
                    {
                      _attributes: {
                        key: '640',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '645',
                      },
                      _text: '-1.19860000000006',
                    },
                    {
                      _attributes: {
                        key: '646',
                      },
                      _text: '-351.905625',
                    },
                    {
                      _attributes: {
                        key: '647',
                      },
                      _text: '376.326675',
                    },
                    {
                      _attributes: {
                        key: '649',
                      },
                      _text: '-1504.3316',
                    },
                    {
                      _attributes: {
                        key: '650',
                      },
                      _text: '228.64465',
                    },
                    {
                      _attributes: {
                        key: '651',
                      },
                      _text: '388.8362',
                    },
                    {
                      _attributes: {
                        key: '652',
                      },
                      _text: '154.40195',
                    },
                    {
                      _attributes: {
                        key: '653',
                      },
                      _text: '398.376675',
                    },
                    {
                      _attributes: {
                        key: '654',
                      },
                      _text: '248.6314',
                    },
                    {
                      _attributes: {
                        key: '655',
                      },
                      _text: '239.09565',
                    },
                    {
                      _attributes: {
                        key: '656',
                      },
                      _text: '-24.6562',
                    },
                    {
                      _attributes: {
                        key: '657',
                      },
                      _text: '-199.76605',
                    },
                    {
                      _attributes: {
                        key: '658',
                      },
                      _text: '356.809875',
                    },
                    {
                      _attributes: {
                        key: '659',
                      },
                      _text: '257.463075',
                    },
                    {
                      _attributes: {
                        key: '660',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '661',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '662',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '663',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '664',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '665',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '667',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '668',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '669',
                      },
                      _text: '-1.15620000000001',
                    },
                    {
                      _attributes: {
                        key: '670',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '671',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '672',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '674',
                      },
                      _text: '-2212.2107',
                    },
                    {
                      _attributes: {
                        key: '675',
                      },
                      _text: '586.3335',
                    },
                    {
                      _attributes: {
                        key: '676',
                      },
                      _text: '586.33065',
                    },
                    {
                      _attributes: {
                        key: '677',
                      },
                      _text: '587.90265',
                    },
                    {
                      _attributes: {
                        key: '678',
                      },
                      _text: '607.5709',
                    },
                    {
                      _attributes: {
                        key: '679',
                      },
                      _text: '828.2942',
                    },
                    {
                      _attributes: {
                        key: '680',
                      },
                      _text: '-390.364875',
                    },
                    {
                      _attributes: {
                        key: '681',
                      },
                      _text: '375.978775',
                    },
                    {
                      _attributes: {
                        key: '682',
                      },
                      _text: '29.9986',
                    },
                    {
                      _attributes: {
                        key: '683',
                      },
                      _text: '29.96485',
                    },
                    {
                      _attributes: {
                        key: '684',
                      },
                      _text: '-0.152456236120098',
                    },
                    {
                      _attributes: {
                        key: '685',
                      },
                      _text: '29.7444',
                    },
                    {
                      _attributes: {
                        key: '686',
                      },
                      _text: '30.7064',
                    },
                    {
                      _attributes: {
                        key: '687',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '688',
                      },
                      _text: '1.95855000000006',
                    },
                    {
                      _attributes: {
                        key: '690',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '691',
                      },
                      _text: '333.664425',
                    },
                    {
                      _attributes: {
                        key: '692',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '693',
                      },
                      _text: '-196.26375',
                    },
                    {
                      _attributes: {
                        key: '694',
                      },
                      _text: '-196.2727',
                    },
                    {
                      _attributes: {
                        key: '695',
                      },
                      _text: '-184.9765',
                    },
                    {
                      _attributes: {
                        key: '696',
                      },
                      _text: '-184.88625',
                    },
                    {
                      _attributes: {
                        key: '697',
                      },
                      _text: '-0.0902499999999975',
                    },
                    {
                      _attributes: {
                        key: '698',
                      },
                      _text: '-0.00894999999999868',
                    },
                    {
                      _attributes: {
                        key: '699',
                      },
                      _text: '-2615.5508',
                    },
                    {
                      _attributes: {
                        key: '700',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '701',
                      },
                      _text: '400.98515',
                    },
                    {
                      _attributes: {
                        key: '702',
                      },
                      _text: '402.54015',
                    },
                    {
                      _attributes: {
                        key: '703',
                      },
                      _text: '-0.131021738008239',
                    },
                    {
                      _attributes: {
                        key: '704',
                      },
                      _text: '0.131021738008239',
                    },
                    {
                      _attributes: {
                        key: '705',
                      },
                      _text: '401.74915',
                    },
                    {
                      _attributes: {
                        key: '706',
                      },
                      _text: '401.7581',
                    },
                    {
                      _attributes: {
                        key: '707',
                      },
                      _text: '-0.00894999999991342',
                    },
                    {
                      _attributes: {
                        key: '708',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '710',
                      },
                      _text: '418.69195',
                    },
                    {
                      _attributes: {
                        key: '711',
                      },
                      _text: '420.26905',
                    },
                    {
                      _attributes: {
                        key: '712',
                      },
                      _text: '-0.132883840965969',
                    },
                    {
                      _attributes: {
                        key: '713',
                      },
                      _text: '0.132883840965969',
                    },
                    {
                      _attributes: {
                        key: '714',
                      },
                      _text: '-3.12215000000003',
                    },
                    {
                      _attributes: {
                        key: '715',
                      },
                      _text: '419.459',
                    },
                    {
                      _attributes: {
                        key: '716',
                      },
                      _text: '419.40565',
                    },
                    {
                      _attributes: {
                        key: '717',
                      },
                      _text: '0.0533500000000231',
                    },
                    {
                      _attributes: {
                        key: '750',
                      },
                      _text: '577.99965',
                    },
                    {
                      _attributes: {
                        key: '751',
                      },
                      _text: '578.00225',
                    },
                    {
                      _attributes: {
                        key: '752',
                      },
                      _text: '578.00985',
                    },
                    {
                      _attributes: {
                        key: '753',
                      },
                      _text: '578.00935',
                    },
                    {
                      _attributes: {
                        key: '754',
                      },
                      _text: '578.00615',
                    },
                    {
                      _attributes: {
                        key: '755',
                      },
                      _text: '578.00515',
                    },
                    {
                      _attributes: {
                        key: '756',
                      },
                      _text: '578.0068',
                    },
                    {
                      _attributes: {
                        key: '757',
                      },
                      _text: '578.0047',
                    },
                    {
                      _attributes: {
                        key: '758',
                      },
                      _text: '578.00385',
                    },
                    {
                      _attributes: {
                        key: '759',
                      },
                      _text: '578.0032',
                    },
                    {
                      _attributes: {
                        key: '760',
                      },
                      _text: '578.00265',
                    },
                    {
                      _attributes: {
                        key: '761',
                      },
                      _text: '578.004',
                    },
                    {
                      _attributes: {
                        key: '762',
                      },
                      _text: '578.00985',
                    },
                    {
                      _attributes: {
                        key: '763',
                      },
                      _text: '578.0172',
                    },
                    {
                      _attributes: {
                        key: '764',
                      },
                      _text: '578.00785',
                    },
                    {
                      _attributes: {
                        key: '765',
                      },
                      _text: '578.011',
                    },
                    {
                      _attributes: {
                        key: '775',
                      },
                      _text: '34.99695',
                    },
                    {
                      _attributes: {
                        key: '776',
                      },
                      _text: '34.99725',
                    },
                    {
                      _attributes: {
                        key: '777',
                      },
                      _text: '34.99725',
                    },
                    {
                      _attributes: {
                        key: '778',
                      },
                      _text: '34.9974',
                    },
                    {
                      _attributes: {
                        key: '779',
                      },
                      _text: '34.9985',
                    },
                    {
                      _attributes: {
                        key: '780',
                      },
                      _text: '34.9948',
                    },
                    {
                      _attributes: {
                        key: '781',
                      },
                      _text: '34.9968',
                    },
                    {
                      _attributes: {
                        key: '782',
                      },
                      _text: '34.99915',
                    },
                    {
                      _attributes: {
                        key: '783',
                      },
                      _text: '34.99845',
                    },
                    {
                      _attributes: {
                        key: '784',
                      },
                      _text: '34.9969',
                    },
                    {
                      _attributes: {
                        key: '785',
                      },
                      _text: '34.9988',
                    },
                    {
                      _attributes: {
                        key: '786',
                      },
                      _text: '34.9967',
                    },
                    {
                      _attributes: {
                        key: '787',
                      },
                      _text: '34.9979',
                    },
                    {
                      _attributes: {
                        key: '788',
                      },
                      _text: '34.9961',
                    },
                    {
                      _attributes: {
                        key: '789',
                      },
                      _text: '34.99965',
                    },
                    {
                      _attributes: {
                        key: '790',
                      },
                      _text: '34.99705',
                    },
                    {
                      _attributes: {
                        key: '799',
                      },
                      _text: '1',
                    },
                    {
                      _attributes: {
                        key: '800',
                      },
                      _text: '124.246931823123',
                    },
                    {
                      _attributes: {
                        key: '801',
                      },
                      _text: '124.255016158189',
                    },
                    {
                      _attributes: {
                        key: '825',
                      },
                      _text: '72.1431479141472',
                    },
                    {
                      _attributes: {
                        key: '826',
                      },
                      _text: '72.1478432962802',
                    },
                    {
                      _attributes: {
                        key: '899',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '901',
                      },
                      _text: '25.4',
                    },
                    {
                      _attributes: {
                        key: '910',
                      },
                      _text: '0',
                    },
                    {
                      _attributes: {
                        key: '911',
                      },
                      _text: '-2044.8614',
                    },
                    {
                      _attributes: {
                        key: '912',
                      },
                      _text: '-1473.4264',
                    },
                    {
                      _attributes: {
                        key: '913',
                      },
                      _text: '-1566.633',
                    },
                    {
                      _attributes: {
                        key: '914',
                      },
                      _text: '0.00369999999998072',
                    },
                    {
                      _attributes: {
                        key: '915',
                      },
                      _text: '-0.000199999999949796',
                    },
                    {
                      _attributes: {
                        key: '916',
                      },
                      _text: '0.00909999999998945',
                    },
                    {
                      _attributes: {
                        key: '935',
                      },
                      _text: '-275',
                    },
                    {
                      _attributes: {
                        key: '936',
                      },
                      _text: '-2044.8651',
                    },
                    {
                      _attributes: {
                        key: '937',
                      },
                      _text: '-1473.4262',
                    },
                    {
                      _attributes: {
                        key: '938',
                      },
                      _text: '-1566.6421',
                    },
                    {
                      _attributes: {
                        key: '960',
                      },
                      _text: '-550',
                    },
                    {
                      _attributes: {
                        key: '961',
                      },
                      _text: '-2044.8688',
                    },
                    {
                      _attributes: {
                        key: '962',
                      },
                      _text: '-1473.3861',
                    },
                    {
                      _attributes: {
                        key: '963',
                      },
                      _text: '-1566.6492',
                    },
                    {
                      _attributes: {
                        key: '964',
                      },
                      _text: '-0.00369999999998072',
                    },
                    {
                      _attributes: {
                        key: '965',
                      },
                      _text: '0.0401000000001659',
                    },
                    {
                      _attributes: {
                        key: '966',
                      },
                      _text: '-0.00710000000003674',
                    },
                  ],
                },
                Execution: {
                  _attributes: {
                    dataItemId: 'execution',
                    sequence: '1880045',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: 'STOPPED',
                },
                ChuckState: {
                  _attributes: {
                    dataItemId: 'hd1chuckstate',
                    sequence: '77',
                    timestamp: '2021-06-03T22:56:45.229901Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                LineLabel: {
                  _attributes: {
                    dataItemId: 'linelabel',
                    sequence: '1880055',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
                LineNumber: {
                  _attributes: {
                    dataItemId: 'linenumber',
                    sequence: '1880056',
                    subType: 'INCREMENTAL',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
                ControllerMode: {
                  _attributes: {
                    dataItemId: 'mode',
                    sequence: '1880044',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: 'MANUAL',
                },
                SequenceNumber: {
                  _attributes: {
                    dataItemId: 'sequenceNum',
                    sequence: '69',
                    timestamp: '2021-06-03T22:56:45.229873Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                Unit: {
                  _attributes: {
                    dataItemId: 'unitNum',
                    sequence: '85',
                    timestamp: '2021-06-03T22:56:45.229942Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                WaitState: {
                  _attributes: {
                    dataItemId: 'waitstate',
                    sequence: '1755199',
                    timestamp: '2021-06-23T12:45:00.804242Z',
                  },
                  _text: 'UNAVAILABLE',
                },
              },
              Condition: {
                Normal: [
                  {
                    _attributes: {
                      dataItemId: 'motion_cond',
                      sequence: '1880036',
                      timestamp: '2021-06-29T03:52:27.553575Z',
                      type: 'MOTION_PROGRAM',
                    },
                  },
                  {
                    _attributes: {
                      dataItemId: 'path_system',
                      sequence: '1880037',
                      timestamp: '2021-06-29T03:52:27.553587Z',
                      type: 'SYSTEM',
                    },
                  },
                ],
              },
            },
            {
              _attributes: {
                component: 'Personnel',
                name: 'personnel',
                componentId: 'personnel',
              },
              Events: {
                User: {
                  _attributes: {
                    dataItemId: 'operator',
                    sequence: '110',
                    timestamp: '2021-06-03T22:56:45.230047Z',
                  },
                  _text: 'UNAVAILABLE',
                },
              },
            },
            {
              _attributes: {
                component: 'Pneumatic',
                name: 'pneumatic',
                componentId: 'pneumatic',
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'pneu_cond',
                    sequence: '1880030',
                    timestamp: '2021-06-29T03:52:27.553503Z',
                    type: 'SYSTEM',
                  },
                },
              },
            },
            {
              _attributes: {
                component: 'Stock',
                name: 'stock',
                componentId: 'procstock',
              },
              Events: {
                Material: {
                  _attributes: {
                    dataItemId: 'stock',
                    sequence: '111',
                    timestamp: '2021-06-03T22:56:45.23005Z',
                  },
                  _text: 'UNAVAILABLE',
                },
              },
            },
            {
              _attributes: {
                component: 'Environmental',
                name: 'environmental',
                componentId: 'room',
              },
              Samples: {
                Temperature: {
                  _attributes: {
                    dataItemId: 'rmtmp1',
                    sequence: '109',
                    timestamp: '2021-06-03T22:56:45.230044Z',
                  },
                  _text: 'UNAVAILABLE',
                },
              },
            },
            {
              _attributes: {
                component: 'Linear',
                name: 'Z3',
                componentId: 'w',
              },
              Samples: {
                Position: [
                  {
                    _attributes: {
                      dataItemId: 'Wabs',
                      sequence: '1878995',
                      subType: 'ACTUAL',
                      timestamp: '2021-06-29T03:31:34.004695Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                  {
                    _attributes: {
                      dataItemId: 'Wpos',
                      sequence: '1878996',
                      subType: 'ACTUAL',
                      timestamp: '2021-06-29T03:31:34.004701Z',
                    },
                    _text: 'UNAVAILABLE',
                  },
                ],
                AxisFeedrate: {
                  _attributes: {
                    dataItemId: 'Wfrt',
                    sequence: '1878957',
                    timestamp: '2021-06-29T03:31:34.004255Z',
                  },
                  _text: 'UNAVAILABLE',
                },
                Load: {
                  _attributes: {
                    dataItemId: 'Wload',
                    sequence: '1880269',
                    timestamp: '2021-06-29T03:59:25.967434Z',
                  },
                  _text: '2',
                },
                Temperature: {
                  _attributes: {
                    compositionId: 'Z3motor',
                    dataItemId: 'servotemp6',
                    sequence: '1880062',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '36',
                },
              },
              Events: {
                AxisState: {
                  _attributes: {
                    dataItemId: 'z3axisstate',
                    sequence: '64',
                    timestamp: '2021-06-03T22:56:45.229846Z',
                  },
                  _text: 'UNAVAILABLE',
                },
              },
              Condition: {
                Unavailable: {
                  _attributes: {
                    dataItemId: 'Wtravel',
                    sequence: '28',
                    timestamp: '2021-06-03T22:56:45.229701Z',
                    type: 'POSITION',
                  },
                },
              },
            },
            {
              _attributes: {
                component: 'Linear',
                name: 'X',
                componentId: 'x',
              },
              Samples: {
                AxisFeedrate: {
                  _attributes: {
                    dataItemId: 'Xfrt',
                    sequence: '1880063',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
                Load: {
                  _attributes: {
                    dataItemId: 'Xload',
                    sequence: '1880075',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '2',
                },
                Temperature: {
                  _attributes: {
                    compositionId: 'Xmotor',
                    dataItemId: 'servotemp1',
                    sequence: '1880058',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '36',
                },
              },
              Events: {
                AxisState: {
                  _attributes: {
                    dataItemId: 'xaxisstate',
                    sequence: '1880080',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: 'STOPPED',
                },
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'Xtravel',
                    sequence: '1880038',
                    timestamp: '2021-06-29T03:52:27.553599Z',
                    type: 'POSITION',
                  },
                },
              },
            },
            {
              _attributes: {
                component: 'Linear',
                name: 'Y',
                componentId: 'y',
              },
              Samples: {
                AxisFeedrate: {
                  _attributes: {
                    dataItemId: 'Yfrt',
                    sequence: '1880064',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
                Load: {
                  _attributes: {
                    dataItemId: 'Yload',
                    sequence: '1881504',
                    timestamp: '2021-06-29T05:35:13.365754Z',
                  },
                  _text: '31',
                },
                Temperature: {
                  _attributes: {
                    compositionId: 'Ymotor',
                    dataItemId: 'servotemp2',
                    sequence: '1880059',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '44',
                },
              },
              Events: {
                AxisState: {
                  _attributes: {
                    dataItemId: 'yaxisstate',
                    sequence: '1880081',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: 'STOPPED',
                },
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'Ytravel',
                    sequence: '1880039',
                    timestamp: '2021-06-29T03:52:27.553612Z',
                    type: 'POSITION',
                  },
                },
              },
            },
            {
              _attributes: {
                component: 'Linear',
                name: 'Z',
                componentId: 'z',
              },
              Samples: {
                Position: [
                  {
                    _attributes: {
                      dataItemId: 'Zabs',
                      sequence: '1880072',
                      subType: 'ACTUAL',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: '-1609.8564',
                  },
                  {
                    _attributes: {
                      dataItemId: 'Zpos',
                      sequence: '1880071',
                      subType: 'ACTUAL',
                      timestamp: '2021-06-29T03:52:27.55635Z',
                    },
                    _text: '-35.5958',
                  },
                ],
                AxisFeedrate: {
                  _attributes: {
                    dataItemId: 'Zfrt',
                    sequence: '1880065',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '0',
                },
                Load: {
                  _attributes: {
                    dataItemId: 'Zload',
                    sequence: '1880077',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '1',
                },
                Temperature: {
                  _attributes: {
                    compositionId: 'Zmotor',
                    dataItemId: 'servotemp3',
                    sequence: '1880060',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: '36',
                },
              },
              Events: {
                AxisState: {
                  _attributes: {
                    dataItemId: 'zaxisstate',
                    sequence: '1880082',
                    timestamp: '2021-06-29T03:52:27.55635Z',
                  },
                  _text: 'STOPPED',
                },
              },
              Condition: {
                Normal: {
                  _attributes: {
                    dataItemId: 'Ztravel',
                    sequence: '1880040',
                    timestamp: '2021-06-29T03:52:27.553624Z',
                    type: 'POSITION',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },
}
