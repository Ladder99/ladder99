// dymo m10 scale driver

// adapted from https://gist.github.com/PhantomRay/cbccda0d3ab9a9f42d7346cc378d808b

import HID from 'node-hid' // see https://github.com/node-hid/node-hid
import usb from 'usb' // see https://github.com/tessel/node-usb

const interval = 1000 // msec

const vendorId = 0x0922
const productId = 0x8003

let reading = false
let timer

// try to connect to the scale if available
startReading()

usb.on('attach', function (device) {
  if (
    device.deviceDescriptor.idVendor === vendorId &&
    device.deviceDescriptor.idProduct === productId
  ) {
    console.log('Dymo M10 attached')
    timer = setInterval(startReading, interval)
  }
})

usb.on('detach', function (device) {
  if (
    device.deviceDescriptor.idVendor === vendorId &&
    device.deviceDescriptor.idProduct === productId
  ) {
    console.log('Dymo M10 detached')
    reading = false
    clearInterval(timer)
  }
})

function startReading() {
  if (reading) return
  try {
    const device = new HID.HID(vendorId, productId)

    console.log('Starting to read data from scale')
    reading = true

    device.on('data', function (data) {
      const buf = Buffer.from(data)
      const grams = buf[4] + 256 * buf[5]
      console.log(new Date().toISOString() + ': ' + grams + ' grams')
    })

    device.on('error', function (error) {
      console.log(error)
      reading = false
      device.close()
    })
  } catch (err) {
    if (/cannot open device/.test(err.message)) {
      console.log('Dymo M10 cannot be found')
    } else {
      console.log(err)
    }
  }
}
