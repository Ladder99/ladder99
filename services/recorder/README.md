# Ladder99 Recorder

Plays/records device messages.

This is a work in progress.

Eventually would like to handle different data types through plugins, eg mqtt.

Entry point is src/index.js.

## Recording

To record data from devices, eg

    sh/start -d ../client-nis/setup record

It may show errors due to missing plugins, but this is okay.

The recordings are files like `schemas/<schema>/recordings/<datetime>.csv`, with structure:

    [msg.topic, payload, msg.qos, msg.retain, time_now, time_delta]

time_now and time_delta are in seconds

To stop recording,

    docker stop record

## Playback

To play back some device data, eg

    sh/start -d ../client-nis/setup play

To stop playback,

    docker stop play

## License

Apache 2.0
