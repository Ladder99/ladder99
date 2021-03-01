FROM ubuntu:18.04 AS temp_build_image

# setup
RUN apt-get update \
  && apt-get install -y libxml2 libxml2-dev cmake git libcppunit-dev build-essential screen ruby curl

# build
RUN mkdir -p ~/agent/build \ 
  && cd ~/agent \
  && git clone https://github.com/mtconnect/cppagent.git \
  && cd cppagent \
  && git submodule init \
  && git submodule update \
  && cd ../build \
  && cmake -D CMAKE_BUILD_TYPE=Release ../cppagent/ \
  && make

# install
RUN cp agent/agent /usr/local/bin \
  && mkdir -p /etc/mtconnect/agent /etc/mtconnect/adapter \
  && cd ~/agent/cppagent \
  && cp -r styles schemas simulator/VMC-3Axis.xml /etc/mtconnect/agent \
  && cp simulator/VMC-3Axis-Log.txt simulator/run_scenario.rb /etc/mtconnect/adapter

# FROM ubuntu:18.04
# COPY --from=temp_build_image /home/app /home/app
EXPOSE 5000 7878
# CMD ["java", "-jar", "/home/app/foo.jar"]
