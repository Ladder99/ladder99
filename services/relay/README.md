# Ladder99 Relay

This transfers data from the Agent to the Database.

It polls XML data from the agent at eg localhost:5000.

The entry point is src/index.js.

To test, `npm test`.

This will be replaced by an instance of the Adapter, with ingress driver for agent and egress driver for SQL.

To run - eg with mazak setup

    ./start ./test/cnc/mazak dashboard

to access the database only,

    ./start ./test/cnc/mazak postgres
