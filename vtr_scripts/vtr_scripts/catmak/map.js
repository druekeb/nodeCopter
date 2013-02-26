//Version 1.0.3
//(c) 2009 vesseltracker.com


var g_map;
var g_pushpins;
var g_icons;
var g_icons_cat;
var g_icons_mak;
var g_xml;
var akt_id;
var akt_port;
var g_started;
var g_vessel_counter;

var g_cat_ids;
var g_mak_ids;

var akt_engine_type = 'mak';

var lat_min;
var lat_max;
var lon_min;
var lon_max;


// short names of Ship owners the should not be rendered MixedCase
var ABBREVS = new Array(
	 "MV.","CMA CGM","CMA-CGM","CMACGM","MOL","TK","UBC",
	 "MSC","APL","RMS","CSCL","MV","M/V","M.V.","BCL","RT",
	 "NYK","N.Y.K.","ECL","MF","YM","DT","WS","OOCL",
	 "BRO","MT","M/T","LS","EMS","STX","AB","BBC","BNS","BMS",
	 "HC","CSAV","COSCO","CEC","MS","JRS","IVS","COS",
	 "MT","OPDR","CCNI","UAL","HMS","HS","WMS","VOC","SKS",
	 "II", "III", "IV", "VI", "VII"); // roemische zahlen


function doNothing()
{
	return true;
}


function getMap()
{
	akt_port = 0; //always start with port no 0
	g_icons = new Array(14);
	g_icons_cat = new Array(9);
	g_icons_mak = new Array(9);
	g_started=true;
	for(var i = 1; i < 10; i++) 
	{
		g_icons[i] = 'http://images.vesseltracker.com/images/googlemaps/icon'+i+'.png';
		g_icons_cat[i] = 'img/cat_' + i + '.gif';
		g_icons_mak[i] = 'img/mak_' + i + '.gif';
	}
	
	
	g_icons['moored'] = 'http://images.vesseltracker.com/images/googlemaps/icon_moored.png';
	g_icons['anchorage'] = g_icons[5];
	g_icons['waiting'] = 'http://images.vesseltracker.com/images/googlemaps/icon_waiting.png';
	g_icons['cat'] = LOGO_CAT_SMALL;
	g_icons['mak'] = LOGO_MAK_SMALL;
	g_map = new VEMap('myMap');
	g_map.HideDashboard();
	var mapStyle;
	if (MAP_STYLE == 1)
	{
		mapStyle = VEMapStyle.Hybrid;
	}
	else if (MAP_STYLE == 2)
	{
		mapStyle = VEMapStyle.Road;
	}
	else if (MAP_STYLE == 3)
	{
		mapStyle = VEMapStyle.Aerial;
	}
	g_map.LoadMap(new VELatLong(START_LAT, START_LON), ZOOM , mapStyle, false);


	if (typeof INTERACTIVE != "undefined" && ! INTERACTIVE) 
	{	
		g_map.AttachEvent("onmousewheel", doNothing);
		g_map.AttachEvent("onclick",doNothing);
		g_map.AttachEvent("ondoubleclick",doNothing);
		g_map.AttachEvent("onmousemove",doNothing);
		g_map.AttachEvent("onmousedown",doNothing);
		g_map.AttachEvent("onmouseup",doNothing);
		g_map.AttachEvent("onmouseover",doNothing);
		g_map.AttachEvent("onmouseout",doNothing);
		g_map.AttachEvent("onkeypress",doNothing);
		g_map.AttachEvent("onkeydown",doNothing);
		g_map.AttachEvent("onkeyup", doNothing);
	}
	importXML();
}

function getRandomPort()
{
	var gefunden = false;
	var new_port_id;
	while(!gefunden)
	{
		new_port_id = getRandom(0,PORTS.length-1);
		gefunden = PORTS[new_port_id]['active'];
	}
	return new_port_id;
}

function getRandom( min, max )
{
	if( min > max )
	{
		return( -1 );
	}
	if( min == max )
	{
		return( min );
	}
	return( min + parseInt( Math.random() * ( max-min+1 ) ) );
}




function importXML()
{
	var ts = new Date().getTime();
	
	var xmlfile = "catmak_branded_" + akt_port + ".xml?" + ts;
	if (document.implementation && document.implementation.createDocument)
	{
		xmlDoc = document.implementation.createDocument("", "", null);
		xmlDoc.onload = refreshMap;
	}
	else if (window.ActiveXObject)
	{
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.onreadystatechange = function () {if (xmlDoc.readyState == 4) refreshMap()};
 	}
	else
	{
		alert('Your browser can\'t handle this script');
		return;
	}
	xmlDoc.load(xmlfile);
}


function refreshMap()
{
	
	lat_min = 90.0;
	lat_max = -90.0;
	lon_min = 180.0;
	lon_max = -180.0;

	var akt_pushpin_id = 0;

	g_xml = xmlDoc.getElementsByTagName('marker');
	g_pushpins = new Array();
	akt_id = 0;

	var shapeType = (VEShapeType.Pushpin);	
	g_map.DeleteAllShapes();
	g_mak_ids = new Array();
	g_cat_ids = new Array();

	if (g_xml.length == 0)
	{
		akt_port = getRandomPort();
		importXML();
		return;
	}
	for (i=0;i<g_xml.length;i++)
	{
		var lat = g_xml[i].getAttribute("lat");
		if (!lat) continue;

		if (lat_min > lat) lat_min = Number(lat);
		if (lat_max < lat) lat_max = Number(lat);

		var lon = g_xml[i].getAttribute("lng");

		if (lon_min > lon) lon_min = Number(lon);
		if (lon_max < lon) lon_max = Number(lon);
		var imo = g_xml[i].getAttribute("imo");
		var sid = g_xml[i].getAttribute("id");
		
		var points = new VELatLong(lat, lon);
		var pushpin = new VEShape(shapeType, points);
		var icon = "";
		if (g_xml[i].getAttribute("engName") =="MaK")
		{
			//icon = g_icons['mak'];
			icon = g_icons_mak[g_xml[i].getAttribute("icon")];
			//icon = g_icons[g_xml[i].getAttribute("icon")];
			g_mak_ids[g_mak_ids.length] = akt_pushpin_id;
		}
		else if (g_xml[i].getAttribute("engName") == "Cat")
		{
			//icon = g_icons['cat'];
			//icon = g_icons[g_xml[i].getAttribute("icon")];
			icon = g_icons_cat[g_xml[i].getAttribute("icon")];
			g_cat_ids[g_cat_ids.length] = akt_pushpin_id;
		}
		else
		{
			if (!PORTS[(akt_port)]['all_vessels']) continue;
			icon = g_icons[g_xml[i].getAttribute("icon")];
		}
		akt_pushpin_id += 1;
		
		var text = createBallonText(g_xml[i]);
		pushpin.SetDescription(text);
		pushpin.SetCustomIcon(icon);
		var title = '<a href="';
		title += 'http://www.vesseltracker.com/de/Ships/';
		title += encodeShipnameForUrl(g_xml[i].getAttribute("name"));
		if(imo)
		{
			title += "-"+imo+".html";
		}
		else
		{
			title += "-I"+sid+".html";
		}
		title +="\" target=\"_blank\">"+encodeShipname(g_xml[i].getAttribute("name"))+"</a>";
		pushpin.SetTitle(title);
		g_pushpins.push(pushpin);
		g_map.AddShape(pushpin);


	}
	
	window.setTimeout("zoomToPort()",TIME_AFTER_REFRESH);

    }
    

function zoomToPort()
{

	parent.document.getElementById('aktPort').innerHTML = PORTS[(akt_port)]['name'] + " (" + PORTS[(akt_port)]['country'] + ")";
	var avt_lat = 0.0;
	var avg_lon = 0.0;
	if (PORTS[(akt_port)]['zoom'] != null) zoom = PORTS[(akt_port)]['zoom'];
	avg_lat = lat_min + (lat_max - lat_min)/2.0;
	avg_lon = lon_min + (lon_max - lon_min)/2.0;
	var pos = new VELatLong(avg_lat, avg_lon);
	g_map.SetCenterAndZoom(pos,zoom);
	g_vessel_counter = 0;
	window.setTimeout("zoomToVessel()",TIME_AFTER_NEW_PORT);
}

function zoomToVessel()
{
	akt_id = findNewVessel();
	if (g_started)
	{
		if (g_pushpins[akt_id] != null)
		{
			var pos = g_pushpins[akt_id].GetPoints()[0];
			g_map.SetCenterAndZoom(pos, PORTS[(akt_port)]['vesselzoom']);
			g_vessel_counter += 1;
			window.setTimeout("openBox()",TIME_UNTIL_OPEN);
		}
		else
		{
			g_vessel_counter += 1;
			window.setTimeout("selectNewVessel()",0);
		}
	}
}



function openBox()
{
	if (g_started)
	{
		g_map.HideInfoBox();
		g_map.ShowInfoBox(g_pushpins[akt_id], g_pushpins[akt_id].GetPoints()[0], new VEPixel(40,15));
		window.setTimeout("closeBox()",TIME_UNTIL_CLOSE);
	}
}

function closeBox()
{
	if (g_started)
	{
		g_map.HideInfoBox();
		window.setTimeout("selectNewVessel()",TIME_UNTIL_NEXT);
	}
}


function selectNewVessel()
{
	if (g_started)
	{
		if (g_vessel_counter >= VESSELS_PER_PORT)
		{
			akt_port = getRandomPort();
			importXML();
	
		}
		else
		{
			window.setTimeout("zoomToVessel()",0);
		}
	}
	
}


function findNewVessel()
{
	//abwechselnd cat/mak
	akt_engine_type = akt_engine_type == 'cat'?'mak':'cat';

	var anz_cat = g_cat_ids.length;
	var anz_mak = g_mak_ids.length;
	var new_id;

	//naechstes schiff cat wenn moeglich
	if (akt_engine_type == 'cat' && anz_cat > 0)
	{
		var akt_index = getRandom(0,anz_cat-1);
		new_id = g_cat_ids[akt_index];
		g_cat_ids.splice(akt_index,1);
		return new_id; 
	}
	
	//naechstes schiff mak wenn moeglich
	if (akt_engine_type == 'mak' && anz_mak > 0)
	{
		var akt_index =  getRandom(0,anz_mak-1);
		new_id =  g_mak_ids[akt_index];
		g_mak_ids.splice(akt_index,1);
		return new_id;
	}

	//abwechselnd geht nicht, dann irgendeins
	if (anz_cat > 0)
	{
		var akt_index = getRandom(0,anz_cat-1);
		new_id =  g_cat_ids[akt_index];
		g_cat_ids.splice(akt_index,1);
		return new_id;
	}

	if (anz_mak > 0)
	{
		var akt_index = getRandom(0,anz_mak-1);
		new_id =  g_mak_ids[akt_index];
		g_mak_ids.splice(akt_index,1);
		return new_id;
	}

	// gar keine cat/mak => irgendein schiff
	return g_pushpins[getRandom(0,g_pushpins.length-1)];
		
}

function startStop()
{
	if (g_started)
	{
		g_started = false;
	}
	else
	{
		g_started = true;
		selectNewVessel();
	}
}




function encodeShipnameForUrl(name)
{
	var tokens = name.split(" ");
	var size = tokens.length;
	if(size>0)
		ret = tokens[0];
	for(j=1; j<size; j++)
	{
		ret += "-";
		ret += tokens[j];
	}
	return ret;
}	 



function encodeShipname(name)
{
	var rets = name.toLowerCase();
	rets = rets.replace(".",". ");
	for (var i=0; i<ABBREVS.length; i++) 
	{
		var abbrev = ABBREVS[i].toLowerCase() + " ";
		var idx = rets.indexOf(abbrev);
		if (idx>=0 && (idx==0 || rets.charAt(idx-1)==' '))
		{
			rets = rets.replace(abbrev,ABBREVS[i]+" ");
		}
	}
	var retb = "";
	var sp = rets.split(" ");
	
	for (var i=0; i<sp.length; i++) 
	{
		if (sp[i].length==0) continue;
		if(i>0) retb += " ";
		retb = retb 
			+ sp[i].charAt(0).toUpperCase()
		    + sp[i].substr(1);
	}
	return retb;
}


function getNiceShipTypeName(shiptype)
{
	switch(shiptype)
	{
	  	case "cargo_ships": return "Cargo Ship"; break;			
		case "tankships": return "Tanker";break;			
		case "passenger_ships": return "Passenger Ship";break;			
		case "pleasure_crafts": return "Pleasure Craft";break;			
		case "tugboats": return "Tug Boat";break;			
		case "coast_guard_ships": return "Coast Guard";break;			
		case "dredgers": return "Dredger";break;			
		case "sailing_vessels": return "Sailing Vessel";break;			
		case "fishing_boats": return "Fishing Boat";break;			
		case "pilot_vessels": return "Pilot Vessel";break;			
		case "towing_vessels": return "Tug Boat";break;			
		case "high-speed_crafts": return "High-Speed Craft";break;			
		case "rescue_vessels": return "SAR Vessel";break;			
		case "ekranoplans": return "Ekranoplan (Wing in Ground Craft)";break;			
		case "others": return "Unknown";break;			
		case "anti-pollution_vessels": return "ER Vessel";break;			
	}
	return "Unknown";
}



function createBallonText(ship)
{

	var shipname=ship.getAttribute("name");
	var shiptype=ship.getAttribute("t");
	var shipimo = ship.getAttribute("imo");
	var shipid = ship.getAttribute("id");
	var shipcallsign= ship.getAttribute("call");
	var shiplength=ship.getAttribute("length");
	var shipwidth=ship.getAttribute("width");
	var producer=ship.getAttribute("engName");
	var engine=ship.getAttribute("engModel");
	var shipStatus = encodeShipname(ship.getAttribute("status"));
	var shipCountry = ship.getAttribute("country").replace("United States of America","USA");
	var shipFlag = ship.getAttribute("flag");
	var shipSpeed = ship.getAttribute("speed");
	var shipCourse = ship.getAttribute("cog");

     //<marker status="MOORED" icon="5" name="ALCATRAZ FLYER" t="passenger_ships" imo="" lat="37.8069" lng="-122.404" cog="292.4" speed="0.2" length="36.0" width="11.0" country="United States of America" flag="222"/>
	var shipImage = "";

	
	
	var text = '';



	text+= '<table  class="otherliste" width="100%" border="0" cellspacing="0" cellpadding="0">';
	text+= '<tr><td>&nbsp;</td><td></&nbsp;</td></tr>';
	//text+='<tr><td class="listtyp">Vessel Photo:</td><td>';
	text += '<tr><td colspan="2" align="center">';
	if (shipimo != null)
	{
		shipImage = 'http://www.vesseltracker.com/shipPhotoServlet?res=small&imo=' +   shipimo;
	}
	else
	{
		shipImage = 'http://www.vesseltracker.com/shipPhotoServlet?res=small&shipId=' +   shipid;
	}
	
	text+= '<img src="' + shipImage + '" align="center" alt="No photo available" width="95%"/><br/><br/>';
	text+= '</td></tr>';
	text += '<tr><td class="listtyp">Vessel&nbsp;Type:</td><td class="value">' + getNiceShipTypeName(shiptype) + '</td></tr>';
	text+= '<tr><td class="listtyp">IMO&nbsp;Number:</td><td class="value">'+shipimo+'</td></tr>';
	if (shiplength == 0 || shiplength > 400)
	{
		text+= '<tr><td class="listtyp">Length:</td><td class="value">Unknown</td></tr>';
		text+= '<tr><td class="listtyp">Beam:</td><td class="value">Unknown</td></tr>';	}
	else 
	{
		text+= '<tr><td class="listtyp">Length:</td><td class="value">'+shiplength+' m</td></tr>';
		text+= '<tr><td class="listtyp">Beam:</td><td class="value">'+shipwidth+' m</td></tr>';
	}
	text+= '<tr><td class="listtyp">Status:</td><td class="value">'+shipStatus+'</td></tr>';
	
	text+= '<tr><td class="listtyp">Flag Country:</td><td class="value">'+'<img src="http://images.vesseltracker.com/images/flags/'+shipFlag+'.png" alt=""> '+shipCountry+'</td></tr>';
	if (shipStatus == 'MOVING')
	{
	  text+= '<tr><td class="listtyp">Speed:</td><td class="value">'+shipSpeed+' kn</td></tr>';
	  text+= '<tr><td class="listtyp">Course:</td><td class="value">'+shipCourse+'&deg;</td></tr>';
	 }

	if (producer != null && engine != null)
	{
		text+= '<tr><td class="listtyp">Main&nbsp;Engine:</td><td class="value">'+ engine + '</td></tr>';
	}

	if (producer != null)
	{
		text += '<tr><td colspan="2">&nbsp;</td></tr><tr><td colspan="2" align="center">';
		if (producer == 'MaK')
		{
			text+= "<br/><br/><img src='" + LOGO_MAK_LARGE + "'/><br/><br/>";
		}
		else if (producer == 'Cat')
		{
			text+= "<br/><br/><img src='" + LOGO_CAT_LARGE+ "'/><br/><br/>";
		}
		text+='</td></tr>';
	}
	
	text+= '<tr><td>&nbsp;</td><td></&nbsp;</td></tr>';
	text+= '</table>';
	text += '</small>';

	return text;
}




