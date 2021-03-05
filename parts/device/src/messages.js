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
      { address: '%Q0.1', keys: ['OUT2', 'output.2'], value: 0 },
      { address: '%Q0.7', keys: ['OUT8', 'output.8'], value: 1 },
    ],
  },
  {
    topic: 'l99/ccs/evt/read',
    json: { address: '%Q0.7', keys: ['OUT8', 'output.8'], value: 0 },
  },
]

export default messages
