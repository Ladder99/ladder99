import { updateMetrics } from './metrics.js'

const db = null
const observations = [{}]
const currentDimensionValues = {}
const startTimes = {}

updateMetrics(db, observations, currentDimensionValues, startTimes)
