
elevator = parts/elevator

all: devicesxml

devicesxml: parts/elevator/config/devices.xml

# target: devices.xml - build xml from yaml definition
devices.xml: devices.yaml
	node ../code/src/index.js devices.yaml
	cp devices.xml ../../agent/config

# target: help - Display callable targets
help:
	egrep "^# target:" [Mm]akefile

