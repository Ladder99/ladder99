# FROM python:3.9-slim-buster
FROM python:3.9.5-alpine

# these don't have arm/v7 archs
# FROM nikolaik/python-nodejs:python3.9-nodejs16-slim
# FROM nikolaik/python-nodejs:python3.9-nodejs16-alpine

RUN apt-get update && apt-get install nodejs -y

RUN pip3 install mqtt-recorder

WORKDIR /app

COPY . .

ENTRYPOINT ["node", "replay"]
