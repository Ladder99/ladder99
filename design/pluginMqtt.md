```mermaid
sequenceDiagram

participant device as Device
participant broker as MQTT Broker
participant adapter as Adapter
participant plugin as MQTT Plugin
participant cache as Cache
participant agent as Agent
participant user as User

device -->> broker: registers with
adapter -->> plugin: init
plugin -->> broker: subscribes
broker -->> plugin: acknowledges
device -->> broker: mqtt msg
broker -->> plugin: mqtt msg
plugin -->> cache: set('pok', 'lkm')
cache -->> agent: <timestamp>|foo|bar
agent -->> user: XML <DataItem/>

```
