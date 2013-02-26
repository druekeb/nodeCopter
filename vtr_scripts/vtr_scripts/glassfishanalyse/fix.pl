#! /usr/bin/perl -pl -w

#>> >> gftx.pl/fix.pl - sammelt Daten über Transaktionen (gftx.pl steuert den
#>> >> periodischen Aufruf von asadmin, fix.pl filtert dann hinterher die
#>> >> Ausgaben)

my @f = split(/;/);
my $res = "";;
if ($f[1] =~ m|^(.+)jdbc/vesseltracker__pm,$|) {
    $f[1] = $1;
    $res = "jdbc/vesseltracker__pm";
}
$_ = join(';', $f[0], $f[1], $res, $f[2]);
