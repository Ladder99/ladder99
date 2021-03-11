
# target: help - Display callable targets
help:
	egrep "^# target:" [Mm]akefile

# target: devices.xml - build xml from yaml definition
devices.xml: devices.yaml
	node ../code/src/index.js devices.yaml
	cp devices.xml ../../agent/config
