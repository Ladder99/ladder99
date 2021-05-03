
# cd services/adapter && \
# PLATFORM=${1:'linux/amd64,linux/arm/v7,linux/arm64'} \
# docker buildx build \
#   --platform $PLATFORM \
#   --tag=adapter \
#   --load \
#   .
