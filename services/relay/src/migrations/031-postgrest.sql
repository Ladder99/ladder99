-- add postgrest roles etc
-- see https://postgrest.org/en/latest/install.html

-- note: there is no "create role if not exists"

-- create role for postgrest
create role authenticator noinherit login password '${PGAUTHPASSWORD}';

-- create role for anonymous users
create role anon_user nologin;  -- read-only user
grant anon_user to authenticator;

-- allow anon_user to access the setup schema and read/write the devices table
grant usage on schema setup to anon_user;
grant all on setup.devices to anon_user;
