-- add postgrest roles etc
-- see https://postgrest.org/en/latest/install.html

-- IMPORTANT: MUST CREATE AUTHENTICATOR ROLE MANUALLY through psql or pgadmin!
-- use the same password as the one in the .env file for PGAUTHPASSWORD.
--. alternative would be to use text substitution here - could do later.

-- create role authenticator noinherit login password '${PGAUTHPASSWORD}';

-- there is no "create role if not exists" - 
-- so must keep this in a versioned migration, or use script from here -
-- https://stackoverflow.com/questions/8092086/create-postgresql-role-user-if-it-doesnt-exist
create role anon_user nologin;  -- read-only user
grant anon_user to authenticator;

-- allow anon_user to access the setup schema and read/write the devices table
grant usage on schema setup to anon_user;
grant all on setup.devices to anon_user;
