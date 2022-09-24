import { Autoprune } from '../autoprune.js'
import { params } from '../params.js'
import * as lib from '../common/lib.js'

params.setupFolder = 'src/test'

const db = { query: () => {} }
const setup = lib.readSetup(params.setupFolder)

const autoprune = new Autoprune(params, db, setup)
autoprune.start()
