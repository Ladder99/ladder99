# Roadmap

The current plan with versions and branches. See versions.md for older versions. 

| version | description |
| -------- | ------------ |
| 0.7.x | in progress, as used by one client. old lower-case path syntax. partcount reset in adapter |
| 0.8.x | refactored db so can point at multiple agents better. new path syntax like 'Mazak/Mill123/Axes/Linear[X]/...' |
| 0.9.x | merge 0.7 into 0.8, keep both working |
| 0.10.x | expand metrics - use continuous aggregates to roll up events from history table, instead of bins table? calc oee etc |
| 0.11.x | expand adapter to accommodate different output formats. clean up cache code |
| 0.12.x | optimize for security, traffic, size, cpu |

We're currently (October 2022) working on 0.9

Beyond these, we'll work on a compiler for device modules and a visual data builder. 

