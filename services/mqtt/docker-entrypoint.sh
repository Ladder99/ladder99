#!/bin/bash

# $@

# # trap ctrl-c and call ctrl_c()
# trap ctrl_c INT

# function ctrl_c() {
#   echo "** Trapped CTRL-C"
# }

# for i in `seq 1 5`; do
#   sleep 1
#   echo -n "."
# done

# $@
mqtt-recorder --host $HOST --port $PORT --mode $MODE --file $FILE
