# dockerfile to build grafana image with plugins included.
# see services/docker-compose.yaml grafana section for more info.

#. can't upgrade beyond 8.3.5 yet - get 'Origin not allowed' error on dash,
# due to running through traefik and teleport? how fix?
# see https://github.com/grafana/grafana/issues/45117
# see https://grafana.com/tutorials/run-grafana-behind-a-proxy/#configure-traefik
# see https://goteleport.com/docs/application-access/getting-started/
FROM grafana/grafana:8.2.2
# FROM grafana/grafana-oss:9.1.0

# add plugins
RUN grafana-cli plugins install natel-discrete-panel && \
  grafana-cli plugins install natel-plotly-panel && \
  grafana-cli plugins install michaeldmoore-scatter-panel && \
  grafana-cli plugins install dalvany-image-panel
