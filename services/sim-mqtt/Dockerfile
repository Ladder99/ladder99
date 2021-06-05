# sim-mqtt dockerfile - record and play mqtt messages

FROM python:3.8-slim

# install requirements
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY test.csv .

# default command when run container
CMD ["mqtt-recorder", "--host localhost", "--mode replay", "--file test.csv"]
