# Milestones

The current plan with versions and branches is as follows:

- 0.6 main - public version
- 0.7 develop - as used by clients, work in progress
- 0.7.1 partcount-reset - move partcount reset from relay to adapter
- 0.8 historian - refactor relay/db so can point at multiple agents with ambiguous names, use new path syntax like 'Mazak/Mill123/Axes/Linear[X]/...'
- 0.9 merge - merge develop branch into historian branch, migrate existing client data to new db structure
- 1.0 continuous-aggregates - use continuous aggregates to rollup events from history table, instead of bins table
- 1.1 optimize - profile, optimize, refactor db and code - is jsonb okay for values? use separate tables or columns?

We're currently (September 2022) working on 0.9

Beyond 1.1, we'll work on a compiler for device modules and a visual data builder. 

