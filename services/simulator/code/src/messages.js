// note: topics must match those in adapter's transform.js
// %I0 and %Q0 are as of 2019-09-01 per chris

const messages = [
  {
    topic: 'l99/${serialNumber}/evt/query',
    json: [
      {
        keys: ['%I0.0', 'IN1', 'printer.ribbon_low', 'J2.1', 'SX1.P0'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.1', 'IN2', 'printer.service_required', 'J2.2', 'SX1.P1'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.2', 'IN3', 'printer.print_end', 'J2.3', 'SX1.P2'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.3', 'IN4', 'printer.media_out', 'J2.4', 'SX1.P3'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.4', 'IN5', 'printer.ribbon_out', 'J2.P5', 'SX1.P4'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.5', 'IN6', 'printer.data_ready', 'J2.P6', 'SX1.P5'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.6', 'IN7', 'product.sensor_one', 'J1.12', 'SX1.P6'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.7', 'IN8', 'tamp.head_up', 'J1.11', 'SX1.P7'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.8', 'IN9', 'web.media_low', 'J1.10', 'SX1.P8'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.9', 'IN10', 'tamp.smart_tamp', 'J1.9', 'SX1.P9'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.10', 'IN11', 'safety.e_stop', 'J3.P12', 'SX1.P10'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.11', 'IN12', 'product.sensor_aux', 'J1.8', 'SX1.P11'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.12', 'IN13'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.13', 'IN14'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.14', 'IN15', 'SX1.P14'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%I0.15', 'IN16', 'SX1.P15'],
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },

      {
        keys: ['%Q0.0', 'OUT1', 'printer.start_print', 'J2.7', 'SX2.P0'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.1', 'OUT2', 'printer.feed', 'J2.8', 'SX2.P1'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.2', 'OUT3', 'printer.pause', 'J2.9', 'SX2.P2'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.3', 'OUT4', 'printer.reprint', 'J2.10', 'SX2.P3'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.4', 'OUT5', 'tamp.cylinder', 'J6.1', 'SX2.P4'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.5', 'OUT6', 'tamp.vacuum', 'J6.2', 'SX2.P5'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.6', 'OUT7', 'tamp.air_assist', 'J6.3', 'SX2.P6'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.7', 'OUT8', 'J6.4', 'SX2.P7', 'J6.spare1'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.8', 'OUT9', 'J6.5', 'SX2.P8', 'J6.spare2'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.9', 'OUT10', 'andon.green', 'J3.P7', 'SX2.P9'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.10', 'OUT11', 'andon.yellow', 'J3.P8', 'SX2.P10'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.11', 'OUT12', 'andon.red', 'J3.P9', 'SX2.P11'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.12', 'OUT13', 'SX2.P12'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.13', 'OUT14', 'SX2.P13'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.14', 'OUT15', 'SX2.P14'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q0.15', 'OUT16', 'SX2.P15'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },

      {
        keys: ['%Q1.0', 'web.take_up_motor_state'],
        remote_allow: false,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%Q1.1', 'web.take_up_motor_duty'],
        remote_allow: true,
        default: 88,
        constrain: {
          type: 'range',
          value: [0, 99],
          step: 1,
        },
      },
      {
        keys: ['%Q1.2', 'web.take_up_motor_hz'],
        remote_allow: true,
        default: 2000,
        constrain: {
          type: 'range',
          value: [0, 10000],
          step: 1,
        },
      },
      {
        keys: ['%V55.0'],
        remote_allow: false,
        default: 'print_job',
      },
      {
        keys: ['%V55.1'],
        remote_allow: false,
        default: 'wait_for_sensor_one',
      },
      {
        keys: ['%V55.2'],
        remote_allow: false,
        default: 'apply_label',
      },
      {
        keys: ['%V55.3'],
        remote_allow: false,
        default: 'wait_for_printer_data_ready',
      },

      {
        keys: ['%M55.0', 'metric.life_count'],
        remote_allow: false,
        retain: true,
        default: 1000,
      },
      {
        keys: ['%M55.1', 'metric.cycle_count'],
        remote_allow: true,
        retain: true,
        default: 100,
      },
      {
        keys: ['%M55.2', 'metric.fault_count'],
        remote_allow: false,
        retain: false,
        default: 5,
      },
      {
        keys: ['%M55.3', 'metric.idle_time'],
        remote_allow: false,
        retain: false,
        default: 0,
        rate_limit: 500,
      },
      {
        keys: ['%M55.4', 'metric.transport_time'],
        remote_allow: false,
        retain: false,
        default: 0.0008429,
        rate_limit: 500,
      },
      {
        keys: ['%M55.5', 'metric.printer_time'],
        remote_allow: false,
        retain: false,
        default: 0,
        rate_limit: 50,
      },
      {
        keys: ['%M55.6', 'metric.labels_applied'],
        remote_allow: false,
        retain: false,
        default: 0,
      },
      {
        keys: ['%M55.7', 'metric.cylinder_travel_time'],
        remote_allow: false,
        retain: false,
        default: 0,
        rate_limit: 500,
      },

      {
        keys: ['%M56.0', 'tamp.vacuum.delay'],
        remote_allow: true,
        default: 0.0,
        constrain: {
          type: 'range',
          value: [0.0, 2.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.1', 'printer.start_print.duration'],
        remote_allow: true,
        default: 0.1,
        constrain: {
          type: 'range',
          value: [0.01, 0.5],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.2', 'printer.end_print.wait'],
        remote_allow: true,
        default: 3.0,
        constrain: {
          type: 'range',
          value: [0.0, 25.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.3', 'product.sensor_one.edge'],
        remote_allow: true,
        default: 'trailing',
        constrain: {
          type: 'choice',
          value: ['trailing', 'leading'],
        },
      },
      {
        keys: ['%M56.4', 'product.sensor_one.debounce'],
        remote_allow: true,
        default: 0.0,
        constrain: {
          type: 'range',
          value: [0.0, 5.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.5', 'product.sensor_one.delay'],
        remote_allow: true,
        default: 0.0,
        constrain: {
          type: 'range',
          value: [0.0, 99.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.6', 'tamp.cylinder.extend_duration'],
        remote_allow: true,
        default: 0.1,
        constrain: {
          type: 'range',
          value: [0.0, 99.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.7', 'tamp.cylinder.travel_duration'],
        remote_allow: true,
        default: 1.5,
        constrain: {
          type: 'range',
          value: [0.0, 250.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.8', 'tamp.head_up.wait_duration'],
        remote_allow: true,
        default: 0.2,
        constrain: {
          type: 'range',
          value: [0.0, 5.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.9', 'multi_feed.count'],
        remote_allow: true,
        default: 1,
        constrain: {
          type: 'range',
          value: [1, 9],
          step: 1,
        },
      },
      {
        keys: ['%M56.10', 'multi_feed.delay'],
        remote_allow: true,
        default: 0.0,
        constrain: {
          type: 'range',
          value: [0.0, 2.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.11', 'product.sensor_aux.enabled'],
        remote_allow: true,
        default: 0,
        constrain: {
          type: 'choice',
          value: [0, 1],
        },
      },
      {
        keys: ['%M56.12', 'product.sensor_aux.edge'],
        remote_allow: true,
        default: 'trailing',
        constrain: {
          type: 'choice',
          value: ['trailing', 'leading'],
        },
      },
      {
        keys: ['%M56.13', 'product.sensor_aux.debounce'],
        remote_allow: true,
        default: 0.0,
        constrain: {
          type: 'range',
          value: [0.0, 5.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.14', 'product.sensor_aux.delay'],
        remote_allow: true,
        default: 0.0,
        constrain: {
          type: 'range',
          value: [0.0, 99.0],
          step: 0.001,
        },
      },
      {
        keys: ['%M56.15', 'operating_mode'],
        remote_allow: true,
        default: 'apply_after_feed',
        constrain: {
          type: 'choice',
          value: ['apply_before_feed', 'apply_after_feed'],
        },
      },
    ],
  },

  {
    topic: 'l99/${serialNumber}/evt/status',
    json: {
      connection: 'online',
      state: 400, // 200 stopped, 400 running
      program: 'pgm0',
      step: 'step1',
      faults: {},
      cpu_time: 691322.50763624,
      utc_time: 1.6098097061826477e9,
      build_no: '1.3.0.3',
      _ts: 1609809706196, // msec since 1970-01-01
    },
  },

  {
    topic: 'l99/${serialNumber}/evt/read',
    json: [
      { address: '%Q0.0', value: 1 },
      { address: '%Q0.1', value: 1 },
    ],
  },

  {
    topic: 'l99/${serialNumber}/evt/read',
    json: { address: '%I0.10', value: 1 }, // emerg stop
  },

  {
    topic: 'l99/${serialNumber}/evt/status',
    json: {
      connection: 'online',
      state: 200, // 200 stopped, 400 running
      program: 'pgm0',
      step: 'step1',
      faults: {
        1: { description: 'hard fault', hard: true, count: 1 },
        50: { description: 'soft fault', hard: false, count: 1 },
      },
      cpu_time: 691322.50763624,
      utc_time: 1.6098097061826477e9,
      build_no: '1.3.0.3',
      _ts: 1609809706196, // msec since 1970-01-01
    },
  },
]

export default messages
