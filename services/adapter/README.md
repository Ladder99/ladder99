# ladder99-adapter

MTConnect Adapter - NodeJS program with plugins for different datasources.

Plugins convert from machine data to SHDR representation, send on to MTConnect Agent.

The core component is the cache - dataitems are written there, then calculations are run on the cache items and output to SHDR.
