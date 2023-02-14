create table if not exists setup.schedule (
  path text not null, -- adds schedule_pkey index -- eg 'Main/ConversionPress'
  date date not null,
  start time(0) default '08:00 am',
  stop time(0) default '05:00 pm',
  downtimes text,
  primary key (path, date)
);

-- select localtime(0);
-- select to_char(now()::time, 'HH:MI am');
-- insert into setup.schedule (path, date) values ('foo', now()::date);
-- select * from setup.schedule;
-- select to_char(start, 'HH:MI am') from setup.schedule;
