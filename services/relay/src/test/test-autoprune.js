import { Autoprune } from '../autoprune.js'
import { params } from '../params.js'
import * as lib from '../common/lib.js'

params.setupFolder = 'src/test'

const db = { query: () => console.log('db.query not implemented') }
const setup = lib.readSetup(params.setupFolder)

const autoprune = new Autoprune(params, db, setup)
autoprune.start()
