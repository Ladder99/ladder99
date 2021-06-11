# mqtt dockerfile - record and play mqtt messages
# uses https://github.com/rpdswtk/mqtt_recorder, a python app

FROM python:3.8-slim

# install requirements, namely mqtt-recorder
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY test.csv .

EXPOSE 1883

# ENTRYPOINT [ "mqtt-recorder" ]

# default command when run container
CMD ["mqtt-recorder", "--host", "localhost", "--mode", "replay", "--file", "test.csv"]
# CMD [ "--host", "localhost", "--mode", "replay", "--file", "test.csv" ]
