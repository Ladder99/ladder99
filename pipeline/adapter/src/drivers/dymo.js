// dymo m10 scale driver

// adapted from https://gist.github.com/PhantomRay/cbccda0d3ab9a9f42d7346cc378d808b
// and https://github.com/null-none/python-dymo-scale/blob/master/dymo/scale.py

import HID from 'node-hid' // see https://github.com/node-hid/node-hid
import usb from 'usb' // see https://github.com/tessel/node-usb

const pollInterval = 1000 // msec
const reconnectInterval = 5000 // msec

const vendorId = 0x0922
const productId = 0x8003
const dataModeGrams = 2
const dataModeOunces = 11

export class AdapterDriver {
  init({ deviceId, protocol, host, port, cache, inputs, socket }) {
    console.log(`Initialize Dymo M10 driver...`)

    const devices = usb.getDeviceList()
    console.log('USB devices attached:', devices.length)

    let reading = false
    let timer = null

    // startReading()

    // keep trying to connect to scale
    // note: readme says
    // Cost of HID.devices() and new HID.HID() for detecting device plug/unplug -
    // Both HID.devices() and new HID.HID() are relatively costly, each causing a
    // USB(and potentially Bluetooth) enumeration. This takes time and OS
    // resources. Doing either can slow down the read / write that you do in
    // parallel with a device, and cause other USB devices to slow down too.
    // This is how USB works.
    //. If you are polling HID.devices() or doing repeated new HID.HID(vid,pid)
    // to detect device plug / unplug, consider instead using node-usb-detection.
    // node-usb-detection uses OS-specific, non-bus enumeration ways to
    // detect device plug / unplug.
    setInterval(startReading, reconnectInterval)

    usb.on('attach', function (device) {
      if (
        device.deviceDescriptor.idVendor === vendorId &&
        device.deviceDescriptor.idProduct === productId
      ) {
        console.log('Dymo M10 attached')
        timer = setInterval(startReading, pollInterval)
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
        timer = null
      }
    })

    function startReading() {
      if (reading) return
      try {
        const device = new HID.HID(vendorId, productId)

        console.log('Starting to read data from scale')
        reading = true

        device.on('data', function (data) {
          const buffer = Buffer.from(data)
          const mass = buffer[4] + 256 * buffer[5]

          let grams = 0
          if (buffer[2] === dataModeOunces) {
            const scalingFactor = Math.pow(10, data[3] - 256)
            const ounces = mass * scalingFactor
            grams = ounces * 0.035274
          } else if (buffer[2] === dataModeGrams) {
            grams = mass
          }

          const kg = grams / 1000
          // console.log(new Date().toISOString() + ': ' + kg + ' kg')
          cache.set(`${deviceId}-mass`, { value: kg })
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
  }
}
