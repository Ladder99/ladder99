# Ladder99 Relay

This transfers data from the Agent to the Database.

It polls XML data from the agent at eg localhost:5000.

The entry point is src/index.js.

This may eventually be replaced by an instance of the Adapter, with ingress driver for agent and egress driver for SQL.

## Development/Testing

First, install the dependencies locally with `npm install`.

Then `npm run test`.

