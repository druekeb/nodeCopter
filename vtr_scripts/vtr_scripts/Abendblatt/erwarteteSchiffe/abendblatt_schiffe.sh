#!/bin/bash
LC_ALL=de_DE.utf8
PSQL_OPTIONS="-P format=unaligned -q"
#PSQL_OPTIONS=" -q"
#PSQL_OPTIONS="-P format=unaligned --field-separator $'\t' -q"
PSQL="/usr/bin/psql"
USER=wateropt
DATABASE=wateropt

QUERY_EXPECTED="select sd.name as Name, st.name as Typ, b.name as Liegeplatz,   sd.nationality as Nationalitaet, sd.grt as BRZ, sd.length as Laenge, t.name as Status
	from shipaction a
	join ship s on s.id = a.ship_id
	join shipactiontype t on t.shipactiontype_id = a.type
	join berth b on b.id = a.berth_id
	join shipdetails sd on sd.ship_id = s.id
	join shiptype st on st.id = s.shiptype_id
	left outer join shipactiontime eta on eta.shipaction_id = a.id
	where a.datasource_id = 3
	and a.time_finished is null
	and sd.datasource_id = 3
	and (eta.description is null or eta.description = 'ETA')
	and t.name = 'Expected'
	and sd.nationality is not null
	and b.name != 'Unbekannt'
	and b.name != 'Unknown Berth'
	and sd.length > 80
	and eta.time > current_timestamp and eta.time < current_timestamp + interval '32 hours'
	order by status, eta;"

QUERY_INCOMING="select distinct sd.name as Name, st.name as Typ, b.name as Liegeplatz, sd.nationality as Nationaliät, sd.grt as BRZ, sd.length as Länge, t.name as Status
	from shipaction a
	join ship s on s.id = a.ship_id
	join shipactiontype t on t.shipactiontype_id = a.type
	join berth b on b.id = a.berth_id
	join shipdetails sd on sd.ship_id = s.id
	join shiptype st on st.id = s.shiptype_id
	join shipactiontime eta on eta.shipaction_id = a.id
	where a.datasource_id = 3
	and a.time_finished is null
	and sd.datasource_id = 3
	and b.name != 'Unbekannt'
	and b.name != 'Unknown Berth'
	and sd.nationality is not null
	and sd.length > 80
	and t.name = 'Incoming'
	order by sd.name;"

QUERY_MOORED="select sd.name as Name, st.name as Typ, b.name as Liegeplatz, sd.nationality as Nationalität, sd.grt as BRZ, sd.length as Länge, t.name as Status
	from shipaction a
	join ship s on s.id = a.ship_id
	join shipactiontype t on t.shipactiontype_id = a.type
	join berth b on b.id = a.berth_id
	join shipdetails sd on sd.ship_id = s.id
	join shiptype st on st.id = s.shiptype_id left outer
	join shipactiontime eta on eta.shipaction_id = a.id
	where a.datasource_id = 3
	and a.time_finished is null
	and sd.length > 80
	and b.name != 'Unbekannt'
	and b.name != 'Unknown Berth'
	and sd.nationality is not null
	and sd.datasource_id = 3
	and (a.time_created > current_timestamp - interval '12 hours')
	and t.name = 'Moored' order by a.time_created;"

echo "Schiffe, die in den nächsten 32 Stunden fuer Hamburg erwartet werden" > /scripts/abendblatt_mail.txt
echo "" >> /scripts/abendblatt_mail.txt
$PSQL -F $'\t' $PSQL_OPTIONS -U $USER -d $DATABASE -c "${QUERY_EXPECTED}" >> /scripts/abendblatt_mail.txt
echo "" >> /scripts/abendblatt_mail.txt
echo "" >> /scripts/abendblatt_mail.txt
echo "" >> /scripts/abendblatt_mail.txt

echo "Schiffe, die jetzt gerade auf dem Weg nach Hamburg sind" >> /scripts/abendblatt_mail.txt
echo "" >> /scripts/abendblatt_mail.txt
$PSQL -F $'\t' $PSQL_OPTIONS -U $USER -d $DATABASE -c "${QUERY_INCOMING}" >> /scripts/abendblatt_mail.txt

echo "" >> /scripts/abendblatt_mail.txt
echo "" >> /scripts/abendblatt_mail.txt
echo "" >> /scripts/abendblatt_mail.txt

echo "Schiffe, die in den letzten 12 Stunden in Hamburg eingelaufen sind " >> /scripts/abendblatt_mail.txt
echo "" >> /scripts/abendblatt_mail.txt
$PSQL -F $'\t' $PSQL_OPTIONS -U $USER -d $DATABASE -c "${QUERY_MOORED}" >> /scripts/abendblatt_mail.txt




echo "Tägliche Schiffsmeldungen von vesseltracker.com -  Stand: `date`" | mail -s "Schiffe in Hamburg von vesseltracker.com" -r leuschner@vesseltracker.com -c leuschner@vesseltracker.com,drueke@vesseltracker.com,bullemer@vesseltracker.com,Felix.Bellinger@axelspringer.de -a /scripts/abendblatt_mail.txt steffen.grix@axelspringer.de
 

