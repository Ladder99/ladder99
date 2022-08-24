# data

## compilation: model yamls to devices.xml

outputs.yaml includes this dataItem for device condition:

    - key: dev_cond
      category: CONDITION
      type: SYSTEM
      value: "<status-has-hard-faults> ? 'FAULT' : <status-has-soft-faults> ? 'WARNING' : 'NORMAL'"

which compiles to this in devices.xml:

    <DataItem category="CONDITION" type="SYSTEM" id="pa1-dev_cond"/>

note that id=deviceId-key

so it's up to the adapter to send SHDR to match, ieg

    "2021-04-14T03:04:00.000Z|id|value"
    "2021-04-14T03:04:00.000Z|pa1-dev_cond|WARNING"

actually, since it's a a condition you need more info -

    const level = value // eg 'WARNING'
    const nativeCode = 'nativeCode'
    const nativeSeverity = 'nativeSeverity'
    const qualifier = 'qualifier'
    const message = 'condition message'
    shdr = `${timestamp}|${key}|${level}|${nativeCode}|${nativeSeverity}|${qualifier}|${message}`

eg

    "2021-04-14T03:04:00.000Z|pa1-dev_cond|WARNING|warn|warning|um|ribbon low"

> > how get all that?

## mqtt messages

the device sends json over mqtt - currently handled by adapter.js and mqtt-json.js.

### adapter.js initializes the cache with dependencies

    addOutputs(outputs, socket) {
      for (const output of outputs) {
        output.socket = socket // attach tcp socket to each output also
        for (const key of output.dependsOn) {
          if (this._mapKeyToOutputs[key]) {
            this._mapKeyToOutputs[key].push(output)
          } else {
            this._mapKeyToOutputs[key] = [output]
          }
        }
      }
    }

so for the previous dataItem example, adapter.js gets the following output object -

    {
      id: 'pa1-dev_cond',
      category: 'CONDITION',
      value: cache => eval("cache.get('pa1-status-has-hard-faults').value ? 'FAULT' : cache.get('pa1-status-has-soft-faults').value ? 'WARNING': 'NORMAL'")
      dependsOn: ['pa1-status-has-hard-faults', 'pa1-status-has-soft-faults']
    }

when a cache value in dependsOn changes, it should trigger the corresponding shdr output calculated from the value fn.

it does this by adding the dependsOn keys to a map linking to the dependent calcs -

    this._mapKeyToOutputs['pa1-status-has-hard-faults'] = [ output ]
    this._mapKeyToOutputs['pa1-status-has-soft-faults'] = [ output ]

### handle initial query message (nothing relevant to faults here)

mqtt-json.js plugin has

    for (const item of msg.payload) {
      const [address, ...others] = item.keys // eg '%I0.10' and ['IN11', 'safety.e_stop', 'J3.P12', 'SX1.P10']
      const key = `${deviceId}-${address}` // eg 'pa1-%I0.10'
      item.value = item.default // use default value, if any
      cache.set(key, item) // note: this will cause cache to publish shdr
      // add other keys to aliases, so user can refer to any of them
      for (const alias of others) {
        const key2 = `${deviceId}-${alias}` // eg 'pa1-safety.e_stop'
        aliases[key2] = item
      }
    }

## handle status messages

mqtt-json.js plugin has

    const parts = `connection,state,program,step,faults,cpu_time,utc_time,build_no,_ts`.split(',')
    for (const part of parts) {
      const key = `${deviceId}-status-${part}` // eg 'pa1-status-faults'
      const item = { value: msg.payload[part] }
      cache.set(key, item) // note: this will cause cache to publish shdr
    }

so simulator-mqtt sends data from messages.js, which has:

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

    cache.set('pa1-status-faults', { value: {} })

another message has:

      faults: {
        50: { description: 'soft fault', hard: false, count: 1 },
      },

    cache.set('pa1-status-faults', { value: { 50: { description: 'soft fault', hard: false, count: 1 }} })

but nothing currently depends on status-faults, so added some custom code -

    const $ = msg.payload
    cache.set(`${deviceId}-status-has-soft-faults`, { value: Object.keys($.faults).some(f => f >= '50') })
    cache.set(`${deviceId}-status-has-hard-faults`, { value: Object.keys($.faults).some(f => f < '50') })

so for this mqtt message,

    cache.set('pa1-status-has-soft-faults', { value: true })
    cache.set('pa1-status-has-hard-faults', { value: false })

the relevant calculation has

    {
      id: 'pa1-dev_cond',
      category: 'CONDITION',
      value: cache => eval("cache.get('pa1-status-has-hard-faults').value ? 'FAULT' : cache.get('pa1-status-has-soft-faults').value ? 'WARNING': 'NORMAL'")
      dependsOn: ['pa1-status-has-hard-faults', 'pa1-status-has-soft-faults']
    }

so 5000 has

    Condition
    Timestamp	Type	Sub Type	Name	Id	Sequence	Value
    2021-04-14T08:33:42.694Z	Fault			pa1-dev_cond	334	condition message

## inputs.yaml

so we'd like to go from a custom code plugin for mqtt-ccs to data-defined inputs.

    inputs:
      topics:
        l99/${deviceId}/evt/status:
          - key: status-faults
            path: $.faults

          - key: status-has-soft-faults
            path: Object.keys($.faults).some(f => f>='50')

          - key: status-has-hard-faults
            path: Object.keys($.faults).some(f => f<'50')

each item's id will be {deviceId}-{key}, eg 'pa1-status-faults'

so what will adapter.js do?

it'll load inputs.yaml -> js arrays

load mqtt-json.js plugin
on init plugin, pass these topics and inputs, and it would subscribe to those topics.

> q. would need to send initial message to kick things off - how specify that?
> hardcode for now, then specify it in inputs.yaml?

for each message received it'll go through the relevant inputs and set the cache key-item pairs.

> maybe a hybrid approach for now would be good -

ie use mqtt-ccs.js plugin, but pass inputs.yaml js to it also on init

then would use those for the alias list
?
