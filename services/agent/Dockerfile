# Ladder99 Agent Docker image build instructions
# This adds some custom xsl stylesheets on top of the MTConnect Agent
# Adapted from http://mtcup.org/wiki/Installing_C%2B%2B_Agent_on_Ubuntu
# See also services/mtconnect-agent for MTConnect Agent

FROM ladder99/mtconnect-agent:latest

# change to non-root user for better security
USER agent

# replace xsl/html/css stylesheets with our versions
RUN rm -r /etc/mtconnect/styles
COPY --chown=agent:agent styles /etc/mtconnect/styles

# update/add links to our stylesheet
RUN sed -i 's/Streams.xsl/styles.xsl/g' /etc/mtconnect/simulator/agent.cfg
RUN echo "DevicesStyle { Location = /styles/styles.xsl }" >> /etc/mtconnect/simulator/agent.cfg

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

#----------------------------------------------------------------------------
# notes
#----------------------------------------------------------------------------

# After setup, the dirs look like this -
#
# /etc/mtconnect
#  |-- schemas - mtconnect xsd files
#  |-- simulator - agent.cfg, simulator.rb, vmc-3axis.xml, log.txt - vmc sim
#  |-- styles - our styles.xsl, styles.css, favicon.ico, logo.png
#
# /usr/local/bin
#  |-- agent - the agent application
#
# the default simulator/agent.cfg has -
#   Devices = ../simulator/VMC-3Axis.xml
#   Files { styles { Path = ../styles } }
# see https://github.com/mtconnect/cppagent/blob/master/simulator/agent.cfg
#
# our pipeline docker-compose yaml has this for the agent service -
#   agent:
#     command: agent debug /data/agent/agent.cfg
#     volumes:
#       - ./$SETUP/volumes/agent:/data/agent # should have agent.cfg, agent.xml
#
# so it lets the user override the agent.cfg by mapping /data/agent to
# a local folder eg setups/test/print-apply/volumes/agent. 
