FROM grafana/grafana:8.2.2

# add plugins
RUN grafana-cli plugins install natel-discrete-panel && \
  grafana-cli plugins install natel-plotly-panel && \
  grafana-cli plugins install michaeldmoore-scatter-panel && \
  grafana-cli plugins install dalvany-image-panel
