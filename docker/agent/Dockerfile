# mtconnect c++ agent
# following instructions from
# http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu

# get base
FROM ubuntu:18.04 AS temp_build_image

# get dependencies
# The C++ agent depends on libxml2 and for testing libcppunit. 
# The rest are the standard packages for building software. 
# We also use cmake to generate the make files.
RUN apt-get update \
  && apt-get install -y libxml2 libxml2-dev libcppunit-dev \
  && apt-get install -y cmake git build-essential screen ruby curl

# get agent source
RUN mkdir -p ~/agent/build \ 
  && cd ~/agent \
  && git clone https://github.com/mtconnect/cppagent.git \
  && cd cppagent \
  && git submodule init \
  && git submodule update

# build makefile
RUN cd ~/agent/build && cmake -D CMAKE_BUILD_TYPE=Release ../cppagent/

# build and install agent
RUN make && cp agent/agent /usr/local/bin

# setup agent
RUN mkdir -p /etc/mtconnect/agent \
  && cd ~/agent/cppagent \
  && cp -r styles schemas simulator/VMC-3Axis.xml /etc/mtconnect/agent

# setup simulator
RUN mkdir -p /etc/mtconnect/adapter \
  && cp simulator/VMC-3Axis-Log.txt simulator/run_scenario.rb /etc/mtconnect/adapter

# multistage build - second step
# FROM ubuntu:18.04
# COPY --from=temp_build_image /home/app /home/app

# define ports to listen on
EXPOSE 5000 7878

# define default run command
CMD ["agent", "debug", "/etc/mtconnect/agent/agent.cfg"]
