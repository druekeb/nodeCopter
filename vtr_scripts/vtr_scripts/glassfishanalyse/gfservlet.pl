#! /usr/bin/perl -w

#>> >> gfservlet.pl - sammelt Daten über gewählte Servlets (steuert den
#>> >> periodischen Aufruf von asadmin)

use strict;

my @servlets = @ARGV;
my $interval = pop @servlets;

die "Usage: servlet.dotted.name [...] interval\n"
    unless (@servlets && $interval =~ /^\d+$/ && $interval > 0);

my $asadmin = '/opt/glassfish-2ur2/bin/asadmin';
my $port = 8484;

for (0..$#servlets) {
    $servlets[$_] = "'$servlets[$_].*'";
}

open CSV, ">servlet.csv"
    or die "Cannot open servlets.csv: $!\n";
print CSV
    "t,servlet,requestcount,errorcount,processingtime,mintime,maxtime\n";

my %stat_type = (
    'count' => 1,
    'maxtime' => 1,
    'mintime' => 1,
    );

while (1) {
    my %stats;
    my $t = time();
    unless (open ASADMIN,
	    "$asadmin get -m --port $port @servlets |") {
	warn "Cannot execute $asadmin: $!\n";
	goto sleep;
    }

    while (<ASADMIN>) {
	if (/^ERROR/) {
	    warn $_;
	    next;
	}
	chomp;
	if (/\.([^.]+)\.(\w+)-(\w+) = (\d+)$/ && $stat_type{$3}) {
	    my ($servlet, $stat, $type, $val) = ($1, $2, $3, $4);
	    if ($type eq "mintime") {
		$stat .= "_mintime";
	    }
	    $stats{$servlet}{$stat} = $val;
	}
    }

    close ASADMIN
	or warn "Error exiting $asadmin: $!\n";

    for my $servlet (keys %stats) {
	print CSV "$t,$servlet,",
		"$stats{$servlet}{requestcount},",
		"$stats{$servlet}{errorcount},",
		"$stats{$servlet}{processingtime},",
		"$stats{$servlet}{servicetime_mintime},",
		"$stats{$servlet}{maxtime}\n";
    }

  sleep: sleep($interval);
}

END {
    exit unless $interval;
    close CSV
	or warn "Error closing servlet.csv: $!\n";
}
