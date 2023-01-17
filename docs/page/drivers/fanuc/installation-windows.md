<!-- ---
title: Windows Installation
description: 
published: true
date: 2022-09-23T02:21:38.712Z
tags: 
editor: markdown
dateCreated: 2022-09-23T02:21:38.712Z
---
 -->

# Windows Installation

Instructions documented here are for non-Docker builds.

1. Install Windows x86 .NET 6.0 Runtime from https://dotnet.microsoft.com/en-us/download/dotnet/6.0.
2. Download latest fanuc-driver Windows release from https://github.com/Ladder99/fanuc-driver/releases.
3. Unblock and decompress the release archive.
   
```
fanuc-driver
|
|- logs                             ... location of runtime log files
|
|- runtimes                         ... .NET supporting files
|
|- user
|   |
|   |- agent.cfg                    ... MTConnect Agent example configuration
|   |- config.machines.yml          ... machines configuration file
|   |- config.system.yml            ... system configuration file  
|   |- config.user.yml              ... user configuration file
|   |- devices_template.xml         ... MTConnect Agent devices information model blank template
|   |- nlog.config                  ... logging configuration file
|   |- win_install.bat              ... install fanuc-driver as a Windows Service (run as administrator)
|   |- win_restart.bat              ... restart fanuc-driver Windows Service (run as administrator)
|   |- win_run.bat                  ... run fanuc-driver from console
|   |- win_start.bat                ... start fanuc-driver Windows Service (run as administrator)
|   |- win_stop.bat                 ... stop fanuc-driver Windows Service (run as administrator)
|   |- win_uninstall.bat            ... stop and remove fanuc-driver Windows Service (run as administrator)
|   |- *.xml                        ... MTConnect device model generated at runtime
|
|- fanuc.exe                        ... fanuc-driver executable
|- *.*                              ... fanuc-driver supporting files
```

4. Modify `./user/config.machines.yml` to include your Fanuc machines.  See [configuration layout](https://docs.ladder99.com/en/latest/page/drivers/fanuc/configuration-layout.html).
5. Run `./user/win_install.bat` as administrator to install the fanuc-driver Windows Service.
6. Modify the fanuc-driver Windows Service to log-on as `Network Service` user.
7. Run `./user/win_start.bat` to start fanuc-driver Windows Service.