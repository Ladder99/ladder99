// job-parts driver
// handles processes with jobs that have parts - calculate cycle times etc

// import libmqtt from 'mqtt' // see https://www.npmjs.com/package/mqtt
import { v4 as uuid } from 'uuid' // see https://github.com/uuidjs/uuid - may be used by inputs/outputs yaml js
import { AdapterDriver as MqttJson } from '../mqtt-json.js'

export class AdapterDriver {
  // initialize the client plugin
  // queries the device for address space definitions, subscribes to topics.
  // inputs is the inputs.yaml file parsed to a js tree.
  // note: types IS used - by the part(cache, $) fn evaluation
  init({ deviceId, deviceName, host, port, cache, inputs, types }) {
    console.log('Initializing job-parts driver for', { deviceId })

    const mqttJson = new MqttJson()

    let keyvalues = {}

    //. lookup will either use .default or .value - careful
    const advice = {
      inputs: ({ $, lookup }) => {
        console.log('advice', $)

        setCache('procname', 'KITTING')

        // get job meta data from kit label
        //. use .default here? .value?
        const jobMeta = ($['%Z61.0'] || {}).value || {}

        // check if current job meta is empty string
        //. not [].value ?
        const hasCurrentJob = $['%Z61.0'] !== ''

        //. how specify printer assoc with this line? can't hardcode it like this
        // piece_count_at_print_apply: |
        //   =(<job_meta>.kit_count || 0) - (cache.get('pr1-labels_remaining').value || 0)

        // kit counts
        const kitOn = lookup($, '%Z61.5').value // kits crossed eye1
        const kitOff = lookup($, '%Z61.6').value // kits crossed eye2
        const kitOnChanged = getCache('kit_on') !== kitOn
        const kitOffChanged = getCache('kit_off') !== kitOff
        setCache('kit_on', kitOn)
        setCache('kit_off', kitOff)

        // start cycle_time timer
        if (kitOnChanged && kitOn) {
          keyvalues[kitOn] = {
            start: new Date(),
            end: null,
            delta: null,
          }
          console.log(keyvalues)
        }

        // cycle_time - from eye1 to eye2
        if (kitOffChanged && kitOff) {
          let koff = keyvalues[kitOff] || {}
          koff.end = new Date()
          koff.delta = koff.end - koff.start
          setCache('cycle_time', koff.delta)
          console.log(keyvalues)
        }

        // cycle_time_avg - for current job
        const cycleTimes = Object.values(keyvalues).filter(
          value => !!value.delta
        )
        if (cycleTimes.length > 0) {
          const cycleTimeAvg =
            cycleTimes.reduce((a, b) => a + b.delta, 0) / cycleTimes.length
          setCache('cycle_time_avg', cycleTimeAvg)
        }

        // cycle_times - dataset for debugging
        // const cycleTimeDataset = Object.entries(keyvalues)
        //   .filter((k, v) => !!v)
        //   .map(([key, value]) => `${key}=${value.delta}`)
        //   .join(' ')
        // setCache('cycle_times', cycleTimeDataset)

        //. estimated completion time

        // first_eye_broken - used in outputs yaml
        setCache('first_eye_broken', getCache('kit_on') > 0) //. calc ok?

        //. where used?
        // pieces_in_assembly: =<kit_on> - <kit_off> # kits on assy line
        // pieces_completed: =<kit_off> # kits finished
        // pieces_began: =<kit_on> # kits work began

        // current job done, pieces remaining reached zero
        setCache('job_complete', lookup($, '%Z61.3').value)

        // compare cache to incoming data
        //. does outputs yaml need this also?
        const jobChanged =
          hasCurrentJob && getCache('job_current') !== jobMeta.kit_number

        if (jobChanged) {
          // reset keyvalues for cycle times
          keyvalues = {} //. ok?

          // kit assembly part number, can be empty string
          setCache('job_current', jobMeta.kit_number)

          // assign new uuid's and time
          setCache('part_uuid', uuid())
          setCache('process_uuid', uuid())
          setCache('job_start', new Date().toISOString())
        }

        setCache('salesord', jobMeta.sales_order_number)

        //. data coming from skid label, ChrisE needs to define address
        // purchord: =($['%Z61.x'] || {}).purchase_order_number
      },
    }

    mqttJson.init({
      deviceId,
      deviceName,
      host,
      port,
      cache,
      inputs,
      types,
      advice,
    })

    function getCache(key) {
      return (cache.get(`${deviceId}-${key}`) || {}).value
    }
    function setCache(key, value) {
      cache.set(`${deviceId}-${key}`, { value })
    }
  }
}
