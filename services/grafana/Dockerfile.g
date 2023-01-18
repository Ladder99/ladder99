# In the Grafana GitHub repository there is a folder called packaging/docker/custom/, 
# which includes two Dockerfiles, Dockerfile and ubuntu.Dockerfile, that can be used to 
# build a custom Grafana image. It accepts GRAFANA_VERSION, GF_INSTALL_PLUGINS, 
# and GF_INSTALL_IMAGE_RENDERER_PLUGIN as build arguments:
#
# cd packaging/docker/custom
# docker build \
#   --build-arg "GRAFANA_VERSION=latest" \
#   --build-arg "GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource" \
#   -t grafana-custom -f Dockerfile .
# docker run -d -p 3000:3000 --name=grafana grafana-custom
#
# from https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/#building-a-custom-grafana-image-with-pre-installed-plugins
# and https://github.com/grafana/grafana/blob/main/packaging/docker/custom/Dockerfile


ARG GRAFANA_VERSION="latest"

FROM grafana/grafana:${GRAFANA_VERSION}

ARG GF_INSTALL_IMAGE_RENDERER_PLUGIN="false"

ARG GF_GID="0"

ENV GF_PATHS_PLUGINS="/var/lib/grafana-plugins"
ENV GF_PLUGIN_RENDERING_CHROME_BIN="/usr/bin/chrome"

USER root

RUN mkdir -p "$GF_PATHS_PLUGINS" && \
  chown -R grafana:${GF_GID} "$GF_PATHS_PLUGINS" && \
  if [ $GF_INSTALL_IMAGE_RENDERER_PLUGIN = "true" ]; then \
  if grep -i -q alpine /etc/issue; then \
  apk add --no-cache udev ttf-opensans chromium && \
  ln -s /usr/bin/chromium-browser "$GF_PLUGIN_RENDERING_CHROME_BIN"; \
  else \
  cd /tmp && \
  curl -sLO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
  DEBIAN_FRONTEND=noninteractive && \
  apt-get update -q && \
  apt-get install -q -y ./google-chrome-stable_current_amd64.deb && \
  rm -rf /var/lib/apt/lists/* && \
  rm ./google-chrome-stable_current_amd64.deb && \
  ln -s /usr/bin/google-chrome "$GF_PLUGIN_RENDERING_CHROME_BIN"; \
  fi \
  fi

USER grafana

RUN if [ $GF_INSTALL_IMAGE_RENDERER_PLUGIN = "true" ]; then \
  grafana-cli \
  --pluginsDir "$GF_PATHS_PLUGINS" \
  --pluginUrl https://github.com/grafana/grafana-image-renderer/releases/latest/download/plugin-linux-x64-glibc-no-chromium.zip \
  plugins install grafana-image-renderer; \
  fi

ARG GF_INSTALL_PLUGINS=""

RUN if [ ! -z "${GF_INSTALL_PLUGINS}" ]; then \
  OLDIFS=$IFS; \
  IFS=','; \
  for plugin in ${GF_INSTALL_PLUGINS}; do \
  IFS=$OLDIFS; \
  if expr match "$plugin" '.*\;.*'; then \
  pluginUrl=$(echo "$plugin" | cut -d';' -f 1); \
  pluginInstallFolder=$(echo "$plugin" | cut -d';' -f 2); \
  grafana-cli --pluginUrl ${pluginUrl} --pluginsDir "${GF_PATHS_PLUGINS}" plugins install "${pluginInstallFolder}"; \
  else \
  grafana-cli --pluginsDir "${GF_PATHS_PLUGINS}" plugins install ${plugin}; \
  fi \
  done \
  fi
