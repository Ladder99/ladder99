# MQTT recordings

made by mqtt-recorder, a Python app

The recordings are csv files with structure:

    [msg.topic, payload, qos, retain, time_now, time_delta]

- run0 - q0.0 on/off, some faults on/off
- run1 - continuous run of 37 labels until out of data
- run2 - setup, setting changes, attempt start without data
- run3 - try print with printer offline
- run4 - pneumatic failure
- run5 - printer failure
- run6 - motor failure
- run7 - multiple faults

File sizes

- run0.csv 15089
- run1.csv 317044
- run2.csv 7688
- run3.csv 24281
- run4.csv 38895
- run5.csv 48252
- run6.csv 83757
- run7.csv 35466
