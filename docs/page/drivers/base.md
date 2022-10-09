<!-- 
---
title: base-driver
description: common concepts across all standalone drivers
published: true
date: 2022-02-02T04:06:48.201Z
tags: 
editor: markdown
dateCreated: 2021-08-15T02:36:09.751Z
---
 -->

# Base Driver

## Overview

`base-driver` is a framework for creating drivers for complex interfaces or data transformation tasks.  This guide will walk you through the framework concepts, components, and their purpose.

## Source

[Github Repository](https://github.com/Ladder99/base-driver)

## Concepts

### Platform

`Platform` is not part of the `base-driver` package, but is rather implemented as part of individual drivers to support communication with the native data source.  

* Methods inside `Platform` implementations faciliate communication with the data source via a local `Machine` instance reference.
* `Platform` methods are invoked by a `Collector` instance.  
* No data source transformation logic should occur inside the `Platform` implementation.
* `Veneer` classes are responsible for transformation logic.

#### Example: factoryio-driver

Retrieve all tags from FactoryIO instance.

```csharp
public async Task<dynamic> GetTagsAsync()
{
		var request = new RestRequest("tags", DataFormat.Json);
		var response = await _machine.Client.ExecuteGetAsync(request);

		return JArray.Parse(response.Content);
}
```

Write tags to FactoryIO instance.

```csharp
public async Task<dynamic> WriteTagsByNameAsync(string tag_array)
{
		var request = new RestRequest("tag/values/by-name", Method.PUT, DataFormat.Json);
		request.AddParameter("application/json", tag_array, ParameterType.RequestBody);
		var response = await _machine.Client.ExecuteAsync(request);

		return JArray.Parse(response.Content);
}
```

#### Example: opcxmlda-driver

Retrieve multiple items from an OPC XML-DA server.

```csharp
public dynamic ReadMultipleTags(List<dynamic> descriptors)
{
    DAVtqResult[] results = null;
    
    NativeDispatchReturn ndr = nativeDispatch(() =>
    {
         results = _machine.Client.ReadMultipleItems(
            new ServerDescriptor { UrlString = _machine.OpcxmldaEndpoint.URI },
            Array.ConvertAll(descriptors.ToArray(),
                new Converter<dynamic, DAItemDescriptor>(item =>
                    new DAItemDescriptor( (string)((Dictionary<object, object>.KeyCollection)item.Keys) .ElementAt(0))
                )));
        
        return true;
    });
    
    var nr = new
    {
        invocationMs = ndr.ElapsedMilliseconds,
        request = new {read_multiple_tags = new {descriptors}},
        response = new {read_multiple_tags = new {results}}
    };
    
    _logger.Trace($"[{_machine.Id}] Platform invocation result:\n{JObject.FromObject(nr).ToString()}");

    return nr;
}
```

#### Example: fanuc-driver

Retrieve machine identifier from Fanuc controller.

```csharp
public dynamic CNCId()
{
    uint[] cncid = new uint[4];

    NativeDispatchReturn ndr = nativeDispatch(() =>
    {
        return (Focas.focas_ret) Focas.cnc_rdcncid(_handle, cncid);
    });

    var nr = new
    {
        method = "cnc_rdcncid",
        invocationMs = ndr.ElapsedMilliseconds,
        doc = "https://ladder99.github.io/fanuc-driver/focas/SpecE/Misc/cnc_rdcncid",
        success = ndr.RC == Focas.EW_OK,
        rc = ndr.RC,
        request = new {cnc_rdcncid = new { }},
        response = new {cnc_rdcncid = new {cncid}}
    };
    
    _logger.Trace($"[{_machine.Id}] Platform invocation result:\n{JObject.FromObject(nr).ToString()}");

    return nr;
}
```

### Machine

A `Machine` instance includes:  

* native connectivity information and setup (from `config.yaml`)
* data source access (`Platform`)
* data output post-processor (`Handler`)
* data collection strategy (`Collector`)
* data transformations (`Veneer`)

Drivers extend the `Machine` class to provide functionality unique to the data source.  

A concrete `Machine` type, including assembly name, is referenced in the configuration at path `machines[id].type`.  Example: `l99.driver.fanuc.FanucMachine, fanuc`.

#### Example: factoryio-driver

Communication protocol configuration and HTTP client are managed by the `Machine` instance.

```csharp
public FactoryioRemoteMachine(Machines machines, bool enabled, string id, object config) : base(machines, enabled, id, config)
{
		dynamic cfg = (dynamic) config;
            
		this["cfg"] = cfg;
		this["platform"] = new Platform(this);
            
		_factoryioRemoteEndpoint = new FactoryioRemoteEndpoint(cfg.type["net_uri"], (short)cfg.type["net_timeout_s"]);

		_client = new RestClient($"{cfg.type["net_uri"]}/api");
		_client.Timeout = cfg.type["net_timeout_s"] * 1000;
}
```

#### Example: opcxmlda-driver

Communication protocol configuration and [QuickOPC](https://www.opclabs.com/products/quickopc) DA client are managed by the `Machine` instance.

```csharp
public OpcxmldaMachine(Machines machines, bool enabled, string id, object config) : base(machines, enabled, id, config)
{
    dynamic cfg = (dynamic) config;
    
    this["cfg"] = cfg;
    this["data"] = cfg.type["data"];
    this["platform"] = new Platform(this);
    
    _opcxmldaEndpoint = new OpcxmldaEndpoint(cfg.type["net_uri"], (short)cfg.type["net_timeout_s"]);
    
    _client = new EasyDAClient();
}
```

#### Example: fanuc-driver

Communciation protocol configuration is managed by the `Machine` instance.

```csharp
public FanucMachine(Machines machines, bool enabled, string id, object config) : base(machines, enabled, id, config)
{
    dynamic cfg = (dynamic) config;
    _focasEndpoint = new FocasEndpoint(cfg.type["net_ip"], (ushort)cfg.type["net_port"], (short)cfg.type["net_timeout_s"]);
    this["platform"] = new Platform(this);
}
```

### Veneer

> *veneer* : to overlay or plate (a surface, as of a common sort of wood) with a thin layer of finer wood for outer finish or decoration
<!-- {.is-info} -->

> *peel* : to break away from a group or formation —often used with *off*
<!-- {.is-info} -->



Collected data requires processing before it can be relayed to another system. `Veneer` instances are responsible for:

* simple or complex source data transformations
* making source data human readable
* creating richer (more valuable to the consumer) data from multiple data points 
* tracking data changes
* creating data hierarchies

`Veneer` instances are "applied" over native data points and "peeled" during the data collection cycle to reveal modified data structures.

Veneers can be applied/peeled as a whole.  Veneers can be sliced and applied/peeled across logical boundaries (e.g. path, axis, spindle).  Atomic values should be used for slicing veneers.  Sliced veneers must be marked before peeling in order to convey the logical hierarchy of the observation to downstream systems.

#### Example: opcxmlda-driver | intermediate format

Transformation into an intermediate format.

```csharp
protected override async Task<dynamic> AnyAsync(dynamic input, params dynamic?[] additionalInputs)
{
    var current_value = new
    {
        name = additionalInputs[0],
        type = input.Vtq?.ValueType.Name,
        value = input.Vtq?.Value,
        good = input.Vtq?.Quality.IsGood
    };

    await onDataArrivedAsync(input, current_value);

    if (current_value.IsDifferentString((object)lastChangedValue))
    {
        await onDataChangedAsync(input, current_value);
    }

    return new { veneer = this };
}
```

#### Example: fanuc-driver | human readable

Transformation into an human readable format.

```csharp
protected override async Task<dynamic> AnyAsync(dynamic input, params dynamic?[] additionalInputs)
{
    if (input.success)
    {
        var current_value = new
        {
            cncid = string.Join("-", ((uint[])input.response.cnc_rdcncid.cncid).Select(x => x.ToString("X")).ToArray())
        };
        
        await onDataArrivedAsync(input, current_value);
        
        if (!current_value.Equals(lastChangedValue))
        {
            await onDataChangedAsync(input, current_value);
        }
    }
    else
    {
        await onErrorAsync(input);
    }

    return new { veneer = this };
}
```

#### Example: fanuc-driver | enriched

Tracking executed G-code blocks.

```csharp
protected override async Task<dynamic> AnyAsync(dynamic input, params dynamic?[] additionalInputs)
{
    if (input.success && additionalInputs[0].success && additionalInputs[1].success)
    {
        _blocks.Add(input.response.cnc_rdblkcount.prog_bc, 
            additionalInputs[0].response.cnc_rdactpt.blk_no, 
            additionalInputs[1].response.cnc_rdexecprog.data);
        
        var current_value = new
        {
            blocks = _blocks.ExecutedBlocks
        };
        
        await onDataArrivedAsync(input, current_value);
        
        var last_keys = ((List<gcode.Block>)lastChangedValue.blocks).Select(x => x.BlockNumber);
        var current_keys = ((List<gcode.Block>)current_value.blocks).Select(x => x.BlockNumber);

        if (last_keys.Except(current_keys).Count() + current_keys.Except(last_keys).Count() > 0)
        {
            await onDataChangedAsync(input, current_value);
        }
    }
    else
    {
        await onErrorAsync(input);
    }

    return new { veneer = this };
}
```

#### Example: fanuc-driver | performance tracking

Tracking driver performance.

```csharp
protected override async Task<dynamic> AnyAsync(dynamic input, params dynamic?[] additionalInputs)
{
    var max = ((List<dynamic>)input.focas_invocations).MaxBy(o => o.invocationMs).First();
    var min = ((List<dynamic>)input.focas_invocations).MinBy(o => o.invocationMs).First();
    var avg = (int)((List<dynamic>)input.focas_invocations).Average(o => (int)o.invocationMs);
    var sum = ((List<dynamic>) input.focas_invocations).Sum(o => (int)o.invocationMs);
    var failedMethods = ((List<dynamic>) input.focas_invocations)
        .Where(o => o.rc != 0)
        .Select(o => new { o.method, o.rc });
    
    var current_value = new
    {
        input.sweepMs,
        invocation = new
        {
            count = input.focas_invocations.Count,
            maxMethod = max.method,
            maxMs = max.invocationMs,
            minMs = min.invocationMs,
            avgMs = avg,
            sumMs = sum,
            failedMethods
        }
    };;
        
    await onDataArrivedAsync(input, current_value);
        
    return new { veneer = this };
}
```

#### Example: fanuc-driver | boundary marker

Example of a generated observation marker for spindle 'S' on execution path '1'.

```json
"marker": [
      {
        "path_no": 1
      },
      {
        "name": "S",
        "suff1": "",
        "suff2": ""
      }
    ]
```

### Collector

`Collector` is a data collection strategy and an interface to the data source.  The `Collector` is responsible for:

* establishing and tearing down connection with the data source via a `Platform` implementation
* applying `Veneer` over collected data
* invoking `Veneer` over collected data
* tracking data source connectivity failures

A concrete `Collector` type, including assembly name, is referenced in the configuration at path `machines[id].strategy`.  Example: `l99.driver.fanuc.BlockTracker, fanuc`.

#### Example: opcxmlda-driver

Initialization, "applying veneers".

```csharp
public override async Task<dynamic?> InitializeAsync()
{
    try
    {
        foreach (dynamic descriptor in machine["data"])
        {
            machine.ApplyVeneer(typeof(opcxmlda.veneers.Tag), getDataKey(descriptor));
        }
        
        machine.VeneersApplied = true;
    }
    catch (Exception ex)
    {
        logger.Error(ex, $"[{machine.Id}] Collector initialization failed.");
    }

    return null;
}
```

Collection cycle, "peeling veneers".

```csharp
public override async Task<dynamic?> CollectAsync()
{
    try
    {
        dynamic tags = await machine["platform"].ReadMultipleTagsAsync(machine["data"]);

        for (int i = 0; i < tags.response.read_multiple_tags.results.Length; i++)
        {
            var tag = tags.response.read_multiple_tags.results[i];
            string descriptor = getDataKey(i);
            await machine.PeelVeneerAsync(descriptor, tag, descriptor);
        }
        
        LastSuccess = true;
    }
    catch (Exception ex)
    {
        logger.Error(ex, $"[{machine.Id}] Collector sweep failed.");
    }

    return null;
}
```

#### Example: fanuc-driver

Initialization, "applying veneers".

```csharp
public override async Task<dynamic?> InitializeAsync()
{
    try
    {
        while (!machine.VeneersApplied)
        {
            dynamic connect = await machine["platform"].ConnectAsync();
            
            if (connect.success)
            {
                machine.ApplyVeneer(typeof(fanuc.veneers.Connect), "connect");
                machine.ApplyVeneer(typeof(fanuc.veneers.CNCId), "cnc_id");
                machine.ApplyVeneer(typeof(fanuc.veneers.RdParamLData), "power_on_time");
                machine.ApplyVeneer(typeof(fanuc.veneers.SysInfo), "sys_info");
                machine.ApplyVeneer(typeof(fanuc.veneers.GetPath), "get_path");

                dynamic disconnect = await machine["platform"].DisconnectAsync();

                machine.VeneersApplied = true;
            }
            else
            {
                await Task.Delay(sweepMs);
            }
        }
    }
    catch (Exception ex)
    {
        logger.Error(ex, $"[{machine.Id}] Collector initialization failed.");
    }

    return null;
}
```

Collection cycle, "peeling veneers".

```csharp
public override async Task<dynamic?> CollectAsync()
{
    try
    {
        dynamic connect = await machine["platform"].ConnectAsync();
        await machine.PeelVeneerAsync("connect", connect);

        if (connect.success)
        {
            dynamic cncid = await machine["platform"].CNCIdAsync();
            await machine.PeelVeneerAsync("cnc_id", cncid);

            dynamic poweron = await machine["platform"].RdParamDoubleWordNoAxisAsync(6750);
            await machine.PeelVeneerAsync("power_on_time", poweron);

            dynamic info = await machine["platform"].SysInfoAsync();
            await machine.PeelVeneerAsync("sys_info", info);

            dynamic paths = await machine["platform"].GetPathAsync();
            await machine.PeelVeneerAsync("get_path", paths);

            dynamic disconnect = await machine["platform"].DisconnectAsync();
        }

        LastSuccess = connect.success;
    }
    catch (Exception ex)
    {
        logger.Error(ex, $"[{machine.Id}] Collector sweep failed.");
    }

    return null;
}
```

### Handler

`Handler` is an observation post-processor and interface to target systems.  Data gathered via a `Collector` is transformed through a `Veneer` and acted upon the processing stages of:

* data arrival
* data change
* data source errors
* data collection cycle completion

A concrete `Handler` type, including assembly name, is referenced in the configuration at path `machines[id].handler`.  Example: `l99.driver.fanuc.handlers.SparkplugB, fanuc`.

#### Example: opcxmlda-driver

The handler prepares changed data into Splunk metric format.

```csharp
public override async Task<dynamic?> OnDataChangeAsync(Veneers veneers, Veneer veneer, dynamic? beforeChange)
{
    var payload = new
    {
        time = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeMilliseconds(),
        @event = "metric",
        host = veneers.Machine.Id,
        fields = new
        {
            metric_name = veneer.LastArrivedValue.name,
            _value = veneer.LastArrivedValue.value,
            type = veneer.LastArrivedValue.type,
            good = veneer.LastArrivedValue.good
        }
    };
        
    return payload;
}
```

The Splunk metric payload is then published to an MQTT broker.  Alternatively, an HTTP request to the Splunk HEC endpoint could be executed.

```csharp
protected override async Task afterDataChangeAsync(Veneers veneers, Veneer veneer, dynamic? onChange)
{
    if (onChange == null)
        return;
    
    var topic = $"opcxmlda/{veneers.Machine.Id}/splunk/{veneer.Name}";
    string payload = JObject.FromObject(onChange).ToString();
    await veneers.Machine.Broker.PublishChangeAsync(topic, payload);
}
```

#### Example: fanuc-driver

The handler prepares changed data into InfluxDb line format.

```csharp
public override async Task<dynamic?> OnDataChangeAsync(Veneers veneers, Veneer veneer, dynamic? beforeChange)
{
    if (veneer.Name == "axis_data")
    {
        var payload = new LineProtocolWriter(Precision.Milliseconds)
            .Measurement(veneer.Name)
            .Tag("machine_id", veneers.Machine.Id)
            .Tag("path_no", veneer.Marker[0].path_no.ToString())
            .Tag("axis_name", (veneer.Marker[1].name + veneer.Marker[1].suff).ToString())
            .Field("position", (float) veneer.LastArrivedValue.pos.absolute)
            .Field("feed", (float) veneer.LastArrivedValue.actf);
        
        return payload;
    }

    
    return null;
}
```

The InluxDb line payload is then published to an MQTT broker.

```csharp
protected override async Task afterDataChangeAsync(Veneers veneers, Veneer veneer, dynamic? onChange)
{
    if (onChange == null)
    {
        return;
    }
        
    var topic = $"fanuc/{veneers.Machine.Id}/influx";
    string payload = JObject.FromObject(onChange).ToString();
    await veneers.Machine.Broker.PublishChangeAsync(topic, payload);
}
```

## Lifecycle

### Overview

```mermaid
graph LR
	start:::in --> 
  id1(parse args) --> 
  id2(parse config) --> 
  id3(create machines) --> 
  id4(execute) --> 
  id5(shutdown) --> 
  stop:::out
  classDef in fill:lightgreen;
  classDef out fill:red;
```

```csharp
static async Task Main(string[] args)
{
    dynamic config = await Bootstrap.Start(args);
    Machines machines = await Machines.CreateMachines(config);
    await machines.RunAsync();
    await Bootstrap.Stop();
}
```

### Arguments

<!-- ### Tabs {.tabset} -->
<!-- # -->
#### Logging

Relative or absolute path to logging configuration file.  

Argument: `--nlog`  

Default: `nlog.config`  

Example: `nlog.config`, `/etc/fanuc/nlog.config`  

> WARNING: Target log file is defined inside `nlog.config`
<!-- {.is-warning} -->

> [NLog Documentation](https://nlog-project.org/)
<!-- {.is-info} -->


<!-- # -->
#### Configuration

Relative or absolute path to driver configuration file.  

Argument: `--config`  

Default: `config.yml`  

Example: `config.yml`, `/etc/fanuc/config.yml`  

### Terminating

Data collection will continue to run until the application is stopped or `Shutdown()` is invoked on all `Machine` instances. 

## Configuration

Driver configuration is maintained in the `config.yml` file.  You can read more about YAML structure [here](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started).  Multiple machines can be added and are differentiated by their `id` key.

<!-- ## Tabs {.tabset} -->
<!-- # -->
### Machine

Parameters relevant to driver initialization.

`id` : Unique machine identifier.

`enabled` : Toggles the active collection state. Disabled machines are not initialized upon startup. 

`type`: `Machine` class type initialized on startup.

`strategy` : `Collector` class type initialized on startup.

`handler` : `Handler` class type initialized on startup.

Examples:

```yaml
machines:
  - id: bender01
    enabled: !!bool true
    type: l99.driver.opcxmlda.OpcxmldaMachine, opcxmlda
    strategy: l99.driver.opcxmlda.collectors.Basic01, opcxmlda
    handler: l99.driver.opcxmlda.handlers.SHDR, opcxmlda
```

```yaml
machines:
  - id: cnc01
    enabled: !!bool true
    type: l99.driver.fanuc.FanucMachine, fanuc
    strategy: l99.driver.fanuc.collectors.NLuaRunner, fanuc
    handler: l99.driver.fanuc.handlers.Native, fanuc
```

<!-- # -->
### Broker

Parameters relevant to built-in MQTT client.

`enabled` : Toggles the active client state.  Disabled clients are not initialized upon startup.

`net_ip` : Broker IP address.

`net_port` : Broker TCP port.

`auto_connect` : Automatically connect to broker on startup.  In the example of SparkplugB, this parameter should be `false`.

`publish_status` : Publish status, typically at the end of sweep.

`publish_arrivals` : Publish all data every sweep.

`publish_changes` : Publish data only when it changes.

`publish_disco` : Publish machine information to discovery topic.

`disco_base_topic` : Topic used for discovery.

`anonymous` : Connect anonymously or use credentials.

`user` : Broker user.

`password` : Broker password.

Examples:

```yml
machines:
  - id: bender01
    ...
    
    broker:
      enabled: !!bool true
      net_ip: 10.20.30.40
      net_port: !!int 1883
      auto_connect: !!bool true
      publish_status: !!bool true
      publish_arrivals: !!bool true
      publish_changes: !!bool true
      publish_disco: !!bool true
      disco_base_topic: opcxmlda
      anonymous: !!bool false
      user: client1
      password: secret123
```

<!-- # -->
### type

`machine[id].type` specific configuration.

Examples:

```yml
machines:
  - id: demo
    type: l99.driver.opcxmlda.OpcxmldaMachine, opcxmlda
    ...
    
    l99.driver.opcxmlda.OpcxmldaMachine, opcxmlda:
      sweep_ms: !!int 1000
      net_uri: http://opcxml.demo-this.com/XmlDaSampleServer/Service.asmx
      net_timeout_s: !!int 3
      data:
        - Dynamic/Analog Types/Double:
        - Dynamic/Analog Types/Int:
        - Dynamic/Analog Types/Double[]:
        - Static/Simple Types/String:
        - Static/Simple Types/DateTime:
        - Static/ArrayTypes/Object[]:
        - Dynamic/Analog Types/Fools/Guildenstern:
        - Dynamic/Enumerated Types/Gems:
        - SomeUnknownItem:
```

```yml
machines:
  - id: cnc01
    type: l99.driver.fanuc.FanucMachine, fanuc
    ...
    
    l99.driver.fanuc.FanucMachine, fanuc:
      sweep_ms: !!int 1000
      net_ip: 10.20.30.50
      net_port: !!int 8193
      net_timeout_s: !!int 3
```

```yml
machines:
  - id: fio01
    type: l99.driver.factoryio.FactoryioLocalMachine, factoryio
    ...
    
    l99.driver.factoryio.FactoryioLocalMachine, factoryio:
      sweep_ms: !!int 100
```

```yml
machines:
  - id: fio02
    type: l99.driver.factoryio.FactoryioRemoteMachine, factoryio
    ...
    
    l99.driver.factoryio.FactoryioRemoteMachine, factoryio:
      sweep_ms: !!int 1000
      net_uri: http://10.20.32.6:7410
      net_timeout_s: !!int 3
```

<!-- # -->
### strategy

`machine[id].strategy` specific configuration.

```yml
machines:
  - id: cnc02
    strategy: l99.driver.fanuc.collectors.NLuaRunner, fanuc
    ...
    
    l99.driver.fanuc.collectors.NLuaRunner, fanuc:
      script: lua/test1.lua
```

```yml
machines:
  - id: fio01
    strategy: l99.driver.factoryio.collectors.BasicLocal01, factoryio
    ...
    
    l99.driver.factoryio.collectors.BasicLocal01, factoryio:
      sub_topic: factoryio/fio01/io
```

<!-- # -->
### handler

`machine[id].handler` specific configuration.

```yml
machines:
  - id: bender01
    handler: l99.driver.opcxmlda.handlers.SHDR, opcxmlda
    ...
       
    l99.driver.opcxmlda.handlers.SHDR, opcxmlda:
      port: !!int 7878
      verbose: !!bool true
      lua_head: |
        luanet.load_assembly 'System';
        luanet.load_assembly 'Newtonsoft.Json';
        JObject = luanet.import_type 'Newtonsoft.Json.Linq.JObject';
      data:
        - avail:
            shdr:
              name: avail
              category: event
              eval: |
                return "AVAILABLE";
```

