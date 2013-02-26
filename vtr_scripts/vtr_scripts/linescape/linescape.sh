#!/bin/bash

### getFTP v.1 #################
#
# Variables : use backquotes!#
DATE=`date +%Y%m%d`
DATA='/scripts/linescape/data'
SCRIPT='/scripts/linescape'
ARCHIVE=$DATA/archive
#
HOST='ftp.linescape.com'
USER='vtracker'
PASSWD='C!5$HUd('
FILE='VesselTracker.zip'

DBUSER='ais'
DBPASS='fortuna'
DBHOST='db03'
#
####################################

cd $DATA

# Login, run get files
ftp -inv $HOST <<END_SCRIPT
quote USER $USER
quote PASS $PASSWD
mget $FILE
quit
END_SCRIPT

unzip $FILE 
rm $FILE

FILENAME=$(ls *.csv)
cp $FILENAME $ARCHIVE   
FILEDATE=$(echo $FILENAME| cut -d. -f1 |cut -d_ -f2)
python $SCRIPT/import_linescape.py $DATA/$FILENAME > $DATA/sql/linescape_$FILEDATE.sql  
rm  $FILENAME ##mv dateiname ./archive

#psql -U $DBUSER -p $DBPASS -h $DBHOST -f $DATA/sql/linescape_$FILEDATE.sql 
 
# Cleanup
exit 0
