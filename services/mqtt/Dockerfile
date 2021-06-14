# mqtt dockerfile - record and play mqtt messages
# uses https://github.com/rpdswtk/mqtt_recorder, a python app

FROM python:3.8
# FROM python:3.8-slim

# install requirements, namely mqtt-recorder
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY data/playback.csv data/playback.csv

EXPOSE 1883

# ENTRYPOINT [ "mqtt-recorder" ]
# CMD [ "--host", "localhost", "--mode", "replay", "--file", "test.csv" ]

# ENV FILE=pokpok

# default command when run container
# CMD ["mqtt-recorder", "--host", "localhost", "--port", "1883", "--mode", "replay", "--file", "test.csv"]
# CMD ["mqtt-recorder", "--host", "localhost", "--port", "1883", "--mode", "record", "--file", "test.csv"]
# CMD 'mqtt-recorder --host localhost --port 1883 --mode record --file test.csv'
# CMD 'mqtt-recorder --host $${HOST} --port $${PORT} --mode $${MODE} --file $${FILE}'
# CMD 'mqtt-recorder --host $HOST --port $PORT --mode $MODE --file $FILE'
# CMD 'echo $PATH'
# CMD ["echo", "$PATH"]   # prints '$PATH'
# CMD ["bash", "-c", "echo", "$FILE"]
# CMD '/bin/bash -c "echo ${FILE}"'
# CMD '/bin/bash -c "cat test.csv"'
# CMD "cat test.csv"
# CMD [ "sh", "-c", "echo $HOME" ] # works
# CMD [ "sh", "-c", "echo $PATH" ] # works
# CMD [ "sh", "-c", "echo $FILE" ] # works!
# CMD [ "echo $FILE" ] # bombs
# CMD ["mqtt-recorder", "--host", "$HOST", "--port", "$PORT", "--mode", "$MODE", "--file", "$FILE"]
# CMD [ "sh", "-c", "echo $HOST" ] # works
# CMD [ "sh", "-c", "echo $PORT" ] # works
# CMD [ "sh", "-c", "echo ${PORT}" ] # works
# CMD [ "sh", "-c", "echo $MODE" ]

# this gives "error argument --port invalid int value '$PORT'" - why?
# but $HOST works?
# CMD ["mqtt-recorder", "--host", "$HOST", "--port", "$PORT", "--mode", "$MODE", "--file", "$FILE"]

# nowork
# CMD ["sh", "-c", "mqtt-recorder", "--host", "$HOST", "--port", "$PORT", "--mode", "$MODE", "--file", "$FILE"]

CMD ["sh", "-c", "mqtt-recorder --host $HOST --port $PORT --mode $MODE --file $FILE"]


# ENV FILE=${FILE}

# error file not found $FILE - why?
# CMD ["mqtt-recorder", "--host", "host.docker.internal", "--port", "1883", "--mode", "replay", "--file", "$FILE"]

# CMD ["mqtt-recorder", "--host", "host.docker.internal", "--port", "1883", "--mode", "replay", "--file", "data/playback.csv"]

