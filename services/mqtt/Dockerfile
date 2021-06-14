# mqtt dockerfile - record and play mqtt messages
# uses https://github.com/rpdswtk/mqtt_recorder, a python app

FROM python:3.8-slim

# install requirements, namely mqtt-recorder
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY docker-entrypoint.sh .
COPY data/playback.csv data/playback.csv

EXPOSE 1883

# change what signal `docker stop` sends
STOPSIGNAL SIGINT

# CMD is default command when run container

# works
# CMD ["sh", "-c", "mqtt-recorder --host $HOST --port $PORT --mode $MODE --file $FILE"]

# works
ENTRYPOINT ["sh", "-c", "mqtt-recorder --host $HOST --port $PORT --mode $MODE --file $FILE"]

# nowork
# ENTRYPOINT [ "mqtt-recorder --host $HOST --port $PORT --mode $MODE --file $FILE"]

# works
# ENTRYPOINT [ "./docker-entrypoint.sh"]
