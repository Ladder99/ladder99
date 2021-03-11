// note: topics must match those in adapter's transform.js
const messages = [
  {
    topic: 'l99/ccs/evt/status',
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
    topic: 'l99/ccs/evt/read',
    json: [
      { address: '%Q0.0', value: 1 },
      { address: '%Q0.1', value: 1 },
      { address: '%Q0.2', value: 1 },
      { address: '%Q0.3', value: 1 },
      { address: '%Q0.4', value: 1 },
      { address: '%Q0.5', value: 1 },
    ],
  },
  {
    topic: 'l99/ccs/evt/read',
    json: { address: '%Q0.6', value: 1 },
  },
  {
    topic: 'l99/ccs/evt/status',
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
