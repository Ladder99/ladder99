# Sprints

Current and past sprints. See versions.md for version numbers. 

<!-- plan as if one person working in two-week sprints, including unit testing. -->

| name | description | status | 
| -------- | ------------ | --- |
| partcount reset | partcount reset in adapter | done |
| multiple agents | refactor db so can point at multiple agents. new path syntax like 'Mazak/Mill123/Axes/Linear[X]/...' | done |
| merge | merge v0.7 and v0.8 into v0.9, keep both working | wip |
| metrics / continuous aggregates | expand metrics - use continuous aggregates to roll up events from history table, instead of bins table (?) | |
| metrics / oee | calculate full OEE, first as approximation (eg fixed schedule, fixed rate), then more accurate ||
| client-specific drivers | refactor folder structure to allow client-specific drivers, modules, settings | |
| multi-output adapter | refactor adapter to accommodate different output formats. clean up cache code | |
| optimize | optimize for security, traffic, size, cpu | |

