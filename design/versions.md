# Versions

Previous versions - see roadmap.md for plans.

| version | description |
| --- | --- |
| v0.7.x | partcount reset in adapter. work in progress, used by one client. old lower-case path syntax. |
| v0.7.2 | server set to the local timezone, adjusted code and grafana queries |
| 0.8.x | multiple agents. refactored db so can point at multiple agents better. new path syntax like 'Mazak/Mill123/Axes/Linear[X]/...' |
| 0.9.x | merge 0.7 into 0.8, keep both working |
| 0.9.1 | work on opc-ua driver, rename micro driver to host |
| 0.9.2 | minor patch for host driver - exclude Micro from Grafana, turn off cpuuser etc |
| 0.9.3 | update example setup, markdown docs |
| 0.10.0 | new folder structure and l99 command |

We're currently (November 2022) working on 0.10

Beyond these, we'll work on a compiler for device schemas and a visual data builder. 


<!-- 
future

| 0.10.x | expand metrics - use continuous aggregates to roll up events from history table, instead of bins table? calc oee etc |
| 0.11.x | refactor folder structure to allow client-specific drivers, schemas, settings |
| 0.12.x | expand adapter to accommodate different output formats. clean up cache code |
| 0.13.x | optimize for security, traffic, size, cpu | 
-->



