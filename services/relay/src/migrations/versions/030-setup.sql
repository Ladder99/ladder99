-- add a setup schema and setup/config tables

-- schema
create schema if not exists setup;

-- table
create table if not exists setup.devices (
  -- name text primary key, -- adds devices_pkey index
  path text primary key, -- adds devices_pkey index -- eg 'Main/ConversionPress'
  setup_allowance_mins float default 0.0,
  shift_start text default '08:00',
  shift_stop text default '17:00'
);
