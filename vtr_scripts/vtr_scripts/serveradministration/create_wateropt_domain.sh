#!/bin/bash
DOMAIN_NAME=wateropt


DB_HOST=localhost
DB_NAME=wateropt
DB_USER=wateropt
DB_PASSWORD=fortuna
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=16
DB_PREPARE_THRESHOLD=0


MAIL_HOST=post.ynnor.de
MAIL_DEFAULT_ADDRESS=admin@vesseltracker.com

GLASSFISH_PATH=/opt/appserver
ASADMIN=${GLASSFISH_PATH}/bin/asadmin

source ${GLASSFISH_PATH}/config/asenv.conf

KEYTOOL=${AS_JAVA}/bin/keytool

#----------------------------|\--------------|\-----------------------------
#--------------------------- |\--------------|-|----------------------------
#---------------------------o----------------o-|----------------------------
#----------------------------------O-----------o----------------------------

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

if [ -x $KEYTOOL ]
then
	echo
else
	echo $KEYTOOL existiert nicht oder ist nicht ausfuehrbar...
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
$ASADMIN create-javamail-resource --mailhost $MAIL_HOST  --mailuser $MAIL_DEFAULT_ADDRESS --fromaddress $MAIL_DEFAULT_ADDRESS WateroptMail
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
WateroptPool
if (( $? )); then error; fi

echo "------------- creating db resource"
$ASADMIN create-jdbc-resource --connectionpoolid WateroptPool jdbc/wateropt
if (( $? )); then error; fi

echo "------------- creating auth realm"
# Achtung, bitte breiteren Bildschirm kaufen
$ASADMIN create-auth-realm \
--classname com.sun.enterprise.security.auth.realm.jdbc.JDBCRealm \
--property "user-table=login:user-name-column=username:password-column=password:digest-algorithm=MD5:group-name-column=groupname:datasource-jndi=jdbc/wateropt:group-table=logingroup:jaas-context=jdbcRealm" \
wateropt
if (( $? )); then error; fi

echo "------------ JVM Options"
echo "Basti meint, es braucht man nicht mehr. Dacheng 30.06.2010"
#$ASADMIN create-jvm-options "-Dcom.sun.enterprise.web.connector.enableJK=8009:-Dcom.sun.enterprise.server.ss.ASQuickStartup=false"
if (( $? )); then error; fi

echo "------------ Timer Service configuration for POstgres"
$ASADMIN set server-config.ejb-container.ejb-timer-service.timer-datasource=jdbc/wateropt
if (( $? )); then error; fi

echo "------------ shutting down domain"
$ASADMIN stop-domain $DOMAIN_NAME
if (( $? )); then error; fi

echo "------------ adding Brepos3 SSL Certificate to keystore"
$KEYTOOL -importcert -trustcacerts -keystore ${GLASSFISH_PATH}/domains/${DOMAIN_NAME}/config/cacerts.jks -file ~/brepos3-os.cer -alias brepos3
if (( $? )); then error; fi

echo "------------ adding HPA SSL Certificate to keystore"
$KEYTOOL -importcert -trustcacerts -keystore ${GLASSFISH_PATH}/domains/${DOMAIN_NAME}/config/cacerts.jks -file ~/tcclass3-2011.der -alias hpa
if (( $? )); then error; fi

echo "Done. You can start the domain and deploy your app now."

$KEYTOOL -importcert -trustcacerts -keystore ${GLASSFISH_PATH}/domains/wateropt/config/cacerts.jks -file ~/gateway.hamburg.de.der -alias hpa_new	
if (( $? )); then error; fi

