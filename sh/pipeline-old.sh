#!/bin/sh

docker run -it --rm \
  --name pipeline \
  --volume "$PWD":/usr/src/pipeline \
  --workdir /usr/src/pipeline \
  python:3.7-alpine \
  python sh/pipeline.py $*
