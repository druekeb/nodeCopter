#! /usr/bin/perl -w

#>> >> log2csv.pl - konvertiert die Log-Datei, die vom asadmin-Monitor über
# >> >> JDBC Connection Pools hinterlassen wird, in eine CSV-Datei

use strict;

use Date::Parse qw(str2time);

my $t = str2time($ARGV[0]);

while (<STDIN>) {
    if ($. == 1) { print "t,$_"; next; }
    next if (/^\D/ && $. > 1);
    print $t++, ",$_";
}
