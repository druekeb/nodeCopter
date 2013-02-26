#!/usr/bin/python 
#
# AIS-Collector UDP v0.1 (Februar 2010)
#
# Sammelt NMEA-Daten von mehreren Sendern per UDP ein, und leitet sie ueber 
# eine TCP-Verbindung an AISClient weiter. Dabei wird darauf geachtet, 
# mehrteilige NMEA-Nachrichten zusammen zu halten.
#
# Autor: Bastian Voigt
#

import socket
import re
import sys

# Konfiguration
aisclient_ip = "127.0.0.1"
aisclient_port = 1717
listener_port = 12345
lineEnd = re.compile("[\r\n\0]+")

# Verbindung zum AISClient aufbauen
try:
    aisclient = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    aisclient.connect((aisclient_ip,aisclient_port))
except:
    print >>sys.stderr, "Fehler: Konnte nicht zum AISCLient %s:%d verbinden" % (aisclient_ip, aisclient_port)
    sys.exit(1)

# Listener Socket initialisieren
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.bind(("", listener_port)) 
except:
    print >>sys.stderr, "Fehler: Konnte UDP-Lauscher-Socket nicht auf Port %d aufmachen" % listener_port
    sys.exit(1)

# Hauptschleife
inputBuffers = {}
nachricht = {}
try: 
    while True: 

        # Input aus Socket lesen und in entsprechenden Puffer schreiben
        daten, addr = s.recvfrom(1024)
        try:
            inputBuffers[addr] += daten
        except KeyError:
            print "New connection from %s:%d" % (addr)
            inputBuffers[addr] = daten

        # Vollstaendige NMEA-Nachrichten im Puffer finden und weitersenden
        matchObj = lineEnd.search(inputBuffers[addr])
        while(matchObj != None):
            # Zeile aus Buffer lesen
            zeile = inputBuffers[addr][:matchObj.start()]
            inputBuffers[addr] = inputBuffers[addr][matchObj.end():]

            # Zeile zu nachricht adden
            try:
                nachricht[addr] += zeile + "\r\n"
            except KeyError:
                nachricht[addr] = zeile + "\r\n"

            # Pruefen ob nachricht vollstaendig
            nmea = zeile.split(",")
            if(len(nmea)<3):
                print "Addr %s:%d, Ignoriere kaputte Nachricht: %s" % (addr[0], addr[1], nachricht[addr])
                nachricht[addr]=""
                break
            if(int(nmea[1])>int(nmea[2])):
                print "Addr %s:%d, Nachricht noch nicht vollstaendig: %s" % (addr[0], addr[1], nachricht[addr])
                matchObj = lineEnd.search(inputBuffers[addr])
                continue

            # Vollstaendige Nachricht an AISClient rausschicken
            print "From %s:%d: %s" % (addr[0], addr[1], nachricht[addr])
            aisclient.send(nachricht[addr])
            nachricht[addr] = ""
            matchObj = lineEnd.search(inputBuffers[addr])

        
finally: 
    s.close()



