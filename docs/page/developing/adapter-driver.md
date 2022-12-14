# Adapter Driver

To develop a new adapter driver, eg for a device named 'foo', first we'll need a new setup to do some development with - 

```
l99 init test-foo
```

Then start the driver code file - from the `ladder99` main folder -

```
touch services/adapter/src/drivers/foo.js
```

Then start a schema in the setup (the schema tells the driver what data to read from the device) -

```
mkdir -p setups/test-foo/volumes/adapter/schemas/foo
touch setups/test-foo/volumes/adapter/schemas/foo/inputs.yaml
touch setups/test-foo/volumes/adapter/schemas/foo/outputs.yaml
```

In the `agent.xml` we'll want a dataitem for availability and some other value, so add 

```
    <!-- Foo1 -->
    <!-- id must match that in setup.yaml -->
    <!-- name must match that in setup.yaml and agent.cfg -->
    <!-- uuid generated with uuidgen -->
    <!-- uuids MUST be unique in this file, or agent will die without error in run mode -->
    <Device id="f1" name="Foo1" uuid="e081ceaf-23cf-497c-8ab3-381dfc7c700c">
      <DataItems>
        <DataItem id="f1-avail" name="availability" category="EVENT" type="AVAILABILITY" />
        <DataItem id="f1-value1" category="SAMPLE" type="x:VALUE1" />
      </DataItems>
    </Device>
```

In `inputs.yaml`, add

```
inputs:
  - key: value1
    address: 0
```

In `outputs.yaml`, add

```
outputs:
  - key: avail
  - key: value1
```

The driver will read the inputs.yaml file to know what to read, will write the values to the Adapter cache, and the cache will output the value as SHDR to the Agent. 


In `setup.yaml`, add

```
    - id: f1 # must match id in agent.xml
      name: Foo1 # this must match name in agent.cfg and agent.xml
      sources:
        - driver: foo # adapter plugin - manages protocol and payload
          schema: foo # schema defines inputs and outputs with yaml files
          connect:
            host: 10.1.10.130 # address to foo device
      outputs:
        agent:
          host: adapter # must match agent.cfg value
          port: 7910 # must match agent.cfg value
```

In `agent.cfg`, add

```
  Foo1 {
    Host = adapter
    Port = 7910
  }
```

