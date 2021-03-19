# see https://hub.docker.com/r/raymondhub/mtconnect

FROM raymondhub/mtconnect:v1.5

EXPOSE 5000

#. might need this dockerfile to handle the custom stylesheets?

# WORKDIR /etc/mtconnect/agent

# COPY config/* .

CMD ["agent", "debug", "/etc/mtconnect/agent-custom/agent.cfg"]
