#!/usr/bin/python
#
# This script performs the initial backup of the postgreSQL data directory, which is required
# to setup a new standby database servern (or recover a broken one).
#
# Before you can execute this script, be sure to follow the directions in the Wiki-Page 
# "PostgreSQL 9" to setup your standby server for replication.
#
# Author: Bastian Voigt
#

import string
import subprocess
import psycopg2 as dbapi2
import os
import stat
import pwd
import socket
import time
import sys
import getopt


#-------------------------------------------------------------------------
# global variables
#-------------------------------------------------------------------------

# ATTN: Data Dir must not end with a slash character!!!
DEFAULT_DATA_DIR="/var/lib/postgresql/9.0/main"

# the user name (for both the UNIX user that runs postgres, and the superuser role inside PostgreSQL)
DEFAULT_USER="postgres"

# some random database that exists on the primary server
DEFAULT_DATABASE="template1"

# default bandwidth limit for rsync (in kB/s)
DEFAULT_BANDWIDTH_LIMIT=1024*5


#-------------------------------------------------------------------------
# implementation methods
#-------------------------------------------------------------------------

##
# Read the recovery.conf file from Postgres Data Directory
# to find the connection parameters for the Primary Server.
#
def readConfig(localDataDir):
    cfg_filename = "{dir}/recovery.conf".format(dir=localDataDir)
    print "Reading config file {0}".format(cfg_filename)
    host = ""
    port = ""
    primaryConnInfoFound = False
    cfg_file = open(cfg_filename, 'r')
    try:
        for line in cfg_file:
            line = line.strip()
            if len(line)==0:
                continue
            if line[0] == '#':
                continue
            key,value = string.split(line, "=", 1)
            if key.strip() == "primary_conninfo":
                primaryConnInfoFound = True
                pairs = value.strip("' ").split(" ")
                for pair in pairs:
                    pair = pair.strip()
                    if len(pair)==0:
                        continue
                    key2,value2 = string.split(pair,"=", 1)
                    key2 = key2.strip()
                    if key2 == "host":
                        host = value2.strip()
                    elif key2 == "port":
                        port = value2.strip()
        if not primaryConnInfoFound:
            raise Exception("No primary_conninfo found in {0}".format(cfg_filename))
        if len(host)==0:
            raise Exception("No host setting found in primary_conninfo")
        if len(port)==0:
            raise Exception("No port setting found in primary_conninfo")
        return host, port
    finally:
        cfg_file.close()


##
# Tests for running PostgreSQL server on the localhost.
#
def ensurePostgresNotRunningOnStandby(dataDir, dryRun):
    if dryRun:
        print "Would test for running PostgreSQL instance on localhost and exit if one is running"
        return
    print "Testing for running PostgreSQL instance on the local host"

    # check pidfile in data dir
    pidFilename = "{dataDir}/postmaster.pid".format(dataDir=dataDir)
    try:
        statResult = os.stat(pidFilename)
    except OSError as err:
        # Errno 2: file not found
        if err.errno == 2:
            return
        # Errno 13: Permission denied or something else...
        else:
            raise
    if not stat.S_ISREG(statResult[stat.ST_MODE]):
        raise Exception("{0} is not a regular file!".format(pidFilename))
    f = open(pidFilename, "r")
    try:
        pid=f.readline()
    finally:
        f.close()
        
    raise Exception("PostgreSQL server is still running with PID={0}. Please stop it!".format(pid))


##
# Set the Primary Server into Backup Mode.
#
def startBackupModeOnPrimary(conn, dryRun):
    if dryRun:
        print "Would start backup mode on primary server"
        return
    print "Starting backup mode on Primary Server"
    hostname = socket.gethostname()
    date = time.time()
    cmd="SELECT pg_start_backup('postgres_init_slave.py started {date} on host {host}')".format(date=date, host=hostname)
    cur = conn.cursor()
    try:
        cur.execute(cmd)
    finally:
        cur.close()


##
# Set the Primary Server back to normal operation mode after backup.
#
def stopBackupModeOnPrimary(conn, dryRun):
    if dryRun:
        print "Would stop backup mode on primary server"
        return
    print "Stopping backup mode on Primary Server"
    cmd="SELECT pg_stop_backup()"
    cur = conn.cursor()
    try:
        cur.execute(cmd)
    finally:
        cur.close()


##
# Launch rsync to sync the data directory from the Pimary to the Standby Server.
# * Delete old files that are no longer present on the primary.
# * Copy symlinks as symlinks (do not follow).
#
def syncDataDirectory(primaryUser, primaryHost, primaryDataDir, localDataDir, bandwidthLimit, dryRun):
    srcDir = "{user}@{host}:{dataDir}/".format(user=primaryUser, host=primaryHost, dataDir=primaryDataDir)
    description = "from {0} to {1} with bandwidth limit {2} kB/s".format(srcDir, localDataDir, bandwidthLimit)
    if dryRun:
        print "Would rsync {0}".format(description)
        return
    print "Rsyncing {0}".format(description)
    cmd = ["rsync", "-r", 
           "--exclude", "*.conf", 
           "--exclude", "postmaster.pid",
           "--exclude", "postmaster.opts",
           "--delete", "--links", "--progress", 
           "--bwlimit", str(bandwidthLimit),
           srcDir, localDataDir]  
    p = subprocess.Popen(cmd)
    p.communicate()
    if p.returncode != 0:
        raise Exception("rsync terminated with a bad returncode of {0}".format(p.returncode))


##
# Find all tablespaces (i.e. storage outside the data directory used by postgres)
# and copy them separately. Must be executed after copying the data directory,
# because we need the symlinks to find the tablespaces.
#
def syncAllTablespaces(localDataDir, primaryUser, primaryHost, bandwidthLimit, dryRun):
    print "Checking for tablespaces"
    tableSpaceDir = '{0}/pg_tblspc'.format(localDataDir)
    dir = os.listdir(tableSpaceDir)
    for file in dir:
        path = os.path.join(tableSpaceDir, file)
        statResult = os.lstat(path)
        if stat.S_ISLNK(statResult[stat.ST_MODE]):
            realPath = os.readlink(path)
            syncDataDirectory(primaryUser, primaryHost, realPath, realPath, bandwidthLimit, dryRun) 


##
# Make sure we're running on the correct userId.
#
def ensureRunningAsPsqlUser(localUser):
    user = pwd.getpwuid(os.getuid())[0]
    if user != localUser:
        raise Exception("This script should be running as user {0}".format(localUser))
                   
##
# Print usage information and exit.
#
def usage(exitStatus):
    print "Parameters:"
    print "-? | --help"
    print "          Print this help."
    print ""
    print "-n | --dry-run"
    print "          Dry run: Do nothing, just print execution plan."
    print "          This option does not really do anything, as dry run"
    print "          is the default."    
    print ""
    print "-e | --execute"
    print "          Do the real work (as opposed to dry run)."
    sys.exit(exitStatus)


#-------------------------------------------------------------------------
# main function
#-------------------------------------------------------------------------

# Default Settings
primaryUser = DEFAULT_USER
primaryDataDir = DEFAULT_DATA_DIR
primaryDb = DEFAULT_DATABASE
localDataDir = DEFAULT_DATA_DIR
localUser = DEFAULT_USER
dryRun = True
bandwidthLimit = DEFAULT_BANDWIDTH_LIMIT;

# Process command-line parameters
try:
    opts, args = getopt.getopt(sys.argv[1:], "e?n", ["execute", "help", "dry-run"])
except getopt.GetoptError as e:
    print "Error: {0}".format(e)
    usage(1)
if len(opts)==0:
    print "Error: No arguments given."
    usage(2)
for opt, arg in opts:
    if opt in ("-n", "--dry-run"):
        dryRun = True
    elif opt in ("-e", "--execute"):
        dryRun = False
    elif opt in ("-?", "--help"):
        usage(0)
    
# main algorithm
try:
    if dryRun:
        print "### DRY RUN ###"
    ensureRunningAsPsqlUser(localUser)
    primaryHost, primaryPort = readConfig(localDataDir)
    print "Primary Server is {0}:{1}".format(primaryHost, primaryPort)
    ensurePostgresNotRunningOnStandby(localDataDir, dryRun)
    primarySqlConn = dbapi2.connect(database=primaryDb, user=primaryUser, host=primaryHost, port=primaryPort)
    try:
        startBackupModeOnPrimary(primarySqlConn, dryRun)
        try:
            syncDataDirectory(primaryUser, primaryHost, primaryDataDir, localDataDir, bandwidthLimit, dryRun)
            syncAllTablespaces(localDataDir, primaryUser, primaryHost, bandwidthLimit, dryRun)
        finally:
            stopBackupModeOnPrimary(primarySqlConn, dryRun)
    finally:
        primarySqlConn.close()
except Exception as e:
    print "An error occured: {0}".format(e)

