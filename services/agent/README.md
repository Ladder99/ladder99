# ladder99-agent

MTConnect Agent (cppagent) is a C++ program that receives data from a device adapter, fits key-value pairs into an xml tree, and serves output as XML/HTML.

See https://github.com/mtconnect/cppagent

Ladder99 Agent is a Docker image for the MTConnect Agent which includes an HTML interface for the data.

## Running

Install Docker, if not already on your system - https://docs.docker.com/get-docker/.

Then start the MTConnect Agent with the default CNC simulation -

    docker run -it --rm -p 5000:5000 --pull always \
        ladder99/ladder99-agent:latest

To run with your own configuration, set AGENT to the absolute path to a folder containing your agent.cfg file etc, e.g.

    export AGENT=$(pwd)/agent

    docker run -it --rm -p 5000:5000 --pull always \
        -v $AGENT:/etc/agent \
        ladder99/ladder99-agent:latest agent

Now you can view the agent in your browser at http://localhost:5000 or http://raspberrypi.local:5000 or similar.

## Building

To build the image and upload to Docker Hub, first install Docker, if not already on your system - https://docs.docker.com/get-docker/.

or if on Debian/Ubuntu -

    sh/install/docker

Then install the multiarchitecture build tool, buildx -

    sh/install/docker-multiarch

and clone this repository -

    git clone https://github.com/Ladder99/ladder99
    cd ladder99

## Building

Build the agent image for different architectures - (must do these separately as encountered problems both during compilation and with the resulting images if tried to do all at once) - do amd64 first, as others require emulation and take longer -

    services/agent/sh/build linux/amd64
    services/agent/sh/build linux/arm64
    services/agent/sh/build linux/arm/7

## Testing

Merge the images and deploy them to Docker Hub with the :test tag -

    services/agent/sh/deploy :test linux/amd64,linux/arm/7,linux/arm64

To test the image, run it on the different architectures with

    docker run -it --rm -p 5000:5000 --pull always \
        ladder99/mtconnect-agent:test

then check with a browser at e.g. http://localhost:5000 or http://raspberrypi.local:5000, etc.

## Deploying

If all work okay, tag the image with :latest and deploy

    services/agent/sh/deploy :latest linux/amd64,linux/arm/7,linux/arm64

Then obtain the current MTConnect Agent version number from here - https://github.com/mtconnect/cppagent/blob/master/CMakeLists.txt, and tag the image with that - e.g.

    services/agent/sh/deploy :1.7.0.3 linux/amd64,linux/arm/7,linux/arm64

Then check that the images are up on Docker Hub at https://hub.docker.com/repository/docker/ladder99/mtconnect-agent, and remove the :test image.

## Styles

The CSS styles are adapted from https://github.com/TrakHound/MTConnect-Agent-Stylesheet.

## Contributing

If you come across an issue with the image, or want to expand the architectures built for, or have a suggestion for improvement, please file an issue here - https://github.com/Ladder99/ladder99/issues.

## License

MIT
