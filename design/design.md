# Design Decisions

## Database

The database as currently designed is a graph structure, with nodes, edges, and history tables. The nodes table stores the devices and paths, the edges table stores edges between the nodes, and the history table stores device_id, path_id, time, and value. The value field there is a jsonb value, so can store text, numbers, etc. Views transform these tables into more SQL-friendly table structures - devices, dataitems, history_text, and history_float. 

The idea with the history table is to be able to store data like `noun-adjective-time-value`. 

The nodes table is just an integer id field with a jsonb props field. The advantage for things like MTConnect probe data is that you don't need to predefine fields for all the possible attributes of the Device and DataItem elements, as you would with more conventional tables - they can all just go in the props field. 

The advantage of a more conventional table structure like devices, dataitems, history_text, history_number would be that you could use the db to enforce consistency, rather than relying on code to do so in the graph structures, and it should be more efficient to store data in conventional fields than jsonb. 

We'll be doing some profiling to compare the approaches, then decide what to do from there. 

