http://docs.oracle.com/cd/E19159-01/
http://docs.oracle.com/cd/E19159-01/819-3671/ablur/index.html

Monitor:
- asadmin-prozess läuft ständig und macht periodische Ausgaben
- Sollte auf einer anderen Maschine gestartet werden, da es zu viel Performance frisst

******************************************************************************
Ziel: 
- JDBC-Monitor starten

./asadmin  monitor --host app01 --port 4848 --user admin --type jdbcpool --filename jdbc.log  --interval 5 server
Please enter the admin password>
                     JDBC Pool Monitoring: VesseltrackerPool
WaitTime      ConnReq                                  ConnFree                                 ConnUsed
avg      low   hi    cur   acq   crt   des   fai   low   hi    cur   rej   rel   suc   to    low   hi    cur   wai  
0        0     3893  0     165469586 646   598   0     0     48    47    0     165469585 0     0     0     48    1     0

jdbc.log
AverageConnWaitTime,ConnRequestWaitTime:low,ConnRequestWaitTime:hi,ConnRequestWaitTime:current,NumConnAcquired,NumConnCreated,NumConnDestroyed,NumConnFailedValidation,NumConnFree:low,NumConnFree:hi,NumConnFree:current,NumConnRejected,NumConnReleased,NumConnSuccessfullyMatched,NumConnTimedOut,NumConnUsed:low,NumConnUsed:hi,NumConnUsed:current,NumConnServed
0,0,3893,0,165614907,648,600,0,0,48,46,0,165614906,0,0,0,48,1,0
0,0,3893,0,165624079,648,600,0,0,48,41,0,165624073,0,0,0,48,6,0
0,0,3893,0,165637232,648,600,0,0,48,47,0,165637232,0,0,0,48,0,0
0,0,3893,0,165642795,648,600,0,0,48,45,0,165642793,0,0,0,48,2,0
0,0,3893,0,165652061,648,600,0,0,48,39,0,165652053,0,0,0,48,8,0
0,0,3893,0,165657238,648,600,0,0,48,42,0,165657233,0,0,0,48,5,0
0,0,3893,0,165668321,648,600,0,0,48,41,0,165668315,0,0,0,48,6,0
0,0,3893,0,165679062,648,600,0,0,48,42,0,165679057,0,0,0,48,5,0

ConnRequestWaitTime => Warten auf neue Connection
48,5,0
Max= 48
Used = 5 => sollte nicht an 48 ran
Queue = 0

************************************************************************************************
- Servlet-Auswertung starten
Auflisten:
./asadmin list --host app01 --monitor server.* --user admin
./asadmin get -m 'server.applications.vtr_ear.aisweb\.war.server.aisweb.*'

Requestrate
Verarbeitungszeit
Fehlerrate...

asadmin get -m 'server.applications.vtr_ear.aisweb\.war.server.aisweb.*'
server.applications.vtr_ear.aisweb\.war.server.aisweb.dotted-name = server.applications.vtr_ear.aisweb\.war.server.aisweb
server.applications.vtr_ear.aisweb\.war.server.aisweb.errorcount-count = 444
server.applications.vtr_ear.aisweb\.war.server.aisweb.errorcount-description = Provides the cumulative value of the error count. The error count represents the number of cases where the response code was greater than or equal to 400.
server.applications.vtr_ear.aisweb\.war.server.aisweb.errorcount-lastsampletime = 1327661779647
server.applications.vtr_ear.aisweb\.war.server.aisweb.errorcount-name = ErrorCount
server.applications.vtr_ear.aisweb\.war.server.aisweb.errorcount-starttime = 1327568704658
server.applications.vtr_ear.aisweb\.war.server.aisweb.errorcount-unit = count 
server.applications.vtr_ear.aisweb\.war.server.aisweb.maxtime-count = 839315
server.applications.vtr_ear.aisweb\.war.server.aisweb.maxtime-description = Provides the longest response time for a request - not a cumulative value, but the largest response time from among the response times.
server.applications.vtr_ear.aisweb\.war.server.aisweb.maxtime-lastsampletime = 1327661779648
server.applications.vtr_ear.aisweb\.war.server.aisweb.maxtime-name = MaxTime
server.applications.vtr_ear.aisweb\.war.server.aisweb.maxtime-starttime = 1327568704658
server.applications.vtr_ear.aisweb\.war.server.aisweb.maxtime-unit = milliseconds
server.applications.vtr_ear.aisweb\.war.server.aisweb.processingtime-count = 91760928
server.applications.vtr_ear.aisweb\.war.server.aisweb.processingtime-description = Provides cumulative value of the times taken to process each request. The processing time is the average of request processing times over the request count.
server.applications.vtr_ear.aisweb\.war.server.aisweb.processingtime-lastsampletime = 1327661779647
server.applications.vtr_ear.aisweb\.war.server.aisweb.processingtime-name = ProcessingTime
server.applications.vtr_ear.aisweb\.war.server.aisweb.processingtime-starttime = 1327568704658
server.applications.vtr_ear.aisweb\.war.server.aisweb.processingtime-unit = milliseconds
server.applications.vtr_ear.aisweb\.war.server.aisweb.requestcount-count = 1263090
server.applications.vtr_ear.aisweb\.war.server.aisweb.requestcount-description = Provides cumulative number of the requests processed so far.
server.applications.vtr_ear.aisweb\.war.server.aisweb.requestcount-lastsampletime = 1327661779647
server.applications.vtr_ear.aisweb\.war.server.aisweb.requestcount-name = RequestCount
server.applications.vtr_ear.aisweb\.war.server.aisweb.requestcount-starttime = 1327568704658
server.applications.vtr_ear.aisweb\.war.server.aisweb.requestcount-unit = count 
server.applications.vtr_ear.aisweb\.war.server.aisweb.servicetime-count = 1263090
server.applications.vtr_ear.aisweb\.war.server.aisweb.servicetime-description = Provides execution time of the servlet's service method as TimeStatistic.
server.applications.vtr_ear.aisweb\.war.server.aisweb.servicetime-lastsampletime = 1327568704658
server.applications.vtr_ear.aisweb\.war.server.aisweb.servicetime-maxtime = 839315
server.applications.vtr_ear.aisweb\.war.server.aisweb.servicetime-mintime = 0
server.applications.vtr_ear.aisweb\.war.server.aisweb.servicetime-name = ServiceTime
server.applications.vtr_ear.aisweb\.war.server.aisweb.servicetime-starttime = 1327568704658
server.applications.vtr_ear.aisweb\.war.server.aisweb.servicetime-totaltime = 91760928
server.applications.vtr_ear.aisweb\.war.server.aisweb.servicetime-unit = milliseconds





************************************************************************************************
- EJB-Pool auswertung starten
#server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean .bean-methods .bean-pool.*


asadmin get -m 'server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.*'
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.dotted-name = server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.jmsmaxmessagesload-count = 0
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.jmsmaxmessagesload-description = Provides the maximum number of messages to load into a JMS session, at a time.
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.jmsmaxmessagesload-lastsampletime = 1327662484684
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.jmsmaxmessagesload-name = JmsMaxMessagesLoad
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.jmsmaxmessagesload-starttime = 1327568696985
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.jmsmaxmessagesload-unit = count 
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-current = 28
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-description = Provides the statistical information about the number of EJBs that are in the associated pool giving an idea about how the pool is changing.
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-highwatermark = 28
=> Nie mehr als 28 benötigt
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-lastsampletime = 1327662484685
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-lowerbound = 0
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-lowwatermark = 0
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-name = NumBeansInPool
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-starttime = 1327568696985
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-unit = Count
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numbeansinpool-upperbound = 32
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-current = 0
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-description = Provides the number of threads waiting for free Beans giving an indication of possible congestion of requests.
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-highwatermark = 0 
 => Kein Thread hat warten müssen
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-lastsampletime = 1327662484685
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-lowerbound = 0
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-lowwatermark = 0
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-name = NumThreadsWaiting
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-starttime = 1327568696985
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-unit = count 
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.numthreadswaiting-upperbound = 9223372036854775807
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeanscreated-count = 250
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeanscreated-description = Provides the number of Beans created in associated pool so far over time, since the gathering of data started.
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeanscreated-lastsampletime = 1327662484685
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeanscreated-name = TotalBeansCreated
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeanscreated-starttime = 1327568696985
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeanscreated-unit = count 
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeansdestroyed-count = 218
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeansdestroyed-description = Provides the number of Beans destroyed from associated pool so far over time, since the gathering of data started.
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeansdestroyed-lastsampletime = 1327662484681
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeansdestroyed-name = TotalBeansDestroyed
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeansdestroyed-starttime = 1327568696985
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-pool.totalbeansdestroyed-unit = count 

- Methoden auswerten

#server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean .bean-methods .bean-pool.*


12:14:35 app01 ~ # asadmin list -m 'server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods'
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_importShipInfoList-com\.vesseltracker\.entity\.Customer-int-java\.lang\.String-java\.util\.Collection-java\.util\.Date
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String
12:15:20 app01 ~ # asadmin get -m 'server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.*'
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.dotted-name = server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.executiontime-count = 1179
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.executiontime-description = Provides the time in milliseconds spent during the last successful/unsuccessful attempt to execute the operation.
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.executiontime-lastsampletime = 1327662989195
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.executiontime-name = ExecutionTime
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.executiontime-starttime = 1327568696987
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.executiontime-unit = Milliseconds
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.methodstatistic-count = 421404
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.methodstatistic-description = Provides the number of times an operation was called, the total time that was spent during the invocation and so on.
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.methodstatistic-lastsampletime = 1327662988401
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.methodstatistic-maxtime = 481781
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.methodstatistic-mintime = 4
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.methodstatistic-name = MethodStatistic
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.methodstatistic-starttime = 1327568696987
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.methodstatistic-totaltime = 225866846
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.methodstatistic-unit = 
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumerrors-count = 13
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumerrors-description = Provides the total number of errors that occured during invocation or execution of an operation.
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumerrors-lastsampletime = 1327662989197
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumerrors-name = TotalNumErrors
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumerrors-starttime = 1327568696987
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumerrors-unit = count 
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumsuccess-count = 421391
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumsuccess-description = Provides the total number of successful invocations of the method.
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumsuccess-lastsampletime = 1327662989197
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumsuccess-name = TotalNumSuccess
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumsuccess-starttime = 1327568696987
server.applications.vtr_ear.vtr_ejb_jar.DBUpdateBean.bean-methods.com_vesseltracker_ejb_iface_DBUpdateLocal_parseAndUpdate-java\.io\.InputStream-java\.lang\.String.totalnumsuccess-unit = count 


Letzter Medthodenaufruf ms: executiontime-count = 1077
ANzahl seit Serverstrart : methodstatistic-count = 421696

************************************************************************************************
Transaktionen überwachen
IMmer nur Stichprobe

asadmin get -m server.transaction-service.*
server.transaction-service.activecount-count = 7
server.transaction-service.activecount-description = Provides the number of transactions that are currently active.
server.transaction-service.activecount-lastsampletime = 1327663394606
server.transaction-service.activecount-name = ActiveCount
server.transaction-service.activecount-starttime = 1327568669084
server.transaction-service.activecount-unit = count 
server.transaction-service.activeids-current = 

Transaction Id                          Status                   ElapsedTime(ms)          ComponentName            ResourceNames

00000000024BAE9B_00                     Active                   936                      com.vesseltracker.ejb.stateless.ShipactionUtilBeanjdbc/vesseltracker__pm,
00000000024BAF97_00                     Active                   187                      com.vesseltracker.ejb.stateless.ShipUtilBeanjdbc/vesseltracker__pm,
00000000024BAFA9_00                     Active                   120                      com.vesseltracker.ejb.stateless.DBUpdateBeanjdbc/vesseltracker__pm,
00000000024BAFAA_00                     Active                   117                      com.vesseltracker.ejb.jobs.VesselAlertingJobImpl
server.transaction-service.activeids-description = Provides the IDs of the transactions that are currently active a.k.a. in-flight transactions. Every such transaction can be rolled back after freezing the transaction service.
server.transaction-service.activeids-lastsampletime = 1327663394620
server.transaction-service.activeids-name = ActiveIds
server.transaction-service.activeids-starttime = 1327568669084
server.transaction-service.activeids-unit = List
server.transaction-service.committedcount-count = 38514091
server.transaction-service.committedcount-description = Provides the number of transactions that have been committed.
server.transaction-service.committedcount-lastsampletime = 1327663394619
server.transaction-service.committedcount-name = CommittedCount
server.transaction-service.committedcount-starttime = 1327568669084
server.transaction-service.committedcount-unit = count 
server.transaction-service.dotted-name = server.transaction-service
server.transaction-service.rolledbackcount-count = 507
server.transaction-service.rolledbackcount-description = Provides the number of transactions that have been rolled back.
server.transaction-service.rolledbackcount-lastsampletime = 1327663394619
server.transaction-service.rolledbackcount-name = RolledbackCount
server.transaction-service.rolledbackcount-starttime = 1327568669084
server.transaction-service.rolledbackcount-unit = count 
server.transaction-service.state-current = False
server.transaction-service.state-description = Indicates if the transaction service has been frozen.
server.transaction-service.state-lastsampletime = 1327663394620
server.transaction-service.state-name = State
server.transaction-service.state-starttime = 1327568669084
server.transaction-service.state-unit = String
************************************************************************************************
Web-Applikation überwachen
- Web-Sessions überwachen
- webmon.sh | webfilter.pl
./asadmin monitor --host app01 --type webmodule --filter vtr_ear://server/ --interval 20 --filename sessions.txt server
activesessionscurrent,activesessionshigh,expiredsessionstotal,rejectedsessionstotal,servletprocessingtime,estsessionsize,sessionstotal\n";
asc   ash   est   jc    jec   jrc   rst   svpt     ss         sst  
351   390   8948  0     0     0     0    372988294			  9300

asc => current active sessions
ash => max active sessions
est => expired since server start
rst => rejected
svpt =>servletprocessingtime
ss => sessions {...},{...},{...},{...},{...}
sst => sessions total since server start


************************************************************************************************



>> >> log2csv.pl - konvertiert die Log-Datei, die vom asadmin-Monitor über
>> >> JDBC Connection Pools hinterlassen wird, in eine CSV-Datei
 
Packt die Zeit vor die Zeile








Hallo zusammen,

anbei wie vereinbart die Skripte für die Azfrufe von asadmin zur
Sammlung von Performance-Daten.

Sie sind nicht dokumentiert, oder nur sehr spärlich (für manche gibt es
eine "Usage"-Zeile), daher sollen wir zeitnah den Termin für die
Einweisung vereinbaren.

@Martin, wie passt es Dir? Für mich sind außer ein paar Termine am
Freitag die komplette Woche offen.


Grüße,
Geoff

>> >> Kurze Begriffsklärung -- ein "Monitor" in asadmin ermittelt Daten
>> >> periodisch, alle n Sekunden. Für alles andere muss asadmin einmalig
>> >> augerufen werden, und die Skripte steuern dessen periodischen Aufruf.
>> >>
>> >> gfejb.pl - sammelt Daten über EJB-Pools und -Methodenaufrufe für
>> >> gewählte EJBs (steuert den periodischen Aufruf von asadmin)
>> >>
>> >> log2csv.pl - konvertiert die Log-Datei, die vom asadmin-Monitor über
>> >> JDBC Connection Pools hinterlassen wird, in eine CSV-Datei
>> >>
>> >> gftx.pl/fix.pl - sammelt Daten über Transaktionen (gftx.pl steuert den
>> >> periodischen Aufruf von asadmin, fix.pl filtert dann hinterher die
>> >> Ausgaben)
>> >>
>> >> gfservlet.pl - sammelt Daten über gewählte Servlets (steuert den
>> >> periodischen Aufruf von asadmin)
>> >>
>> >> webmon.sh/webfilter.pl -- webmon.sh steurt den Aufruf des
>> >> asadmin-Monitors für gewählte Web-Applikationen, webfilter.pl filtert
>> >> die Ausgaben
