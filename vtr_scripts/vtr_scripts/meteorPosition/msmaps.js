var map;
var request;
var icons;
var line;


function onLoad() {
	var ffv = 0;
	var ffn = "Firefox/";
	var ffp = navigator.userAgent.indexOf(ffn);

	if (ffp != -1) {
		ffv = parseFloat(navigator.userAgent.substring(ffp + ffn.length));
	}

	// If we're using Firefox 1.5 or above override the Virtual Earth drawing functions to use SVG
	if (ffv >= 1.5) {
		Msn.Drawing.Graphic.CreateGraphic = function(f, b) {
			return new Msn.Drawing.SVGGraphic(f, b)
		}
	}

	// prepare icons	
	icons = new Array(11);
	for ( var i = 1; i < 10; i++) {
		icons[i] = 'http://images.vesseltracker.com/images/googlemaps/icon' + i + '.png';
	}

	icons['moored'] = 'http://images.vesseltracker.com/images/googlemaps/icon_moored.png';
	icons['anchorage'] = icons[5];
	icons['waiting'] = 'http://images.vesseltracker.com/images/googlemaps/icon_waiting.png';
	icons['timedot'] = 'http://images.vesseltracker.com/images/googlemaps/timedot.png';

	map = new VEMap('map');
	map.LoadMap(new VELatLong(0.0, 0.0), 10, VEMapStyle.Road, false);
	map.HideDashboard();

	readMap();
}

function readMap() {
	var url = "./MeteorPosition.txt?ts=" + (new Date()).getTime();

	loadPosition(url);

}

function loadPosition(url) {
	// Request erzeugen
	if (window.XMLHttpRequest) {
		request = new XMLHttpRequest(); // Mozilla, Safari, Opera
	} else if (window.ActiveXObject) {
		try {
			request = new ActiveXObject('Msxml2.XMLHTTP'); // IE 5
		} catch (e) {
			try {
				request = new ActiveXObject('Microsoft.XMLHTTP'); // IE 6
			} catch (e) {
			}
		}
	}

	// überprüfen, ob Request erzeugt wurde
	if (!request) {
		//alert("Kann keine XMLHTTP-Instanz erzeugen");
		return false;
	} else {
		// Request öffnen
		request.open('get', url, true);
		// Request senden
		request.send(null);
		// Request auswerten

		request.onreadystatechange = receivePosition;
	}
}

// Request auswerten
function receivePosition() {
	switch (request.readyState) {

	// wenn der readyState 4 und der request.status 200 ist, dann ist alles korrekt gelaufen
	case 4:
		if (request.status != 200) {
			//alert("Der Request wurde abgeschlossen, ist aber nicht OK\nFehler:"+request.status);
		} else {
			var text = request.responseText;
			// den Inhalt des Requests in das <div> schreiben
			updateMap(text);
		}
		break;
	default:
		break;
	}
}

function updateMap(text) {

	var element = text.split("\n");

	map.DeleteAllShapes();

	var points = new Array();
	var elem;

	for ( var i = 0; i < element.length - 1; i++) {

		elem = element[i].split("\t");

		points[i] = new VELatLong(Number(elem[1]), Number(elem[2]));

		var dot = new VEShape(VEShapeType.Pushpin, points[i]);
		dot.SetCustomIcon(icons['timedot']);

		var desc = "<small><table> <tr><td>Datum</td><td>" + elem[0]
				+ ' MEZ</td></tr>';
		desc += "<tr><td valign=\"top\">Position</td><td valign=\"top\">"
				+ formatLatitude(elem[1]) + "<br/>" + formatLongitude(elem[2])
				+ "</td></tr></table></small>";

		dot.SetDescription(desc);
		map.AddShape(dot);
	}

	line = new VEShape(VEShapeType.Polyline, points);
	line.SetLineWidth(1);
	line.HideIcon();
	map.AddShape(line);
	map.SetMapView(points);

	elem = element[element.length - 2].split("\t");
	var point = new VELatLong(Number(elem[1]), Number(elem[2]));
	var shape = new VEShape(VEShapeType.Pushpin, point);
	shape.SetCustomIcon(icons['waiting']);
	shape.SetTitle('<a href = "http://www.vesseltracker.com/de/Ships/Meteor-8411279.html" target="_blank" > METEOR </a>');

	var description = '<small> Forschungsschiff <br>	';
	description += '<a href = "http://www.vesseltracker.com/de/Ships/Meteor-8411279.html" target="_blank"><img src="http://images.vesseltracker.com/images/vessels/thumbnails/Meteor-153341.jpg"/></a><br>';
	description += 'Letze Meldung:  ' + elem[0] + '<br><br>';
	description += '<table> <tr><td>IMO-Nr:</td> <td> 8411279</td></tr> <tr><td>MMSI-Nr: </td> <td> 211206980</td></tr>';
	description += "<tr><td valign=\"top\">Position</td><td valign=\"top\">"
			+ formatLatitude(elem[1]) + "<br/>" + formatLongitude(elem[2])
			+ "</td></tr>";
	description += '<tr><td>Länge x Breite</td><td> 97 x 16 m</td></tr> <tr><td>Tiefgang</td> <td>5,10 m  </td></tr></table></small>';
	shape.SetDescription(description);

	map.AddShape(shape);
	map.PanToLatLong(point);

	function formatLatitude(lat) {
		// S 09° 54' 23.6''
		var ret;
		if (lat < 0) {
			lat = -lat;
			ret = 'S ';
		} else {
			ret = 'N ';
		}
		var deg = Math.floor(lat);
		ret += padDigits(deg, 2) + "° ";
		var min = ((lat - deg) * 60.0);
		var minF = Math.floor(min);
		
		var sec = ((min - minF) * 60.0).toFixed(2);
		if (sec == 60.00)
		{
			sec = 0.0;
			sec = sec.toFixed(2);
			minF += 1;
		}		
		ret += padDigits(minF, 2) + "' ";
		ret += padDigits(sec, 5) + "\" ";
		return ret;
	}

	function formatLongitude(lon) {
		// E 009° 54' 23.6''
		var ret;
		if (lon < 0) {
			lon = -lon;
			ret = 'W ';
		} else {
			ret = 'E ';
		}
		var deg = Math.floor(lon);
		ret += padDigits(deg, 3) + "° ";
		var min = ((lon - deg) * 60.0);
		var minF = Math.floor(min);
		var sec = ((min - minF) * 60.0).toFixed(2);
		if (sec == 60.00)
		{
			sec = 0.0;
			sec = sec.toFixed(2);
			minF += 1;
		}
		ret += padDigits(minF, 2) + "' " + padDigits(sec, 5) + "\"";
		return ret;
	}
	function padDigits(n, totalDigits) {
		n = n.toString();
		var pd = '';
		if (totalDigits > n.length) {
			for ( var i = 0; i < (totalDigits - n.length); i++) {
				pd += '0';
			}
		}
		return pd + n;
	}

}
