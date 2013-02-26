#!/bin/bash

while true; do
	echo "hole jakota daten ..."
	wget -q --timeout=60 -O aisvt.xml https://ssl-id1.de/jakota.org/?code=aisvt.xml
	gzip -f aisvt.xml
	echo "importiere jakota in vesseltracker ..."
	wget -q -O - --post-file aisvt.xml.gz http://www.vesseltracker.com/aisserver/servlet/XMLReceiverServlet
	rm aisvt.xml.gz
	echo "gehe schlafen"
	sleep 90
done
