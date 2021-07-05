## Installing

First install Docker, if not already on your system - https://docs.docker.com/get-docker/.

or if on Debian/Ubuntu -

    shell/install-docker

Then install the multiarchitecture build tool, buildx - 

    shell/install-multiarch

Then clone this repository - 

    git clone https://github.com/Ladder99/mtconnect-agent
    cd mtconnect-agent


## Building

Build the agent image for different architectures - (must do these separately as encountered problems both during compilation and with the resulting images if tried to do all at once) - do amd64 first, as others require emulation and take longer -

    shell/build linux/amd64
    shell/build linux/arm64
    shell/build linux/arm/7


## Testing

Merge the images and deploy them to Docker Hub with the :test tag - 

    shell/deploy :test linux/amd64,linux/arm/7,linux/arm64

To test the image, run it on the different architectures with

    docker run -it --rm -p 5000:5000 --pull always \
        ladder99/mtconnect-agent:test

then check with a browser at e.g. http://localhost:5000 or http://raspberrypi.local:5000, etc.


## Deploying

If all work okay, tag the image with :latest and deploy

    shell/deploy :latest linux/amd64,linux/arm/7,linux/arm64

Then obtain the current MTConnect Agent version number from here - https://github.com/mtconnect/cppagent/blob/master/CMakeLists.txt, and tag the image with that - e.g. 

    shell/deploy :1.7.0.3 linux/amd64,linux/arm/7,linux/arm64

Then check that the images are up on Docker Hub at https://hub.docker.com/repository/docker/ladder99/mtconnect-agent, and remove the :test image.

