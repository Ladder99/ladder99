# Sprints

Current and past sprints. See versions.md for version numbers. 

<!-- plan as if one person working in one-week sprints, including unit testing, docs -->

| name | description | due |
| -------- | ------------ | ---|
| merge | merge v0.7 and v0.8 into v0.9, keep both working - oxbox, demo. start adding tests | nov 4 |
| jobcounts | finish jobboss jobcounts feature | nov 4 |
| historian | separate historian and adapter repos? | nov 4 |
| devops | add structured logging, loki, ci/cd, tracking versions, push changes || 
| optimize | optimize for security, traffic, size, cpu | |
| client-specific drivers | refactor folder structure to allow client-specific drivers, schemas, settings | |
| multi-output adapter | refactor adapter to accommodate different output formats. clean up cache code | |
| scale | scale horizontally to consolidate data from multiple encabulators ||
| metrics / continuous aggregates | expand metrics - use continuous aggregates to roll up events from history table, instead of bins table (?) ||
| metrics / oee | calculate full OEE, first as approximation (eg fixed schedule, fixed rate), then more accurate ||

<!-- | partcount reset | partcount reset in adapter | done || -->
<!-- | multiple agents | refactor db so can point at multiple agents. new path syntax like 'Mazak/Mill123/Axes/Linear[X]/...' | done || -->
