import csv
import sys


sourcefile=sys.argv[1]

reader = csv.reader(open(sourcefile,"rb"),delimiter=",")
print "DELETE FROM SCHEDULE;";
for row in reader:
	imo = row[0]
	name = row[1].replace("'"," ")
	locode = row[2].replace("'"," ")
	port = row[3].replace("'"," ")
	date_start = row[4]
	date_end = row[5]
	if (imo == ""):	 imo = "NULL"
	print  "INSERT INTO SCHEDULE (imo, name, port, locode, date_start, date_end) values ("+imo+",'"+name+"','"+port+"','"+locode+"','"+date_start+"','"+date_end+"');"
print ("UPDATE SCHEDULE s SET ship_id = (SELECT ship_id FROM ship v where v.imo = s.imo);")
print ("update schedule s set port_id = (select port_id from port p where p.locode = s.locode limit 1)")


