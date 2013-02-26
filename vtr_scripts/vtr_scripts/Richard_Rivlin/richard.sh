#!/bin/bash

# Schickt alle geänderten Schiffsstammdaten an Richard Rivlin
# @author: Thorsten Stehr
# @date  : 2011-01-06

PFAD="/scripts/data/"
NAME="richard_rivlin"
FILENAME="${NAME}.csv"
ZIPFILENAME="${NAME}.zip"

#Datum und Uhrzeit der letzten Datei ermitteln
DATUM=`stat -c %y ${PFAD}/richard_rivlin.csv`

#Datenbankabfrage
psql -P format=unaligned --field-separator "|" -U ais -d vesseltracker -c "select name, mmsi, imo, callsign, length, width, ais_shiptype_id from ship where last_seen is not null and mmsi is not null and name is not null and length(name) > 1 and time_updated > '${DATUM}' and mmsi > 99999999 and mmsi < 1000000000 and imo is not null and checkimo(imo) order by name;" > ${PFAD}${FILENAME}


#Altes zipfile löschen
rm ${PFAD}${ZIPFILENAME}

#Datei zippen
cd ${PFAD}
zip -q ${ZIPFILENAME} ${FILENAME}

#Zip-File per Mail verschicken
echo "Daily vessel data" | /usr/bin/mail -r leuschner@vesseltracker.com -s "Daily vessel data" -c stehr@vesseltracker.com -a ${PFAD}${ZIPFILENAME} leuschner@vesseltracker.com
