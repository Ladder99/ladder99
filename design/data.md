# data

## compilation: yamls to devices.xml

eg outputs.yaml includes:

    - key: dev_cond
      category: CONDITION
      type: SYSTEM
      value: "<status-has-hard-faults> ? 'FAULT' : <status-has-soft-faults> ? 'WARNING' : 'NORMAL'"

compiles to

devices.xml:

    <DataItem category="CONDITION" type="SYSTEM" id="ccs-pa-001-dev_cond"/>

so it's up to the adapter to send shdr, like

    "2021-04-14T03:04:00.000Z|ccs-pa-001-dev_cond|WARNING"

actually, for a condition you need more info - 

    const level = value // eg 'WARNING'
    const nativeCode = 'NativeCode'
    const nativeSeverity = 'NativeSeverity'
    const qualifier = 'Qualifier'
    const message = 'Message'
    shdr = `${timestamp}|${key}|${level}|${nativeCode}|${nativeSeverity}|${qualifier}|${message}`

eg

    "2021-04-14T03:04:00.000Z|ccs-pa-001-dev_cond|WARNING|warn|warning|um|ribbon low"

how get that?


## mqtt messages

device sends json over mqtt - currently handled by mqtt-ccs.js.

handle initial query message (nothing relevant to faults here):

    for (const item of msg.payload) {
      const [address, ...others] = item.keys // eg '%I0.10' and ['IN11', 'safety.e_stop', 'J3.P12', 'SX1.P10']
      const key = `${deviceId}-${address}` // eg 'ccs-pa-001-%I0.10'
      item.value = item.default // use default value, if any
      cache.set(key, item) // note: this will cause cache to publish shdr
      // add other keys to aliases
      for (const alias of others) {
        const key2 = `${deviceId}-${alias}` // eg 'ccs-pa-001-safety.e_stop'
        aliases[key2] = item
      }
    }

handle status messages:

    const parts = `connection,state,program,step,faults,cpu_time,utc_time,build_no,_ts`.split(',')
    for (const part of parts) {
      const key = `${deviceId}-status-${part}` // eg 'ccs-pa-001-status-faults'
      const item = { value: msg.payload[part] }
      cache.set(key, item) // note: this will cause cache to publish shdr
    }


simulator-mqtt sends data from messages.js, which has:

    {
      topic: 'l99/${deviceId}/evt/status',
      json: {
        connection: 'online',
        state: 400, // 200 stopped, 400 running
        program: 'pgm0',
        step: 'Waiting',
        faults: {},
        cpu_time: 691322.50763624,
        utc_time: 1.6098097061826477e9,
        build_no: '1.3.0.3',
        _ts: 1609809706196, // msec since 1970-01-01
      },
    },

which causes

    cache.set('ccs-pa-001-status-faults', { value: {} })

but nothing depends on status-faults, eh?





inputs.yaml:


#note: each item's id will be {deviceId}-{key}, eg 'ccs-pa-001-status-connection'

    inputs:
      topics:
        l99/${deviceId}/evt/status:
          - key: status-faults
            path: $.faults

          - key: status-has-soft-faults
            path: Object.keys($.faults).some(f => f>='50')

          - key: status-has-hard-faults
            path: Object.keys($.faults).some(f => f<'50')



so 


