#!/bin/bash
DOMAIN_NAME=vesseltracker


DB_HOST=localhost
DB_NAME=vesseltracker
DB_USER=root
DB_PASSWORD=fortuna
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=8
DB_PREPARE_THRESHOLD=0


MAIL_HOST=localhost
MAIL_DEFAULT_ADDRESS=admin@vesseltracker.com

ASADMIN=/opt/appserver/bin/asadmin

#----------------------------|\---------------------------------------------
#--------------------------- |----------------------------------------------
#---------------------------o-----------------------------------------------
#---------------------------------------------------------------------------

function error
{
	echo Error
	exit 1
}

if [ -x $ASADMIN ]
then
	echo
else 
	echo $ASADMIN existiert nicht oder ist nicht ausführbar...
	exit 1
fi


$ASADMIN create-domain \
--user admin --savelogin=true --profile developer \
--savemasterpassword=true \
--adminport=4848 --instanceport=8080 \
$DOMAIN_NAME
if (( $? )); then error; fi

echo "------------- now starting domain"
$ASADMIN start-domain $DOMAIN_NAME

echo "------------- creating javamail resource"
$ASADMIN create-javamail-resource --mailhost $MAIL_HOST  --mailuser $MAIL_DEFAULT_ADDRESS --fromaddress $MAIL_DEFAULT_ADDRESS VesseltrackerMail
if (( $? )); then error; fi

echo "------------- creating db conn pool"
$ASADMIN create-jdbc-connection-pool \
--datasourceclassname org.postgresql.ds.PGSimpleDataSource \
--restype javax.sql.DataSource \
--steadypoolsize $DB_MIN_POOL_SIZE \
--maxpoolsize $DB_MAX_POOL_SIZE \
--isolationlevel read-committed \
--isisolationguaranteed=true \
--property "PortNumber=5432:User=${DB_USER}:Password=${DB_PASSWORD}:DatabaseName=${DB_NAME}:ServerName=${DB_HOST}:PrepareThreshold=${DB_PREPARE_THRESHOLD}" \
VesseltrackerPool
if (( $? )); then error; fi

echo "------------- creating db resource"
$ASADMIN create-jdbc-resource --connectionpoolid VesseltrackerPool jdbc/vesseltracker
if (( $? )); then error; fi

echo "------------- creating auth realm"
# Achtung, bitte breiteren Bildschirm kaufen
$ASADMIN create-auth-realm \
--classname com.sun.enterprise.security.auth.realm.jdbc.JDBCRealm \
--property "user-table=webuser:user-name-column=username:password-column=password:digest-algorithm=sha:encoding=Base64:group-name-column=groupname:datasource-jndi=jdbc/vesseltracker:group-table=user_group:jaas-context=jdbcRealm" \
Vesseltracker
if (( $? )); then error; fi


#echo "----------- reconfiguring Timer Service to use Postgres DB"
#$ASADMIN set server-config.ejb-container.ejb-timer-service.timer-datasource=jdbc/vesseltracker

#echo "----------- create MessageQueue for AISMessages" //noch nicht LIVE getestet
$ASADMIN create-jms-resource --restype javax.jms.QueueConnectionFactory  jms/ConnectionFactory
$ASADMIN create-jms-resource --restype javax.jms.Queue --property Name=queue_AISMessageQueue  queue/AISMessageQueue


#echo "------------ JVM Options"
#$ASADMIN create-jvm-options "-Dcom.sun.enterprise.web.connector.enableJK=8009:-Dcom.sun.enterprise.server.ss.ASQuickStartup=false"
#if (( $? )); then error; fi



echo "----------- Stopping domain"
$ASADMIN stop-domain $DOMAIN_NAME
