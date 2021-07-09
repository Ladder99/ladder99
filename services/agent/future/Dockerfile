# MTConnect C++ Agent Docker image build instructions
# Adapted from http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu.

# After setup, the dirs will look like this -
#
# /etc/mtconnect
#  |-- schemas - xsd files
#  |-- simulator - agent.cfg, simulator.rb, vmc-3axis.xml, log.txt
#  |-- styles - our devices.xsl, streams.xsl, custom.css, logo.png, favicon.ico
#  |-- styles-original - streams.xsl, streams.css, favicon.ico
# /usr/local/bin
#  |-- agent - the agent application
#
# while the default simulator/agent.cfg has -
#   Devices = ../simulator/VMC-3Axis.xml
#   Files { styles { Path = ../styles } }
# so when you run this agent it picks up our styles, not the originals.
# see https://github.com/mtconnect/cppagent/blob/master/simulator/agent.cfg
#
# our pipeline docker-compose yaml has this for the agent service -
#   agent:
#     command: agent debug /data/agent/agent.cfg
#     volumes:
#       - ./$SETUP/volumes/agent:/data/agent # should have agent.cfg, devices.xml
# so it lets the user override the agent.cfg by mapping /data/agent to
# a local folder eg setups/ccs-pa/volumes/agent. 
#
# so if you want plain xml output, you'd need to comment out the xsl
# file references from the agent.cfg file.

#----------------------------------------------------------------------------
# define base layer
#----------------------------------------------------------------------------

FROM ladder99/agent-base:latest AS compile

#----------------------------------------------------------------------------
# run app
#----------------------------------------------------------------------------

# multi-stage build - bring only essentials from previous layers

FROM ubuntu:21.04

# install ruby for simulator
RUN apt-get update && apt-get install -y \
  ruby \
  && rm -rf /var/lib/apt/lists/*

# change to a new non-root user for better security.
# this also adds the user to a group with the same name.
# --create-home creates a home folder, ie /home/<username>
RUN useradd --create-home agent
USER agent

# copy agent app and simulator files from previous layers
COPY --chown=agent:agent --from=compile /usr/local/bin/agent /usr/local/bin
COPY --chown=agent:agent --from=compile /etc/mtconnect /etc/mtconnect

# bring in our stylesheets from this repo
COPY --chown=agent:agent styles /etc/mtconnect/styles

# expose port
EXPOSE 5000

WORKDIR /etc/mtconnect

# default command - can override with docker run or docker-compose command.
# this runs the adapter simulator and the agent using the sample config file.
# note: must use shell form here instead of exec form, since we're running 
# multiple statements using shell commands (& and &&).
# see https://stackoverflow.com/questions/46797348/docker-cmd-exec-form-for-multiple-command-execution
CMD /usr/bin/ruby /etc/mtconnect/simulator/run_scenario.rb -l \
  /etc/mtconnect/simulator/VMC-3Axis-Log.txt & \
  cd /etc/mtconnect/simulator && agent debug agent.cfg
