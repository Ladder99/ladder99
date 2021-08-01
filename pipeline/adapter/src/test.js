// test adapter

import { Cache } from './cache.js'
import { AdapterDriver } from './drivers/cpc.js'
import * as common from './common.js'

console.log(Cache)
console.log(AdapterDriver)

const source = {
  model: 'asc/econoclave',
  driver: 'cpc', // type of adapter plugin - manages protocol and payload
  protocol: 'tcp',
  host: '10.20.30.101',
  port: '9999',
}

// console.log(source)

const { model } = source

async function main() {
  const plugin = new AdapterDriver()
  console.log(plugin)

  const pathInputs = `../../models/${model}/inputs.yaml`
  console.log(`Reading ${pathInputs}...`)
  const inputs = common.importYaml(pathInputs) || {}
  console.log(inputs)

  const pathOutputs = `../../models/${model}/outputs.yaml`
  console.log(`Reading ${pathOutputs}...`)
  const outputTemplates = (common.importYaml(pathOutputs) || {}).outputs
  console.log(outputTemplates)
}

main()
