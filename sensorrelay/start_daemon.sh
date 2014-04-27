#!/bin/bash

NODE_JS_HOME=/home/pi/node-v0.10.26-linux-arm-pi
PATH=$PATH:$NODE_JS_HOME/bin

if screen -list | grep -q "sensorhub_daemon"; then
	echo "EXIT: Sensorhub already running..."
else
	echo "starting Sensorhub in a screen session..."
	screen -d -S sensorhub_daemon -m /home/pi/sensorhub/start.sh
fi