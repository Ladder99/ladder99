# experiment 2021-03-04

# build with
#   docker build -t diode .
# run with
#   docker run diode <command>
# eg
#   docker run diode /bin/bash -c "cd application/datadiode/black && gradle run"

# get gradle
# source: https://github.com/bivas/docker-gradle/tree/master/jdk8-gradle-2.8
FROM bivas/gradle:8-2.8

WORKDIR /home/app

COPY code .

# RUN ./gradlew tasks

CMD ["./gradlew", "tasks"]
