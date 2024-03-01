import { jest } from '@jest/globals'

import { Observations } from './dataObservations'

describe('dataObservations', () => {
  let observations

  beforeAll(() => {
    observations = new Observations()
  })

  describe('getHistoryRecords()', () => {
    describe('general tests', () => {
      it('should return an empty array when no observation has `dataitem_id` property', () => {
        expect(observations.getHistoryRecords([{
          category: 'CONDITION',
          dataItemId: '48e7290b1184_condition',
          device_id: 751,
          sequence: '51',
          tag: 'Normal',
          timestamp: '2024-02-25T03:13:36.67177Z',
          type: 'SYSTEM',
          uid: 'Main/48e7290b1184_condition'
        }])).toStrictEqual([])
      })

      it('should return an empty array when no observation has `dataitem_id` property', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation((m) => {})
        const obs = {
          category: 'CONDITION',
          dataItemId: '48e7290b1184_condition',
          dataitem_id: 774,
          device_id: 751,
          sequence: '51',
          tag: 'Normal',
          timestamp: '2024-02-25T03:13:36.67177Z',
          type: 'SYSTEM',
          uid: 'Main/48e7290b1184_condition'
        }

        observations.getHistoryRecords(obs)

        expect(warn).toHaveBeenCalledWith(`[getHistoryRecords] WARN The following value was set to 'observations', but it is not an array:`, obs)
      })
    })

    describe('test `value` type conversion', () => {
      it('should be converted to number when `category` is `SAMPLE` and `value` is a number stored as a string', () => {
        expect(observations.getHistoryRecords([{
          category: 'SAMPLE',
          dataItemId: '409151d72b38_pcc',
          dataitem_id: 771,
          device_id: 769,
          name: 'partcount',
          sequence: '31',
          subType: 'COMPLETE',
          tag: 'PartCount',
          timestamp: '2024-02-25T03:05:44.384587Z',
          uid: 'Main/409151d72b38_pcc',
          value: '111'
        }])).toStrictEqual([
          {
            dataitem_id: 771,
            node_id: 769,
            time: '2024-02-25T03:05:44.384587Z',
            value: 111
          }
        ])
      })

      it('should be converted to JSON string', () => {
        expect(observations.getHistoryRecords([{
          dataItemId: 'ox003_sharcs_adapter_uri',
          dataitem_id: 743,
          device_id: 111,
          sequence: '9',
          tag: 'AdapterURI',
          timestamp: '2024-02-25T03:05:44.384387Z',
          uid: 'Main/ox003_sharcs_adapter_uri',
          value: 'mqtt://mosquitto:1883'
        }])).toStrictEqual([
          {
            dataitem_id: 743,
            node_id: 111,
            time: '2024-02-25T03:05:44.384387Z',
            value: '"mqtt://mosquitto:1883"'
          }
        ])
      })
    })

    describe('test the value for `CONDITION` category', () => {
      it('should be set to the `tag` value', () => {
        expect(observations.getHistoryRecords([{
          category: 'CONDITION',
          dataItemId: '48e7290b1184_condition',
          dataitem_id: 1201,
          device_id: 751,
          sequence: '51',
          tag: 'Normal',
          timestamp: '2024-02-25T03:13:36.67177Z',
          type: 'SYSTEM',
          uid: 'Main/48e7290b1184_condition'
        }])).toStrictEqual([
          {
            dataitem_id: 1201,
            node_id: 751,
            time: '2024-02-25T03:13:36.67177Z',
            value: '"Normal"'
          }
        ])
      })
    })
  })
})