# ladder99-tape

Plays/records MQTT messages.

The recordings are csv files with structure:

    [msg.topic, payload, msg.qos, msg.retain, time_now, time_delta]

time_now and time_delta are in seconds
