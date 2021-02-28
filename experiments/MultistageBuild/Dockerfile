# multi-stage build

# build javadiode using gradle
# -------------------------------------

# get gradle (version 2.8 specified in .gradleversion file)
# source: https://github.com/bivas/docker-gradle/tree/master/jdk8-gradle-2.8
FROM bivas/gradle:8-onbuild AS TEMP_BUILD_IMAGE

# copy java source in ./javadiode to /home/app in container
COPY javadiode /home/app

# set cd
WORKDIR /home/app

# build project using gradle wrapper
RUN ./gradlew


# run javadiode using jre8
# -------------------------------------

# get java 8 runtime engine
FROM openjdk:8-jre-slim

# EXPOSE 8080
# RUN mkdir /app
# COPY --from=TEMP_BUILD_IMAGE /home/gradle/src/build/libs/foo.jar /app
# CMD ["java", "-jar", "/app/foo.jar"]  

COPY --from=TEMP_BUILD_IMAGE /home/app /home/app

