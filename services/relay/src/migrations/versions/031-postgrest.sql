-- add postgrest roles etc
-- see https://postgrest.org/en/latest/install.html

-- note: there is no "create role if not exists"

-- create a role for the postgrest service
create role authenticator noinherit login password '${PGAUTHPASSWORD}';

-- create a role for the anonymous user
create role anon_user nologin;  -- read-only user
grant anon_user to authenticator;

-- allow anonymous user to access the setup schema and read/write the devices table
grant usage on schema setup to anon_user;
grant all on setup.devices to anon_user;
