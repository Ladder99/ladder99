-- add a setup schema and setup/config tables

-- schema
create schema if not exists setup;

-- table
create table if not exists setup.devices (
  name text primary key, -- adds devices_pkey index
  setup_allowance_mins float default 0.0,
  shift_start text default '08:00',
  shift_stop text default '17:00'
);

-- insert into setup.devices (name, setup_allowance_mins) values 
--   ('Jumbo', 30),
--   ('Marumatsu', 30),
--   ('Solarco', 0),
--   ('PAC48', 0),
--   ('Bahmuller', 0),
--   ('Gazzella', 0)
-- ;
