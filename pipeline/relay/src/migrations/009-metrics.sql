
drop function update_metrics;

create or replace function update_metrics ()
returns boolean
as
$$
begin
  raise notice 'hello, world';
  return true;
end;
$$
language plpgsql;


select update_metrics();
