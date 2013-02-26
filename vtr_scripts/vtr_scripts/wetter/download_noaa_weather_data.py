#!/usr/bin/python

import urllib2
from datetime import datetime, date, time, timedelta
import ConfigParser
import os, os.path

ScriptPath='/scripts/weather'
DataPath='/scripts/weather/data'
WetterPath='/scripts/weather/data/wetter'

def readStatusDate():
    os.chdir(ScriptPath)
    config = ConfigParser.RawConfigParser()
    config.read('download_noaa_weather_status.cfg')

    date = config.get('LAST_DOWNLOAD_TIME', 'date')
    return date
    
def readStatusTime():
    os.chdir(ScriptPath)
    config = ConfigParser.RawConfigParser()
    config.read('download_noaa_weather_status.cfg')

    time = config.get('LAST_DOWNLOAD_TIME', 'time')
    return time

def saveStatus(date, time):
    os.chdir(ScriptPath)
    config = ConfigParser.RawConfigParser()
    
    config.add_section('LAST_DOWNLOAD_TIME')
    config.set('LAST_DOWNLOAD_TIME', 'date', date)
    config.set('LAST_DOWNLOAD_TIME', 'time', time)
    dt=datetime.strptime(date+'-'+time, "%Y%m%d-%H")
    datetime_str=dt.strftime("%Y-%m-%d %H:00 UTC")
    config.set('LAST_DOWNLOAD_TIME', 'datetime', datetime_str)
    
    # Writing our configuration file to 'example.cfg'
    os.chdir(ScriptPath)
    with open('download_noaa_weather_status.cfg', 'wb') as configfile:
        config.write(configfile)
    
    os.chdir(WetterPath)
    with open('download_noaa_weather_status.cfg', 'wb') as configfile:
        config.write(configfile)


save=False

date_str = readStatusDate()
time_str = readStatusTime()


if time_str == '00':
    time_str = '06'
elif time_str == '06':
    time_str = '12'
elif time_str == '12':
    time_str = '18'
elif time_str == '18':
    time_str = '00'
    delta = timedelta(days=1)
    newdate = datetime.strptime(date_str, "%Y%m%d") 
    newdate = newdate + delta
    date_str = newdate.strftime("%Y%m%d")
else:
    print "error in cfg file, time is not in (00 06 12 18)"


filename = "http://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs." + date_str + time_str + "/master/gfs.t" + time_str + "z.mastergrb2f00"
output_filename = date_str + time_str+ "_gfs.t" + time_str + "z_mastergrb2f00"
print "download: " + filename + " == > " + output_filename

try:
    os.chdir(DataPath)
    file = urllib2.urlopen(filename)
    
    output = open(output_filename, 'wb')
    output.write(file.read())
    output.close()
    os.system('ln -sf ' + output_filename + ' lastdata')
    os.system('g2ctl -0 lastdata > tmp.ctl')
    os.system('/usr/local/bin/grads/gribmap -0 -i tmp.ctl')
    os.system('/usr/local/bin/grads/grads -b -l -c "run c2.gs"')
    os.system('/usr/local/bin/grads/grads -b -l -c "run c3.gs"')
    os.system('/usr/local/bin/grads/grads -b -l -c "run c4.gs"')    
    save = True
except:
    print "Could not download: "+ filename


if save:
    saveStatus(date_str, time_str);

