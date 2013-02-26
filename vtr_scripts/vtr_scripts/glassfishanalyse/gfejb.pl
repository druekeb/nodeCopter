#! /usr/bin/perl -w

# gfejb.pl
# sammelt Daten über EJB-Pools und -Methodenaufrufe für
# gewählte EJBs (steuert den periodischen Aufruf von asadmin)

use strict;

my @ejbs = @ARGV;
my $interval = pop @ejbs;

die "Usage: ejb.dotted.name [...] interval\n"
    unless (@ejbs && $interval =~ /^\d+$/ && $interval > 0);

my $asadmin = '/opt/glassfish-2ur2/bin/asadmin';
my $port = 8484;

my (@methods, @ejb_pools);
for (@ejbs) {
    push @methods, "$_.bean-methods";
    push @ejb_pools, "$_.bean-pool.*";
}

my @ejb_methods;
open ASADMIN, "$asadmin list -m --port $port @methods |"
    or die "Cannot execute asadmin list: $!\n";
while (<ASADMIN>) {
    chomp;
    push @ejb_methods, "'$_.*'";
}
close ASADMIN
    or die "Error exiting asadmin list: $!\n";

open METHODS, ">methods.csv"
    or die "Cannot open methods.csv: $!\n";
print METHODS "t,bean,method,methodstatistic-count,methodstatistic-min,methodstatistic-max,totalnumerrors,totalnumsuccess,executiontime\n";

open POOLS, ">pools.csv"
    or die "Cannot open pools.csv for write: $!\n";
print POOLS "t,bean,numbeansinpool-current,numbeansinpool-hi,numbeansinpool-low,numthreadswaiting-current,numthreadswaiting-hi,numthreadswaiting-lo,totalbeanscreated,totalbeansdestroyed\n";

my %stat_type = (
    'count' => 1,
    'current' => 1,
    'maxtime' => 1,
    'mintime' => 1,
    'highwatermark' => 1,
    'lowwatermark' => 1,
    );

while (1) {
    my %stats;
    my $t = time();
    unless (open ASADMIN,
	    "$asadmin get -m --port $port @ejb_pools @ejb_methods |") {
	warn "Cannot execute $asadmin: $!\n";
	goto sleep;
    }

    while (<ASADMIN>) {
	if (/^ERROR/) {
	    warn $_;
	    next;
	}
	chomp;
	if (/\.([^.]+)\.bean-([^.]+)\.(\S+)-(\S+) = (\d+)$/ && $stat_type{$4}) {
	    my ($bean, $type, $stuff, $stat_type, $val) = ($1, $2, $3, $4, $5);
	    if ($type eq "methods"
		&& $stuff =~ /^.+_([^_]+)\.([^.]+)$/) {
		my ($method, $stat) = ($1, $2);
		if ($stat_type eq "mintime" || $stat_type eq "maxtime") {
		    $stat .= "_$stat_type";
		}
		$stats{methods}{$bean}{$method}{$stat} = $val;
	    }
	    else {
		if ($stat_type =~ /^(.+)watermark/) {
		    $stuff .= "_$1";
		}
		$stats{pools}{$bean}{$stuff} = $val;
	    }
	}
    }

    close ASADMIN
	or warn "Error exiting $asadmin: $!\n";

    for my $bean (keys %{$stats{methods}}) {
	for my $method (keys %{$stats{methods}{$bean}}) {
	    print METHODS "$t,$bean,$method,",
	    	"$stats{methods}{$bean}{$method}{methodstatistic},",
	    	"$stats{methods}{$bean}{$method}{methodstatistic_mintime},",
	    	"$stats{methods}{$bean}{$method}{methodstatistic_maxtime},",
	    	"$stats{methods}{$bean}{$method}{totalnumerrors},",
	    	"$stats{methods}{$bean}{$method}{totalnumsuccess},",
	    	"$stats{methods}{$bean}{$method}{executiontime}\n";
	}
    }

    for my $bean (keys %{$stats{pools}}) {
	print POOLS "$t,$bean,",
		"$stats{pools}{$bean}{numbeansinpool},",
		"$stats{pools}{$bean}{numbeansinpool_high},",
		"$stats{pools}{$bean}{numbeansinpool_low},",
		"$stats{pools}{$bean}{numthreadswaiting},",
		"$stats{pools}{$bean}{numthreadswaiting_high},",
		"$stats{pools}{$bean}{numthreadswaiting_low},",
		"$stats{pools}{$bean}{totalbeanscreated},",
		"$stats{pools}{$bean}{totalbeansdestroyed}\n";
    }

  sleep: sleep($interval);
}

END {
    exit unless $interval;
    close POOLS
	or warn "Error closing pools.csv: $!\n";
    close METHODS
	or warn "Error closing methods.csv: $!\n";
}
