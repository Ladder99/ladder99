# Capture fault types and times

from https://app.clickup.com/t/h4wwje

bash

    sudo cp ./telegraf.conf /var/lib/docker/volumes/pi_telegraf_conf/_data/telegraf.conf

influx

    drop database udp
    create database udp

    # seed data
    select * from pgm0
    create retention policy rp1 on udp duration 1w replication 1 default

bash

    du -sh /var/lib/influxdb/data/*

