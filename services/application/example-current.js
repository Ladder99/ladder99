export default {
  MTConnectStreams: {
    Header: {
      bufferSize: 131072,
      creationTime: '2021-04-29T23:56:55Z',
      firstSequence: 1,
      instanceId: 1619740582,
      lastSequence: 155,
      nextSequence: 156,
      schemaVersion: '1.6',
      sender: 'deda552566a4',
      testIndicator: false,
      version: '1.7.0.2',
    },
    Streams: [
      {
        DeviceStream: {
          ComponentStreams: [
            {
              ComponentStream: {
                Condition: [
                  {
                    Warning: {
                      dataItemId: 'ccs-pa-001-dev_cond',
                      nativeCode: 'nativeCode',
                      nativeSeverity: 'nativeSeverity',
                      qualifier: 'QUALIFIER',
                      sequence: 151,
                      timestamp: '2021-04-29T23:56:54.895Z',
                      type: 'SYSTEM',
                      value: 'WARNING (msg here)',
                    },
                  },
                ],
                Events: [
                  {
                    AssetChanged: {
                      dataItemId: 'ccs-pa-001-asset_changed',
                      sequence: 29,
                      timestamp: '2021-04-29T23:56:22.497493Z',
                      value: 'UNAVAILABLE',
                    },
                  },
                  {
                    AssetRemoved: {
                      dataItemId: 'ccs-pa-001-asset_removed',
                      sequence: 25,
                      timestamp: '2021-04-29T23:56:22.497326Z',
                      value: 'UNAVAILABLE',
                    },
                  },
                  {
                    Availability: {
                      dataItemId: 'ccs-pa-001-connection',
                      sequence: 70,
                      timestamp: '2021-04-29T23:56:28.853Z',
                      value: 'AVAILABLE',
                    },
                  },
                  {
                    Message: {
                      dataItemId: 'ccs-pa-001-dev_msg',
                      sequence: 20,
                      timestamp: '2021-04-29T23:56:22.497234Z',
                      value: 'UNAVAILABLE',
                    },
                  },
                  {
                    FunctionalMode: {
                      dataItemId: 'ccs-pa-001-func_mode',
                      sequence: 139,
                      timestamp: '2021-04-29T23:56:50.894Z',
                      value: 'PRODUCTION',
                    },
                  },
                  {
                    Firmware: {
                      dataItemId: 'ccs-pa-001-fw_ver',
                      sequence: 71,
                      subType: 'VERSION',
                      timestamp: '2021-04-29T23:56:28.853Z',
                      value: '1.3.0.3',
                    },
                  },
                ],
                component: 'Device',
                componentId: 'ccs-pa-001',
                name: 'CCS-PA',
              },
            },
            {
              ComponentStream: {
                Events: [
                  {
                    EmergencyStop: {
                      dataItemId: 'ccs-pa-001-e_stop',
                      sequence: 152,
                      timestamp: '2021-04-29T23:56:54.895Z',
                      value: 'ARMED',
                    },
                  },
                ],
                component: 'Controller',
                componentId: 'ccs-pa-001-controller',
              },
            },
            {
              ComponentStream: {
                Condition: [
                  {
                    Normal: {
                      dataItemId: 'ccs-pa-001-end_eff_cond',
                      sequence: 153,
                      timestamp: '2021-04-29T23:56:54.896Z',
                      type: 'SYSTEM',
                    },
                  },
                ],
                Events: [
                  {
                    Message: {
                      dataItemId: 'ccs-pa-001-end_eff_message',
                      sequence: 34,
                      timestamp: '2021-04-29T23:56:22.497586Z',
                      value: 'UNAVAILABLE',
                    },
                  },
                  {
                    PartDetect: {
                      dataItemId: 'ccs-pa-001-smart_tamp_part_detect',
                      sequence: 69,
                      timestamp: '2021-04-29T23:56:28.728Z',
                      value: 'UNDEFINED',
                    },
                  },
                  {
                    ActuatorState: {
                      dataItemId: 'ccs-pa-001-tamp_air_assist',
                      sequence: 51,
                      timestamp: '2021-04-29T23:56:28.707Z',
                      value: 'INACTIVE',
                    },
                  },
                  {
                    ActuatorState: {
                      dataItemId: 'ccs-pa-001-tamp_cylinder',
                      sequence: 53,
                      timestamp: '2021-04-29T23:56:28.708Z',
                      value: 'INACTIVE',
                    },
                  },
                  {
                    ActuatorState: {
                      dataItemId: 'ccs-pa-001-tamp_vacuum',
                      sequence: 52,
                      timestamp: '2021-04-29T23:56:28.707Z',
                      value: 'INACTIVE',
                    },
                  },
                ],
                Samples: [
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-cylinder_extend_time',
                      sequence: 63,
                      subType: 'WORKING',
                      timestamp: '2021-04-29T23:56:28.721Z',
                      value: 0,
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-cylinder_home_disengage_time',
                      sequence: 62,
                      subType: 'WORKING',
                      timestamp: '2021-04-29T23:56:28.72Z',
                      value: 0,
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-cylinder_travel_time',
                      sequence: 61,
                      subType: 'WORKING',
                      timestamp: '2021-04-29T23:56:28.719Z',
                      value: 0,
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-tamp_vacuum_delay',
                      sequence: 65,
                      subType: 'DELAY',
                      timestamp: '2021-04-29T23:56:28.723Z',
                      value: 0,
                    },
                  },
                ],
                component: 'EndEffector',
                componentId: 'ccs-pa-001-end_effector',
              },
            },
            {
              ComponentStream: {
                Condition: [
                  {
                    Warning: {
                      dataItemId: 'ccs-pa-001-feed_cond',
                      nativeCode: 'nativeCode',
                      nativeSeverity: 'nativeSeverity',
                      qualifier: 'QUALIFIER',
                      sequence: 155,
                      timestamp: '2021-04-29T23:56:54.897Z',
                      type: 'SYSTEM',
                      value: 'WARNING (msg here)',
                    },
                  },
                ],
                Events: [
                  {
                    Message: {
                      dataItemId: 'ccs-pa-001-feed_message',
                      sequence: 31,
                      timestamp: '2021-04-29T23:56:22.497523Z',
                      value: 'UNAVAILABLE',
                    },
                  },
                  {
                    PartDetect: {
                      dataItemId: 'ccs-pa-001-feed_part_detect',
                      sequence: 46,
                      timestamp: '2021-04-29T23:56:28.704Z',
                      value: 'NOT_PRESENT',
                    },
                  },
                  {
                    ActuatorState: {
                      dataItemId: 'ccs-pa-001-printer_feed',
                      sequence: 147,
                      timestamp: '2021-04-29T23:56:51.882Z',
                      value: 'ACTIVE',
                    },
                  },
                  {
                    ActuatorState: {
                      dataItemId: 'ccs-pa-001-printer_pause',
                      sequence: 49,
                      timestamp: '2021-04-29T23:56:28.706Z',
                      value: 'INACTIVE',
                    },
                  },
                  {
                    ActuatorState: {
                      dataItemId: 'ccs-pa-001-printer_reprint',
                      sequence: 50,
                      timestamp: '2021-04-29T23:56:28.706Z',
                      value: 'INACTIVE',
                    },
                  },
                  {
                    ActuatorState: {
                      dataItemId: 'ccs-pa-001-printer_start_print',
                      sequence: 146,
                      timestamp: '2021-04-29T23:56:51.881Z',
                      value: 'ACTIVE',
                    },
                  },
                  {
                    ActuatorState: {
                      dataItemId: 'ccs-pa-001-web_take_up_motor_state',
                      sequence: 54,
                      timestamp: '2021-04-29T23:56:28.711Z',
                      value: 'INACTIVE',
                    },
                  },
                ],
                Samples: [
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-idle_time',
                      sequence: 58,
                      subType: 'DELAY',
                      timestamp: '2021-04-29T23:56:28.715Z',
                      value: 0,
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-print_signal_time',
                      sequence: 64,
                      subType: 'DELAY',
                      timestamp: '2021-04-29T23:56:28.722Z',
                      value: 0,
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-print_time',
                      sequence: 60,
                      subType: 'WORKING',
                      timestamp: '2021-04-29T23:56:28.717Z',
                      value: 25,
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-printer_end_print_wait',
                      sequence: 67,
                      subType: 'DELAY',
                      timestamp: '2021-04-29T23:56:28.725Z',
                      value: 3,
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-printer_start_print_duration',
                      sequence: 66,
                      subType: 'DELAY',
                      timestamp: '2021-04-29T23:56:28.724Z',
                      value: 0.1,
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-product_sensor_one_debounce',
                      sequence: 68,
                      subType: 'DELAY',
                      timestamp: '2021-04-29T23:56:28.726Z',
                      value: 0,
                    },
                  },
                  {
                    Unknown: {
                      dataItemId: 'ccs-pa-001-product_sensor_one_edge_trigger',
                      sequence: 26,
                      timestamp: '2021-04-29T23:56:22.497338Z',
                      value: 'UNAVAILABLE',
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-transport_time',
                      sequence: 59,
                      subType: 'DELAY',
                      timestamp: '2021-04-29T23:56:28.716Z',
                      value: 0.0008429,
                    },
                  },
                ],
                component: 'Feeder',
                componentId: 'ccs-pa-001-feeder',
              },
            },
            {
              ComponentStream: {
                Events: [
                  {
                    Program: {
                      dataItemId: 'ccs-pa-001-program',
                      sequence: 73,
                      subType: 'MAIN',
                      timestamp: '2021-04-29T23:56:28.854Z',
                      value: 'PGM0',
                    },
                  },
                  {
                    Execution: {
                      dataItemId: 'ccs-pa-001-state',
                      sequence: 148,
                      timestamp: '2021-04-29T23:56:54.889Z',
                      value: 'PROGRAM_STOPPED',
                    },
                  },
                  {
                    Block: {
                      dataItemId: 'ccs-pa-001-step',
                      sequence: 149,
                      timestamp: '2021-04-29T23:56:54.89Z',
                      value: 'CYCLE_START',
                    },
                  },
                  {
                    WaitState: {
                      dataItemId: 'ccs-pa-001-wait_state',
                      sequence: 10,
                      timestamp: '2021-04-29T23:56:22.497121Z',
                      value: 'UNAVAILABLE',
                    },
                  },
                ],
                Samples: [
                  {
                    ClockTime: {
                      dataItemId: 'ccs-pa-001-clk_time',
                      sequence: 75,
                      timestamp: '2021-04-29T23:56:28.855Z',
                      value: 1609809706.1826477,
                    },
                  },
                  {
                    Count: {
                      dataItemId: 'ccs-pa-001-cycle_count',
                      sequence: 56,
                      timestamp: '2021-04-29T23:56:28.713Z',
                      value: 100,
                    },
                  },
                  {
                    ProcessTimer: {
                      dataItemId: 'ccs-pa-001-cycle_time',
                      sequence: 138,
                      subType: 'PROCESS',
                      timestamp: '2021-04-29T23:56:50.893Z',
                      value: 5,
                    },
                  },
                  {
                    Count: {
                      dataItemId: 'ccs-pa-001-fault_count',
                      sequence: 57,
                      timestamp: '2021-04-29T23:56:28.714Z',
                      value: 5,
                    },
                  },
                  {
                    Count: {
                      dataItemId: 'ccs-pa-001-life_count',
                      sequence: 55,
                      timestamp: '2021-04-29T23:56:28.712Z',
                      value: 1000,
                    },
                  },
                  {
                    EquipmentTimer: {
                      dataItemId: 'ccs-pa-001-up_time',
                      sequence: 76,
                      subType: 'OPERATING',
                      timestamp: '2021-04-29T23:56:28.855Z',
                      value: 691322.50763624,
                    },
                  },
                ],
                component: 'Path',
                componentId: 'ccs-pa-001-path1',
                name: 'path',
              },
            },
            {
              ComponentStream: {
                Events: [
                  {
                    User: {
                      dataItemId: 'ccs-pa-001-operator',
                      sequence: 106,
                      subType: 'OPERATOR',
                      timestamp: '2021-04-29T23:56:39.173Z',
                      value: 'AMANDA DAVIS',
                    },
                  },
                ],
                component: 'Personnel',
                componentId: 'ccs-pa-001-personnel',
              },
            },
          ],
          name: 'CCS-PA',
          uuid: 'e05363af-95d1-4354-b749-8fbb09d3499e',
        },
      },
    ],
  },
}
