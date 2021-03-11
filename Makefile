
elevator = parts/elevator

# target: help - Display callable targets
help:
	egrep "^# target:" [Mm]akefile

# target: devices.xml - build xml from yaml definition
$(elevator)/config/devices.xml: $(elevator)/config/devices.yaml
	node $(elevator)/code/src/index.js $(elevator)/config/devices.yaml
