# Milestones

The current plan with versions and branches is as follows:

- 0.6 main - public version
- 0.7 develop - as used by clients, work in progress
- 0.7.1 partcount-reset - move partcount reset from relay to adapter
- 0.8 continuous-aggregates - handle db version migration, use continuous aggregates to rollup events from history table
- 0.9 relay - refactor relay/db so can point at multiple agents with ambiguous names
- 1.0 path - use agent2 path constructions, eg SystemCondition, not system-condition
- 1.1 optimize - profile, optimize, refactor db and code - is jsonb okay for values? use separate tables or columns?

We're currently (August 2022) working on 0.7-0.8.

Beyond 1.1, we'll work on a compiler for device modules and a visual data builder. 

