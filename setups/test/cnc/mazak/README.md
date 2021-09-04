# Mazak setup

Mazak provides MTConnect agent endpoints for some CNC machines here - http://mtconnect.mazakcorp.com/. This setup reads from those, writes to the database, and visualizes their output.

Agent is not needed, as we just use Relay to dump data from the endpoints to the Database.

Note: The x-y axes are not included, for security purposes, so can't graph those.
