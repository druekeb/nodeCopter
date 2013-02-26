#! /usr/bin/bash

#>> >> webmon.sh/webfilter.pl -- webmon.sh steurt den Aufruf des
#>> >> asadmin-Monitors für gewählte Web-Applikationen, webfilter.pl filtert
#>> >> die Ausgaben

/opt/glassfish-2ur2/bin/asadmin monitor --port 8484 --type webmodule --filter vtr_ear://server/ --interval 10 server | ./webfilter.pl
