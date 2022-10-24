# Ladder99 Adapter

The Ladder99 Adapter converts machine data to SHDR representation and sends it on to the Ladder99 Agent. It has plugins for different datasources, eg MQTT.

The core component is the cache - dataitems are written there, then calculations are run on the cache items and output to SHDR.

Entrypoint is src/index.js.
