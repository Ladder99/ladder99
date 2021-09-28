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
        const jobMeta = ($['%Z61.0'] || {}).value || {}

        // check if current job meta is empty string
        //. not [].value ?
        const hasCurrentJob = $['%Z61.0'] !== ''

        //. how specify printer assoc with this line? can't hardcode it like this
        // piece_count_at_print_apply: |
        //   =(<job_meta>.kit_count || 0) - (cache.get('pr1-labels_remaining').value || 0)

        // count of kits that have crossed eye1 on conveyer
        console.log(40, lookup.toString(), $)
        const kitOn = lookup($, '%Z61.5')

        // count of kits that have crossed eye2 on conveyer
        const kitOff = lookup($, '%Z61.6')

        // check if eye1 or eye2 counts changed
        const kitOnChanged = getCache('kit_on') !== kitOn
        const kitOffChanged = getCache('kit_off') !== kitOff

        if (kitOnChanged) setCache('kit_on', kitOn)
        if (kitOffChanged) setCache('kit_off', kitOff)

        // used in outputs yaml
        //. is this formula ok?
        setCache('first_eye_broken', getCache('kit_on') > 0)

        // # calculate cycle time for kit to go from eye1 to eye2
        // update_cycle_time: |
        //   =if (<kit_on_changed>) { keyvalues[<kit_on>] = { start: new Date(), end: null, delta: null} }
        if (kitOnChanged) {
          keyvalues[getCache('kit_on')] = {} //.
        }

        // cycle_time: |
        //   =if (<kit_off_changed>) {
        //     let koff = keyvalues[<kit_off>] || {};
        //     koff.end = new Date();
        //     koff.delta = koff.end - koff.start;
        //   }
        if (kitOffChanged) {
          let koff = keyvalues[kitOff] || {}
          koff.end = new Date()
          koff.delta = koff.end - koff.start
          setCache('cycle_time', koff.delta)
        }

        // # calculate average cycle time for current job
        // cycle_time_avg: |
        //   =Object.values(keyvalues).reduce((a,b)=>a+b.delta,0) / Object.values(keyvalues).length
        const cycleTimes = Object.values(keyvalues).filter(time => !!time)
        const cycleTimeAvg =
          cycleTimes.reduce((a, b) => a + b.delta, 0) / cycleTimes.length
        setCache('cycle_time_avg', cycleTimeAvg)

        // cycle_times: |
        //   =Object.entries(keyvalues).map(([key, value]) => `${key}=${value.delta}`).join(' ')
        const cycleTimeDataset = Object.entries(keyvalues)
          .map(([key, value]) => `${key}=${value}`)
          .join(' ')
        setCache('cycle_times', cycleTimeDataset)

        //. where used?
        // pieces_in_assembly: =<kit_on> - <kit_off> # kits on assy line
        // pieces_completed: =<kit_off> # kits finished
        // pieces_began: =<kit_on> # kits work began

        // # current job done, pieces remaining reached zero
        // job_complete: '%Z61.3'
        setCache('job_complete', lookup($, '%Z61.3'))

        // # compare cache to incoming data
        // job_changed: =<has_current_job> && (<job_current> !== <job_meta>.kit_number)
        const jobChanged =
          hasCurrentJob && getCache('job_current') !== jobMeta.kit_number

        // reset_key_values: =if (<job_changed>) { keyvalues = {} }
        if (jobChanged) keyvalues = {} //. work?

        // # kit assembly part number, can be empty string
        // job_current: =<job_meta>.kit_number
        if (jobChanged) setCache('job_current', jobMeta.kit_number)

        // # assign new uuid's and time on job change
        // part_uuid: '=<job_changed> ? uuid() : <part_uuid>'
        // process_uuid: '=<job_changed> ? uuid() : <process_uuid>'
        // job_start: '=<job_changed> ? new Date().toISOString() : <job_start>'
        if (jobChanged) {
          setCache('part_uuid', uuid())
          setCache('process_uuid', uuid())
          setCache('job_start', new Date().toISOString())
        }

        // salesord: =<job_meta>.sales_order_number
        setCache('salesord', jobMeta.sales_order_number)

        // # #. data coming from skid label, ChrisE needs to define address
        // # purchord: =($['%Z61.x'] || {}).purchase_order_number
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
