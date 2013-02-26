#!/usr/bin/perl
#Legt eine neue tracking-tabelle ab nächsten Montag bis übernächsten Montag an und ändert den Trigger
##Author: Basti + Martin
#Date: 2008-04-25
use DateTime;
use DBI;

$db = DBI->connect('DBI:Pg:dbname=vesseltracker','ais','') or die "Konnte nicht zur Datenbank verbinden $DBI::errstr" ;

$dt = DateTime->now;

#Wie lange noch bis Montag?
$offset = 8 - $dt->dow;
$start = $dt->clone;
$start->add(days=>$offset);
$ende = $start->clone;
$ende->add(days=>7);
$alt = $start->clone;
$alt->subtract(days=>7);

print "Alt " . $alt->ymd . "\n";
print "Aktuell " . $start->ymd . "\n";
print "Ende " . $ende->ymd . "\n";

#$start = DateTime->new(year=>$dt->year,month=>$dt->month,day=>$dt->day+$offset);

$old_tablename = "tracking_" . $alt->ymd('');
$tablename = "tracking_" . $start->ymd('');
$sql_create = "CREATE TABLE ".$tablename." (check (timestamp >= DATE '".$start->ymd."' AND timestamp < DATE '".$ende->ymd."')) inherits (tracking)";
$sql_fkey = "ALTER TABLE ".$tablename." ADD FOREIGN KEY (ship_id) REFERENCES ship(ship_id)";
$sql_time_index = "CREATE INDEX ".$tablename."_time_idx ON ".$tablename." USING btree (\"timestamp\")";
$sql_ship_index = "CREATE INDEX ".$tablename."_ship_idx ON ".$tablename." USING btree (\"ship_id\")";
$sql_unique = "ALTER TABLE ".$tablename." ADD UNIQUE (tracking_id)";



$trigger = 
	'CREATE OR REPLACE FUNCTION tracking_insert_trigger()'."\n" .
	'RETURNS TRIGGER AS $$' .  "\n" .
	'BEGIN' . "\n" .
	"IF ( NEW.timestamp >= DATE '".$start->ymd."' AND NEW.timestamp < DATE '".$ende->ymd."') "."\n".
		"THEN  INSERT INTO $tablename  VALUES (NEW.*); \n" .  
	"ELSIF ( NEW.timestamp >= DATE '".$alt->ymd."' AND NEW.timestamp < DATE '".$start->ymd."') \n".
		"THEN  INSERT INTO $old_tablename  VALUES (NEW.*); \n".  
	"ELSE RAISE EXCEPTION 'Für das Tracking-Datum gibt es keine passende Tracking-Partitionstabelle. Läaeuft der Cronjob noch?';" .
	" END IF; " .  "\n" .  
	" RETURN NULL; " .  "\n" .  
	" END; " .  "\n" .  
	' $$ ' .  "\n" .  
	" LANGUAGE plpgsql; " .  "\n" ;


#$db->do($sql_create) or die "Fehler beim Anlegen der Tabelle $DBI::errstr";
#$db->do($sql_fkey) or die "Fehler beim Anlegen Ship-FK $DBI::errstr";
#$db->do($sql_time_index) or die "Fehler beim Anlegen des Time-Indexes $DBI::errstr";
#$db->do($sql_ship_index) or die "Fehler beim Anlegen des Ship-Index $DBI::errstr";
#$db->do($sql_unique) or die "Fehler beim Anlegen des Unique Constraint $DBI::errstr";
$db->do($trigger) or die "Fehler beim Aendern der Trigger-Funktion fuers tracking $DBI::errstr";

$db->disconnect;








