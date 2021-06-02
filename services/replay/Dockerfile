FROM python:3.9-slim-buster

RUN apt-get update && apt-get install nodejs -y

RUN pip3 install mqtt-recorder

WORKDIR /app

COPY . .

ENTRYPOINT ["node", "replay"]
