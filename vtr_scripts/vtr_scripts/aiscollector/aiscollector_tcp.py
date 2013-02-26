#!/usr/bin/python 
#
# AIS-Collector TCP v0.1 (Februar 2010)
#
# Sammelt NMEA-Daten von mehreren Sendern per TCP ein, und leitet sie ueber 
# eine TCP-Verbindung an AISClient weiter. Dabei wird darauf geachtet, 
# mehrteilige NMEA-Nachrichten zusammen zu halten.
#
# Autor: Bastian Voigt
#

import socket
import re
import sys
import select


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
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("", listener_port)) 
    s.listen(5)
except:
    print >>sys.stderr, "Fehler: Konnte TCP-Lauscher-Socket nicht auf Port %d aufmachen" % listener_port
    sys.exit(1)

# Hauptschleife
inputBuffers = {}
nachricht = {}
connections = {}
try: 
    while True: 
        # Versuche neue Verbindung zu akzeptieren
        s.setblocking(False)
        try:
            print "wait conn"
            ready_read, ready_write, in_error = select.select([s],[s],[],1)
            print "done wait conn"
            if(len(ready_read)>0):
                conn,address = s.accept()
                if conn != None:
                    connections[conn] = address
                    conn.setblocking(True)
        except socket.error:
            if(len(connections)==0):
                continue

        # Input aus einem der verbundenen Sockets lesen und in entsprechenden Puffer schreiben
        print "wait data"
        ready_read,ready_write,in_error = select.select(connections.keys(), [], [], 1)
        print "done wait data"
        for readysocket in ready_read:
            daten = readysocket.recv(1024)
            addr = connections[readysocket]
        
            try:
                inputBuffers[readysocket] += daten
            except KeyError:
                print "New connection from %s:%d" % (addr[0], addr[1])
                inputBuffers[readysocket] = daten

            # Vollstaendige NMEA-Nachrichten im Puffer finden und weitersenden
            matchObj = lineEnd.search(inputBuffers[readysocket])
            while(matchObj != None):
                # Zeile aus Buffer lesen
                zeile = inputBuffers[readysocket][:matchObj.start()]
                inputBuffers[readysocket] = inputBuffers[readysocket][matchObj.end():]

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
                    matchObj = lineEnd.search(inputBuffers[readysocket])
                    continue

                # Vollstaendige Nachricht an AISClient rausschicken
                print "From %s:%d: %s" % (addr[0], addr[1], nachricht[addr])
                aisclient.send(nachricht[addr])
                nachricht[addr] = ""
                matchObj = lineEnd.search(inputBuffers[readysocket])

        
finally: 
    s.close()



