#! /usr/bin/perl -w

#>> >> gftx.pl/fix.pl - sammelt Daten über Transaktionen (gftx.pl steuert den
#>> >> periodischen Aufruf von asadmin, fix.pl filtert dann hinterher die
#>> >> Ausgaben)



use strict;

my $interval = $ARGV[0]
    or die "Usage: $0 interval\n";

my $asadmin = '/opt/glassfish-2ur2/bin/asadmin';
my $port = 8484;

my @stats = (
    'server.transaction-service.activecount-count',
    'server.transaction-service.committedcount-count',
    'server.transaction-service.rolledbackcount-count',
    'server.transaction-service.state-current',
    'server.transaction-service.activeids-current',
    );

open STATS, ">tx_stats.csv"
    or die "Cannot open tx_stats.csv for write: $!\n";
open TX, ">tx_tx.csv"
    or die "Cannot open tx_tx.csv for write: $! \n";

print STATS "t,active,committed,rolledback,frozen\n";
print TX "t;name;elapsed\n";

while (1) {
    my $t = time();
    open ASADMIN, "$asadmin get -m --port $port @stats |"
	or die "Cannot execute $asadmin: $!\n";
    
    chomp(my $active = <ASADMIN>);
    $active =~ s/^\S+ = (-?\d+)$/$1/;

    my $committed;
    while (<ASADMIN>) {
	chomp;
	next if ($_ eq "" || / = $/ || /^Transaction Id/);
	if (/^server/) {
	    s/^\S+ = (-?\d+)$/$1/;
	    $committed = $_;
	    last;
	}
	my @f = split;
	print TX "$t;$f[3];$f[2]\n";
    }

    chomp(my $rolledback = <ASADMIN>);
    $rolledback =~ s/^\S+ = (-?\d+)$/$1/;

    chomp(my $frozen = <ASADMIN>);
    $frozen =~ s/^\S+ = (\w+)$/$1/;

    print STATS "$t,$active,$committed,$rolledback,$frozen\n";

    sleep($interval);
}

END {
    exit unless $interval;
    close ASADMIN
	or warn "Error exiting $asadmin: $!\n";
    close STATS
	or warn "Error closing tx_stats.csv: $!\n";
    close TX
	or warn "Error closing tx_tx.csv: $!\n";
}
