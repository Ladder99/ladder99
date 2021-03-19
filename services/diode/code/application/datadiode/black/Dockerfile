# experiment 2021-03-04
# status: nowork - gradle needs parent dirs also

# get gradle
# source: https://github.com/bivas/docker-gradle/tree/master/jdk8-gradle-2.8
FROM bivas/gradle:8-2.8

COPY contrib /home/app
COPY src /home/app

WORKDIR /home/app

CMD gradle run
