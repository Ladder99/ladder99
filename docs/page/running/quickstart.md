# Quickstart

For tech-savy users who want to get the pipeline up and running quickly, you can install Git, Docker, Docker-compose, and in a Terminal or Git Bash window, run

```bash
cd ~
git clone https://github.com/Ladder99/ladder99
cd ladder99
./install
l99 use example
l99 start
```

This will take several minutes to build the pipeline.

Then you can visit a dashboard at http://localhost/d/main - username 'admin', password 'grafana'. It should show stats for a remote Mazak machine and the host machine. 

