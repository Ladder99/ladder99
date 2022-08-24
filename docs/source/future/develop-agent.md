# Development

(cross-platform builds are best done now using github workflows)

## Agent

### Install

To build the image and upload to Docker Hub, first install Docker Buildx, the multiarchitecture build tool -

    sh/install/docker-multiarch

then clone this repository -

    git clone https://github.com/Ladder99/ladder99
    cd ladder99

### Build

Build the agent image for different architectures - (must do these separately as encountered problems both during compilation and with the resulting images if tried to do all at once) - do amd64 first, as others require emulation and take longer -

    sh/agent/build linux/amd64
    sh/agent/build linux/arm64
    sh/agent/build linux/arm/7

### Test

Merge the images and deploy them to Docker Hub with the :test tag -

    sh/agent/deploy :test linux/amd64,linux/arm/7,linux/arm64

To test the image, run it on the different architectures with

    docker run -it --rm -p 5000:5000 --pull always \
        ladder99/agent:test

### Deploy

If all work okay, tag the image with :latest and deploy -

    sh/agent/deploy :latest linux/amd64,linux/arm/7,linux/arm64

Then obtain the current MTConnect Agent version number from here - https://github.com/mtconnect/cppagent/blob/master/CMakeLists.txt, and tag the image with that also - e.g.

    sh/agent/deploy :1.7.0.3 linux/amd64,linux/arm/7,linux/arm64

Then check that the images are up on Docker Hub at https://hub.docker.com/repository/docker/ladder99/mtconnect-agent, and remove the :test image.

### Contributing

If you come across an issue with the image, or have a suggestion for improvement, you can file an issue here - https://github.com/Ladder99/ladder99/issues.
