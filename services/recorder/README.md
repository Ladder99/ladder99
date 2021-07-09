# ladder99-recorder

Plays/records device messages.

Eventually would like to handle different data types through plugins, eg mqtt, ...

The recordings are csv files with structure:

    [msg.topic, payload, msg.qos, msg.retain, time_now, time_delta]

time_now and time_delta are in seconds
