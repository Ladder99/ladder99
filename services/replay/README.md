# ladder99-replay

Replay MQTT recordings made by mqtt-recorder, a Python library.

The recordings are csv files with structure:

    [msg.topic, payload, msg.qos, msg.retain, time_now, time_delta]
