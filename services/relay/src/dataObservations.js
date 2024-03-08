// Observations
// read current and sample endpoints and write data to db.
// called from agentReader.

import { Data } from './data.js'
import * as treeObservations from './treeObservations.js'

// Observations - stores an array of observations - current or sample
export class Observations extends Data {
  //
  constructor(type, agent) {
    super()
    this.type = type // used by read method - will be 'current' or 'sample'
    this.agent = agent
    this.observations = null // array of dataitems
  }

  // read dataitem values from current/sample endpoints as xml/js tree,
  // convert .jsTree to .observations (flat list of elements).
  // parameters are (endpoint) or (endpoint, from, count)
  async read() {
    // super.read will return false if gets an xml error message
    if (!(await super.read(...arguments))) return false // see base class in data.js

    // get flat list of observations from xml tree
    // observations is [{ tag, dataItemId, name, timestamp, value }, ...]
    // eg [{
    //   tag: 'Availability',
    //   dataItemId: 'm1-avail',
    //   name: 'availability',
    //   sequence: '30',
    //   timestamp: '2021-09-14T17:53:21.414Z',
    //   value: 'AVAILABLE'
    // }, ...]
    this.observations = treeObservations.getNodes(this.jsTree, this.agent)

    // sort observations by timestamp asc, for correct state machine transitions.
    // because sequence nums could be out of order, depending on network.
    this.observations.sort((a, b) => a.timestampSecs - b.timestampSecs)

    return true
  }

  // write values from this.observations to db
  async write(db, indexes) {
    //
    // assign device_id and dataitem_id's to observations
    // treeObservations.assignNodeIds(this.observations, indexes)
    treeObservations.addElementInfo(this.observations, indexes)

    // get history records to write to db
    // observations is now [{ device_id, dataitem_id, tag, dataItemId, name, timestamp, value }, ...]
    //. records is
    const records = this.getHistoryRecords(this.observations)

    // write all records to db
    return await db.addHistory(records)
  }

  /**
   * Get a cached condition index
   *
   * @param {{
   *     time: Date,
   *     resolvedTime: Date | null,
   *     nodeId: number,
   *     dataitemId: number | string,
   *     state: string,
   *     type: string,
   *     conditionId: string | null,
   *     nativeCode: string | null,
   *     nativeSeverity: string | null,
   *     qualifier: string | null,
   *     message: string | null
   *   }} condition - Condition of a node
   *
   * @returns {number | undefined} - The index of a condition in a node
   */
  getCachedConditionIndex(condition) {
    // Invalid input should return `undefined`
    !condition || !Object.keys(condition).some(i => (i === 'conditionId' || i === 'nativeCode') && condition[i])
    if (Object.prototype.toString.call(condition) !== '[object Object]') {
      return undefined
    }

    if (condition.nodeId in this.conditionCache) {
      const cachedConditions = this.conditionCache[condition.nodeId]

      for (const cachedConditionIdx in cachedConditions) {
        const cachedCondition = cachedConditions[cachedConditionIdx]

        // Check if the condition is already active
        // Note: In MTConnect model v2.3, `conditionId` was added to identify a condition which should be the preferred. Conditions in older MTConnect model versions, however, still need to be identified using `nativeCode` and `dataitemId`.
        if (
          condition?.conditionId === cachedCondition?.conditionId
          || !('conditionId' in condition)
          && condition.dataitemId === cachedCondition.dataitemId
          && condition.nativeCode === cachedCondition.nativeCode
        ) {
          return +cachedConditionIdx
        }
      }
    }

    return undefined
  }

  /**
   * Build up an array of history records to write
   *
   * @remarks This method filters observations down to dataitems we're interested in and converts values to a proper JS datatype.
   *
   * @todo The source of of `@param` is annotated with property comments with all seen property values. We might want to improve the property types to allow only selected string values, however that needs to be verified.
   *
   * @see {@link https://stackoverflow.com/a/63167970/243392|this SO answer}
   *
   * @param {({
   *          assetType?: string,  // 'UNAVAILABLE'
   *          category?: string,  // 'CONDITION' | 'EVENT' | 'SAMPLE'
   *          count?: string,  // `${number}`
   *          dataItemId: string,  // '*_asset_chg' | '*_asset_count' | '*_asset_rem' | '*_avail' | '*_condition' | '*_pcc' | 'agent_*_asset_chg' | 'agent_*_asset_count' | 'agent_*_asset_rem' | 'agent_avail' | 'device_added' | 'device_changed' | 'device_removed' | 'ox003_sharcs_adapter_software_version' | 'ox003_sharcs_adapter_uri' | 'ox003_sharcs_asset_update_rate' | 'ox003_sharcs_connection_status' | 'ox003_sharcs_mtconnect_version' | 'ox003_sharcs_observation_update_rate'
   *          dataitem_id?: number,
   *          device_id?: number,
   *          name?: string,  // 'availability' | 'partcount'
   *          sequence: string,  // `${number}`
   *          statistic?: string,  // 'AVERAGE'
   *          subType?: string,  // 'COMPLETE'
   *          tag: string,  // 'AdapterSoftwareVersion' | 'AdapterURI' | 'AssetChanged' | 'AssetCountDataSet' | 'AssetRemoved' | 'AssetUpdateRate' | 'Availability' | 'ConnectionStatus' | 'DeviceAdded' | 'DeviceChanged' | 'DeviceRemoved' | 'MTConnectVersion' | 'Normal' | 'ObservationUpdateRate' | 'PartCount'
   *          timestamp: string,  // `${Date.toISOString()}`
   *          type?: string,  // 'SYSTEM'
   *          uid: string,  // 'Main/*_asset_chg' | 'Main/*_asset_count' | 'Main/*_asset_rem' | 'Main/*_avail' | 'Main/*_condition' | 'Main/*_pcc' | 'Main/agent_*_asset_chg' | 'Main/agent_*_asset_count' | 'Main/agent_*_asset_rem' | 'Main/agent_avail' | 'Main/device_added' | 'Main/device_changed' | 'Main/device_removed' | 'Main/ox003_sharcs_adapter_software_version' | 'Main/ox003_sharcs_adapter_uri' | 'Main/ox003_sharcs_asset_update_rate' | 'Main/ox003_sharcs_connection_status' | 'Main/ox003_sharcs_mtconnect_version' | 'Main/ox003_sharcs_observation_update_rate'
   *          value?: string  // '00000000-0000-0000-1337-409151d72b38' | 'AVAILABLE' | 'ESTABLISHED' | 'UNAVAILABLE' | 'mqtt://mosquitto:1883'
   *        })[]} observations - Observations
   *
   * @returns {({
   *          dataitem_id: number,
   *          node_id: number,
   *          time: string,
   *          value: number | string
   *        })[]}
   */
  getHistoryRecords(observations) {
    if (!Array.isArray(observations)) {
      console.warn(`[getHistoryRecords] WARN The following value was set to 'observations', but it is not an array:`, observations)
      return []
    }
    const records = []
    for (let obs of observations) {
      if (obs.dataitem_id) {
        // obs.value is always string, due to the way the xml is stored, like <value>10</value>
        // use dataitem category to convert to number
        // ie SAMPLES are numeric, EVENTS are strings
        //. convert 'UNAVAILABLE' samples to null?
        //. keep in mind that conditions can have >1 value also
        // const value = Number(obs.value) || JSON.stringify(obs.value) // bug: this converted 0's to "0" - should have used ?? operator
        // try to convert to number - if not, convert to a json string, eg 'AVAILABLE' -> '"AVAILABLE"'
        const nval = Number(obs.value) // try convert to number //. what if value is 'UNAVAILABLE' or null? then get NaN or 0 (!)
        // const value = Number.isNaN(nval) ? JSON.stringify(obs.value) : nval
        const useNumber = obs.category === 'SAMPLE' && !Number.isNaN(nval)
        const value = useNumber ? nval : JSON.stringify(obs.value)
        const record = {
          node_id: obs.device_id,
          dataitem_id: obs.dataitem_id,
          time: obs.timestamp,
          value: obs.category === 'CONDITION' ? JSON.stringify(obs.tag) : value, // number or string - written as jsonb value
        }
        records.push(record)
      }
    }
    return records
  }
}

