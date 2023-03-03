-- update setup.devices table

-- add ideal rate column
alter table setup.devices add column ideal_rate float default 200.0;


-- shift_start and stop should be time columns to enforce format.
-- will need to update grafana setup page also.
-- alter table setup.devices alter column shift_start drop default;
-- alter table setup.devices alter column shift_stop drop default;
-- alter table setup.devices alter column shift_start type time(0) using shift_start::time(0);
-- alter table setup.devices alter column shift_stop type time(0) using shift_stop::time(0);
-- select * from setup.devices;

