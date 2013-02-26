#! /usr/bin/perl -w -an

#>> >> webmon.sh/webfilter.pl -- webmon.sh steurt den Aufruf des
#>> >> asadmin-Monitors für gewählte Web-Applikationen, webfilter.pl filtert
#>> >> die Ausgaben

use strict;

BEGIN {
    print "t,activesessionscurrent,activesessionshigh,expiredsessionstotal,rejectedsessionstotal,servletprocessingtime,estsessionsize,sessionstotal\n";
}

next unless $. > 2;
next if /^\D/;
my $sum = 0;
for (8..$#F-1) {
	$sum += length($F[$_]);
}
print time(), ",$F[0],$F[1],$F[2],$F[6],$F[7],$sum,$F[$#F]\n";
