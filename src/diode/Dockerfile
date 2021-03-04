# experiment 2021-03-04

# get gradle (version 2.8 specified in .gradleversion file)
# source: https://github.com/bivas/docker-gradle/tree/master/jdk8-gradle-2.8
FROM bivas/gradle:8-onbuild

WORKDIR /home/app

COPY . .

RUN ./gradlew

# CMD ./gradlew tasks
