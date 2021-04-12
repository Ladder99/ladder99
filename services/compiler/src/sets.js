// treat these yaml elements as attributes
const attributesSet = getSet(`
id
name
nativeName
uuid
sampleInterval
manufacturer
model
serialNumber
category
type
subType
units
`)

// enclose these yaml elements as contents
const valuesSet = getSet(`
text
source
`)

// hide these yaml elements
const hiddenSet = getSet(`
id
#model
properties
sources
destinations
events
samples
conditions
value
`)

function getSet(lines) {
  return new Set(lines.trim().split('\n'))
}

const sets = {
  attributes: attributesSet,
  values: valuesSet,
  hidden: hiddenSet,
}

export default sets
