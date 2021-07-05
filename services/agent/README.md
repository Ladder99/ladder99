# ladder99-agent

<!-- note: if this readme changes much, copy/paste it into the dockerhub readme. autobuild doesn't handle multiarch yet, so must do this manually for now. -->

The MTConnect Agent is a C++ program that receives data from a device adapter, fits key-value pairs into an xml tree, and serves output as XML or HTML.

See https://github.com/mtconnect/cppagent

MTConnect standardizes factory device data flow and vocabulary - it was started by UC Berkeley, Georgia Institute of Technology, and Sun Microsystems in 2008.

See https://mtconnect.org

Ladder99 is a free and open source pipeline that transfers data from factory devices to a database and end-user visualizations using MTConnect, an open standard.

See https://github.com/Ladder99/ladder99

## Running

Install Docker, if not already on your system - https://docs.docker.com/get-docker/.

Then start the MTConnect Agent with the default CNC simulation -

    docker run -it --rm -p 5000:5000 --pull always \
        ladder99/mtconnect-agent:latest

or run with your own configuration - first set MTCONNECT to the absolute path to a folder containing your agent.cfg file etc, e.g.

    export MTCONNECT=$HOME/data/mtconnect

    docker run -it --rm -p 5000:5000 --pull always \
        -v $MTCONNECT:/etc/mtconnect \
        ladder99/mtconnect-agent:latest agent

Now you can view the agent in your browser at http://localhost:5000 or http://raspberrypi.local:5000 or similar.

## Building

To build the image and upload to Docker Hub, see BUILDING.md.

## GitHub

This repository is on GitHub at https://github.com/Ladder99/mtconnect-agent.

The Dockerfile itself is at https://github.com/Ladder99/mtconnect-agent/blob/main/Dockerfile

## Styles

The CSS styles are adapted with thanks from https://github.com/TrakHound/MTConnect-Agent-Stylesheet.

## Contributing

If you come across an issue with the image, or want to expand the architectures built for, or have a suggestion for improvement, please file an issue here - https://github.com/Ladder99/mtconnect-agent/issues.

## License

MIT
