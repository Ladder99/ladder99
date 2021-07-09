# Agent

Ladder99 Agent is a Docker image of the MTConnect Agent, which receives data from a device adapter, fits key-value pairs into an xml tree, and serves output as XML or HTML.

See https://github.com/mtconnect/cppagent

## Running

Install Docker, if not already on your system - https://docs.docker.com/get-docker/.

Then start the Agent with the default CNC simulation -

    docker run -it --rm -p 5000:5000 --pull always \
        ladder99/agent:latest

then view the output in your browser at http://localhost:5000 or http://raspberrypi.local:5000 or similar.

To run with your own configuration, point the Agent to a folder containing your agent.cfg file etc, e.g.

    docker run -it --rm -p 5000:5000 --pull always \
        -v $(pwd)/agent:/etc/agent \
        ladder99/agent:latest agent

<!-- test this ^ -->

## Styles

The HTML output is defined in the styles folder, using XSL to transform the default XML output. The XSL is adapted/extended from https://github.com/TrakHound/MTConnect-Agent-Stylesheet.

## XML

To see the default XML output, you can omit the files sections from your agent.cfg file.

## Building

### Install

To build the image and upload to Docker Hub, first install Docker and Buildx, the multiarchitecture build tool -

    sh/install/docker
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

## Contributing

If you come across an issue with the image, or have a suggestion for improvement, you can file an issue here - https://github.com/Ladder99/ladder99/issues.

## License

MIT
