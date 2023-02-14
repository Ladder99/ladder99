create table if not exists setup.schedule (
  path text not null, -- adds schedule_pkey index -- eg 'Main/ConversionPress'
  date date not null,
  start time(0) default '08:00 am',
  stop time(0) default '05:00 pm',
  downtimes text,
  primary key (path, date)
);
