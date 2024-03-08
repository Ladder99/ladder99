import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { Observations } from './dataObservations'

describe('Observations', () => {
  let observations

  beforeEach(() => {
    observations = new Observations()
  })

  describe('cacheConditions()', () => {
    let observations

    beforeAll(() => {
      observations = new Observations()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    describe('invalid input', () => {
      it('should not cache anything for `null`', () => {
        expect.assertions(2)

        const totalConditionsNumberBefore = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)
        expect(observations.cacheConditions(null)).toBe(undefined)
        const totalConditionsNumberAfter = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)

        expect(totalConditionsNumberBefore).toBe(totalConditionsNumberAfter)
      })

      it('should not cache anything for `undefined`', () => {
        expect.assertions(2)
        const totalConditionsNumberBefore = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)
        expect(observations.cacheConditions(undefined)).toBe(undefined)
        const totalConditionsNumberAfter = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)

        expect(totalConditionsNumberBefore).toBe(totalConditionsNumberAfter)
      })

      it('should not cache anything for a string', () => {
        expect.assertions(2)
        const totalConditionsNumberBefore = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)
        expect(observations.cacheConditions('test')).toBe(undefined)
        const totalConditionsNumberAfter = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)

        expect(totalConditionsNumberBefore).toBe(totalConditionsNumberAfter)
      })

      it('should not cache anything for a number', () => {
        expect.assertions(2)
        const totalConditionsNumberBefore = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)
        expect(observations.cacheConditions(1)).toBe(undefined)
        const totalConditionsNumberAfter = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)

        expect(totalConditionsNumberBefore).toBe(totalConditionsNumberAfter)
      })

      it('should not cache anything for a boolean', () => {
        expect.assertions(2)
        const totalConditionsNumberBefore = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)
        expect(observations.cacheConditions(true)).toBe(undefined)
        const totalConditionsNumberAfter = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)

        expect(totalConditionsNumberBefore).toBe(totalConditionsNumberAfter)
      })

      it('should not cache anything for an empty object', () => {
        expect.assertions(2)
        const totalConditionsNumberBefore = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)
        expect(observations.cacheConditions({})).toBe(undefined)
        const totalConditionsNumberAfter = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)

        expect(totalConditionsNumberBefore).toBe(totalConditionsNumberAfter)
      })

      it('should not cache anything for an empty array', () => {
        expect.assertions(2)
        const totalConditionsNumberBefore = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)
        expect(observations.cacheConditions([])).toBe(undefined)
        const totalConditionsNumberAfter = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)

        expect(totalConditionsNumberBefore).toBe(totalConditionsNumberAfter)
      })

      it('should not cache anything when neither `conditionId` nor `nativeCode` is defined', () => {
        expect.assertions(2)
        jest.replaceProperty(observations, 'conditionCache', {})

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        const totalConditionsNumberBefore = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)
        expect(observations.cacheConditions(condition)).toBe(undefined)
        const totalConditionsNumberAfter = Object.keys(observations['conditionCache']).reduce((a, c) => observations['conditionCache'][c].length, 0)

        expect(totalConditionsNumberBefore).toBe(totalConditionsNumberAfter)
      })
    })

    describe('cache updates', () => {
      it('should add a new item with `nativeCode` to cache if it is not there yet', () => {
        expect.assertions(2)
        jest.replaceProperty(observations, 'conditionCache', {})

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: null,
          nativeCode: '345',
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        expect(observations.cacheConditions(condition)).toBe('insert')
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(1)
      })

      it('should add a new item with `conditionId` to cache if it is not there yet', () => {
        expect.assertions(2)
        jest.replaceProperty(observations, 'conditionCache', {})

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: '3',
          nativeCode: null,
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        expect(observations.cacheConditions(condition)).toBe('insert')
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(1)
      })

      it('should not add a new item with `nativeCode` to cache if it is already there', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: null,
              nativeCode: '345',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: null,
          nativeCode: '345',
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        expect(observations.cacheConditions(condition)).toBe(undefined)
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(1)
      })

      it('should not add a new item with `conditionId` to cache if it is already there', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: '1',
              nativeCode: null,
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: '1',
          nativeCode: null,
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        expect(observations.cacheConditions(condition)).toBe(undefined)
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(1)
      })

      it('should append a condition to cache array when it is not yet cached with `conditionId`', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: '1',
              nativeCode: null,
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 172,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: '1',
          nativeCode: null,
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        expect(observations.cacheConditions(condition)).toBe('insert')
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(1)
      })

      it('should append a condition to cache array when it is not yet cached with `nativeCode`', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: null,
              nativeCode: '345',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 172,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: null,
          nativeCode: '345',
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        expect(observations.cacheConditions(condition)).toBe('insert')
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(1)
      })

      it('should not cache a condition when it is already cached with `conditionId` and with the same `state`', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: '1',
              nativeCode: null,
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = observations['conditionCache'][173][0]

        expect(observations.cacheConditions(condition)).toBe(undefined)
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(1)
      })

      it('should not cache a condition when it is already cached with `nativeCode` and with the same `state`', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: null,
              nativeCode: '344',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = observations['conditionCache'][173][0]

        expect(observations.cacheConditions(condition)).toBe(undefined)
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(1)
      })

      it('should remove a condition from cache array when it is already cached with `conditionId`, but with `state` changed to `Normal`', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: '1',
              nativeCode: null,
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          ...observations['conditionCache'][173][0],
          time: new Date('2024-03-02T15:05:34.729Z'),
          state: 'Normal',
        }

        expect(observations.cacheConditions(condition)).toBe('update')
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(0)
      })

      it('should remove a condition from cache array when it is already cached with `nativeCode`, but with `state` changed to `Normal`', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: null,
              nativeCode: '344',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          ...observations['conditionCache'][173][0],
          time: new Date('2024-03-02T15:05:34.729Z'),
          state: 'Normal',
        }

        expect(observations.cacheConditions(condition)).toBe('update')
        expect(observations['conditionCache']?.[condition.nodeId]?.length).toBe(0)
      })

      it('should update a condition in cache array when it is already cached with `conditionId`, but with `state` changed to a state other than `Normal`', () => {
        expect.assertions(6)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: '1',
              nativeCode: null,
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          ...observations['conditionCache'][173][0],
          time: new Date('2024-03-02T15:05:34.729Z'),
          state: 'Warning',
        }

        const conditionsNumberBefore = observations['conditionCache'][condition.nodeId]?.length
        expect(observations.cacheConditions(condition)).toBe('update')
        const conditionsNumberAfter = observations['conditionCache'][condition.nodeId]?.length

        expect(observations['conditionCache'][condition.nodeId].length).toBe(1)
        expect(observations['conditionCache'][condition.nodeId].length).toBe(conditionsNumberBefore)
        expect(conditionsNumberAfter).toBe(conditionsNumberBefore)
        expect(observations['conditionCache'][condition.nodeId][0].time).toBe(condition.time)
        expect(observations['conditionCache'][condition.nodeId][0].state).toBe(condition.state)
      })

      it('should update a condition in cache array when it is already cached with `nativeCode`, but with `state` changed to a state other than `Normal`', () => {
        expect.assertions(6)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: null,
              nativeCode: '334',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          ...observations['conditionCache'][173][0],
          time: new Date('2024-03-02T15:05:34.729Z'),
          state: 'Warning',
        }

        const conditionsNumberBefore = observations['conditionCache'][condition.nodeId]?.length
        expect(observations.cacheConditions(condition)).toBe('update')
        const conditionsNumberAfter = observations['conditionCache'][condition.nodeId]?.length

        expect(observations['conditionCache'][condition.nodeId].length).toBe(1)
        expect(observations['conditionCache'][condition.nodeId].length).toBe(conditionsNumberBefore)
        expect(conditionsNumberAfter).toBe(conditionsNumberBefore)
        expect(observations['conditionCache'][condition.nodeId][0].time).toBe(condition.time)
        expect(observations['conditionCache'][condition.nodeId][0].state).toBe(condition.state)
      })
    })
  })

  describe('getCachedConditionIndex()', () => {
    let observations

    beforeAll(() => {
      observations = new Observations()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    describe('invalid input', () => {
      it('should return `undefined` for `null`', () => {
        expect.assertions(1)
        expect(observations.getCachedConditionIndex(null)).toBe(undefined)
      })

      it('should return `undefined` for `undefined`', () => {
        expect.assertions(1)
        expect(observations.getCachedConditionIndex(undefined)).toBe(undefined)
      })

      it('should return `undefined` for a string', () => {
        expect.assertions(1)
        expect(observations.getCachedConditionIndex('test')).toBe(undefined)
      })

      it('should return `undefined` for a number', () => {
        expect.assertions(1)
        expect(observations.getCachedConditionIndex(1)).toBe(undefined)
      })

      it('should return `undefined` for a boolean', () => {
        expect.assertions(1)
        expect(observations.getCachedConditionIndex(true)).toBe(undefined)
      })

      it('should not cache anything for an empty object', () => {
        expect.assertions(1)
        expect(observations.getCachedConditionIndex({})).toBe(undefined)
      })

      it('should not cache anything for an empty array', () => {
        expect.assertions(1)
        expect(observations.getCachedConditionIndex([])).toBe(undefined)
      })

      it('should return `undefined` when neither `conditionId` nor `nativeCode` is defined', () => {
        expect.assertions(1)

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        expect(observations.getCachedConditionIndex(condition)).toBe(undefined)
      })
    })

    describe('valid input', () => {
      it('should return `undefined` when no condition is cached', () => {
        expect.assertions(2)

        expect(observations.getCachedConditionIndex({
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: null,
          nativeCode: '345',
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        })).toBe(undefined)

        expect(Object.keys(observations['conditionCache'])).toHaveLength(0)
      })

      it('should return `undefined` when the condition is not yet cached, but the same `conditionId` is cached for another node', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          205: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 205,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: '1',
              nativeCode: null,
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        expect(observations.getCachedConditionIndex({
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: '1',
          nativeCode: null,
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        })).toBe(undefined)

        expect(Object.keys(observations['conditionCache']).length).toBeGreaterThan(0)
      })

      it('should return `undefined` when the condition is not yet cached, but the same `nativeCode` is cached for another node', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          205: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 205,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: null,
              nativeCode: '234',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        expect(observations.getCachedConditionIndex({
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: null,
          nativeCode: '234',
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        })).toBe(undefined)

        expect(Object.keys(observations['conditionCache']).length).toBeGreaterThan(0)
      })

      it('should return a `conditionCache` array index of the condition when the condition is already cached with `nativeCode` defined', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: null,
              nativeCode: '345',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_temp_cond',
              state: 'Warning',
              type: 'SYSTEM',
              conditionId: null,
              nativeCode: '131',
              nativeSeverity: 'warning',
              qualifier: null,
              message: 'Test temp alarm message',
            },
          ],
          254: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 254,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: null,
              nativeCode: '345',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: null,
          nativeCode: '345',
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        const idx = observations.getCachedConditionIndex(condition)

        expect(idx).toBe(0)
        expect(observations['conditionCache'][condition.nodeId][idx]).toStrictEqual(condition)
      })

      it('should return a `conditionCache` array index of the condition when the condition is already cached with `conditionId` defined', () => {
        expect.assertions(2)

        jest.replaceProperty(observations, 'conditionCache', {
          173: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: '345',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 173,
              dataitemId: 'test_temp_cond',
              state: 'Warning',
              type: 'SYSTEM',
              conditionId: '131',
              nativeSeverity: 'warning',
              qualifier: null,
              message: 'Test temp alarm message',
            },
          ],
          254: [
            {
              time: new Date('2024-03-02T14:05:34.729Z'),
              resolvedTime: null,
              nodeId: 254,
              dataitemId: 'test_cond',
              state: 'Fault',
              type: 'SYSTEM',
              conditionId: '345',
              nativeSeverity: 'error',
              qualifier: null,
              message: 'Test alarm message',
            },
          ],
        })

        const condition = {
          time: new Date('2024-03-02T14:05:34.729Z'),
          resolvedTime: null,
          nodeId: 173,
          dataitemId: 'test_cond',
          state: 'Fault',
          type: 'SYSTEM',
          conditionId: '345',
          nativeSeverity: 'error',
          qualifier: null,
          message: 'Test alarm message',
        }

        const idx = observations.getCachedConditionIndex(condition)

        expect(idx).toBe(0)
        expect(observations['conditionCache'][condition.nodeId][idx]).toStrictEqual(condition)
      })
    })
  })

  describe('getHistoryRecords()', () => {
    describe('invalid observations', () => {
      it('should return an empty array when no observation has `dataitem_id` property', () => {
        expect.assertions(1)

        expect(observations.getHistoryRecords([{
          category: 'CONDITION',
          dataItemId: '48e7290b1184_condition',
          device_id: 751,
          sequence: '51',
          tag: 'Normal',
          timestamp: '2024-02-25T03:13:36.67177Z',
          type: 'SYSTEM',
          uid: 'Main/48e7290b1184_condition',
        }])).toStrictEqual([])
      })

      it('should return an empty array when no observation has `dataitem_id` property', () => {
        expect.assertions(1)

        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {
        })
        const obs = {
          category: 'CONDITION',
          dataItemId: '48e7290b1184_condition',
          dataitem_id: 774,
          device_id: 751,
          sequence: '51',
          tag: 'Normal',
          timestamp: '2024-02-25T03:13:36.67177Z',
          type: 'SYSTEM',
          uid: 'Main/48e7290b1184_condition',
        }

        observations.getHistoryRecords(obs)

        expect(warn).toHaveBeenCalledWith(`[getHistoryRecords] WARN The following value was set to 'observations', but it is not an array:`, obs)
      })
    })

    describe('test `value` type conversion', () => {
      it('should be converted to number when `category` is `SAMPLE` and `value` is a number stored as a string', () => {
        expect.assertions(1)

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
          value: '111',
        }])).toStrictEqual([
          {
            dataitem_id: 771,
            node_id: 769,
            time: '2024-02-25T03:05:44.384587Z',
            value: 111,
          },
        ])
      })

      it('should be converted to JSON string', () => {
        expect.assertions(1)

        expect(observations.getHistoryRecords([{
          dataItemId: 'ox003_sharcs_adapter_uri',
          dataitem_id: 743,
          device_id: 111,
          sequence: '9',
          tag: 'AdapterURI',
          timestamp: '2024-02-25T03:05:44.384387Z',
          uid: 'Main/ox003_sharcs_adapter_uri',
          value: 'mqtt://mosquitto:1883',
        }])).toStrictEqual([
          {
            dataitem_id: 743,
            node_id: 111,
            time: '2024-02-25T03:05:44.384387Z',
            value: '"mqtt://mosquitto:1883"',
          },
        ])
      })
    })

    describe('test the value for `CONDITION` category', () => {
      it('should be set to the `tag` value', () => {
        expect.assertions(1)

        expect(observations.getHistoryRecords([{
          category: 'CONDITION',
          dataItemId: '48e7290b1184_condition',
          dataitem_id: 1201,
          device_id: 751,
          sequence: '51',
          tag: 'Normal',
          timestamp: '2024-02-25T03:13:36.67177Z',
          type: 'SYSTEM',
          uid: 'Main/48e7290b1184_condition',
        }])).toStrictEqual([
          {
            dataitem_id: 1201,
            node_id: 751,
            time: '2024-02-25T03:13:36.67177Z',
            value: '"Normal"',
          },
        ])
      })
    })
  })
})