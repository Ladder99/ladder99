# Services

Ladder99 is made up of several services that work together to form a data pipeline. Some have user-facing web pages, which can be accessed through the URLs below -

| Service | Description | URL |
|---------|------------|---------|
| Adapter | polls/subscribes to devices, converts to text, sends to Agent |  |
| Agent | fits text representation into XML tree | http://localhost:5000 |
| Relay | polls Agent and writes new values to database |  |
| Postgres | database that stores device history in tables |  |
| Meter | polls data in database and writes statistics |  |
| Grafana | dashboard that queries data in database and displays graphs | http://localhost:80 |
| Dozzle | shows logs for the different services | http://localhost:8080 |
| Portainer | manages services - start/stop etc | http://localhost:9000 |
| pgAdmin | manages postgres database | http://localhost:5050 |

