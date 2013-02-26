#!/usr/bin/perl
#Legt alte Tracking-Tabellen ab dem vorgegebenen Datum bis heute an und erstellt einen
#Trigger zum einfügen alter Daten
#
#Author: Basti + Martin
#Date: 2008-04-25

use DateTime;
use DBI;

#Verbinden zu localhost
$db = DBI->connect('DBI:Pg:dbname=vesseltracker','root','') or die "Konnte nicht zur Datenbank verbinden $DBI::errstr" ;

#Wann soll die erste tracking-tabelle angelegt werden? (der montag nach diesem Datum)
$start_year = 2007;
$start_month= 12;
$start_day = 24;


#aktuelles datum initialisieren
$akt_date = DateTime->new(year=>$start_year, month=>$start_month, day=>$start_day);
$now = DateTime->now;

#Erster Teil vom trigger
$trigger = 'CREATE OR REPLACE FUNCTION tracking_insert_trigger() RETURNS TRIGGER AS $$ ' . "\n" .  
           ' BEGIN ' .  "\n"; 

$num_trigger = 0;

while (DateTime->compare($akt_date,$now) < 0)
{
  #Wie lange noch bis Montag?
  $offset = 8 - $akt_date->dow;
  $start = $akt_date->clone;
  $start->add(days=>$offset);
  $ende = $start->clone;
  $ende->add(days=>7);
  $alt = $start->clone;
  $alt->subtract(days=>7);

  $old_tablename = "tracking_" . $alt->ymd('');
  $tablename = "tracking_" . $start->ymd('');
  $sql_create = "CREATE TABLE ".$tablename." (check (timestamp >= DATE '".$start->ymd."' AND timestamp < DATE '".$ende->ymd."')) inherits (tracking)";
  $sql_fkey = "ALTER TABLE ".$tablename." ADD FOREIGN KEY (ship_id) REFERENCES ship(ship_id)";
  $sql_time_index = "CREATE INDEX ".$tablename."_time_idx ON ".$tablename." USING btree (\"timestamp\")";
  if ($num_trigger == 0)
  {
    $trigger .= " IF ";
  }
  else
  {
    $trigger .= " ELSIF ";
  }

  $num_trigger ++;

  $trigger .= "( NEW.timestamp >= DATE '".$start->ymd."' AND NEW.timestamp < DATE '".$ende->ymd."') THEN  INSERT INTO $tablename  VALUES (NEW.*); " .  "\n";   
	     
  print $sql_create . "\n";
  print $sql_fkey . "\n";
  print $sql_time_index . "\n\n";




  $db->do($sql_create) or die "Fehler beim Anlegen der Tabelle $DBI::errstr";
  $db->do($sql_fkey) or die "Fehler beim Anlegen Ship-FK $DBI::errstr";
  $db->do($sql_time_index) or die "Fehler beim Anlegen des Time-Indexes $DBI::errstr";
  
  #Aktuelles Datum um eine Woche nach hinten schieben
  $akt_date->add(days=>7);
}


$trigger .= " ELSE RAISE EXCEPTION 'Für das Tracking-Datum gibt es keine passende Tracking-Partitionstabelle. Läuft der Cronjob noch?';" .  "\n" .  
             " END IF; " .  "\n" .  
             " RETURN NULL; " .  "\n" .  
             " END; " .  "\n" .  
	     ' $$ ' .  "\n" .  
	     " LANGUAGE plpgsql; " .  "\n" ;

print $trigger . "\n";
$db->do($trigger) or die "Fehler beim Ändern der Trigger-Funktion fürs tracking $DBI::errstr";
$db->disconnect;








