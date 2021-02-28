
PLC4X communicates with old machines via proprietary protocols

MQTT is a simple publish/subscribe message protocol

Aedes is a node-based mqtt broker (like mosquitto)

MTConnect Adapter is our node-based adapter, which subscribes to the mqtt broker for certain topics, translates them to SHDR, and sends them on to the MTConnect Agent via the unidirectional diode.

SHDR is Simple Hierarchical Data Representation, eg "2021-02-28T02:40:00|key|value"



