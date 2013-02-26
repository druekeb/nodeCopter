var map;
var request;
var icons;

function getUrlParams()
	{
		var strVars = window.location.search;
		strVars = strVars.replace("?","");
		var splitVars = new Array();
		var vars = new Array();
		splitVars = strVars.split("&");
		for(i=0;i<splitVars.length;i++)
		{
			var tmp = splitVars[i].split("=");
			var nname = tmp[0];
			vars[nname] = tmp[1];
		}
		return vars;
	}
	

function encodeShipnameForUrl(name)
{
	tokens = name.split(" ");
	size = tokens.length;
	if(size>0)
		ret = tokens[0];
	for(i=1; i<size; i++)
	{
		ret += "-";
		ret += tokens[i];
	}
	return ret;
}

function onLoad()
{
	var ffv = 0;
	var ffn = "Firefox/";
	var ffp = navigator.userAgent.indexOf(ffn);
	
	if (ffp != -1) 
	{
		ffv = parseFloat(navigator.userAgent.substring(ffp + ffn.length));
	}
	
	// If we're using Firefox 1.5 or above override the Virtual Earth drawing functions to use SVG
	if (ffv >= 1.5) 
	{
		Msn.Drawing.Graphic.CreateGraphic=function(f,b) 
		{ 
			return new Msn.Drawing.SVGGraphic(f,b) 
		}
	}
	
	// prepare icons	
    icons = new Array(11);
    for(var i = 1; i < 10; i++) 
    {
		icons[i] = 'http://images.vesseltracker.com/images/googlemaps/icon'+i+'.png';
    }
    
    icons['moored'] = 'http://images.vesseltracker.com/images/googlemaps/icon_moored.png';
    icons['anchorage'] = icons[5];
    icons['waiting'] = 'http://images.vesseltracker.com/images/googlemaps/icon_waiting.png';
	icons['_lastpos'] = 'http://images.vesseltracker.com/images/googlemaps/icon_lastpos.png';   
	
    map = new VEMap('map');
    map.LoadMap(new VELatLong(0.0,0.0), 10 , VEMapStyle.Road, false);
    readMap();
}


function readMap()
{
	var params = getUrlParams();
	if (params['imo'] == null)
	{
			return;
	}
	var imo = parseInt(params['imo']);
	var url = "http://www.vesseltracker.com/aisserver/googleMapsNew/ship_"+imo+".xml";
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
			} catch (e) {}
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
				var xml = request.responseXML;
				// den Inhalt des Requests in das <div> schreiben
				updateMap(xml);
			}
			break;
		default:
			break;
	}
}

function updateMap(xml)
{
    var elemRoot = xml.getElementsByTagName('markers').item(0);
    if(!elemRoot) return;
    var ships = elemRoot. getElementsByTagName("marker");
    
	map.DeleteAllShapes();

	if (ships.length == 0)
	{
		document.getElementById("description").innerHTML = "No position available";
	}
	
	var ship = ships[0];
    
   	var name= ship.getAttribute("name");
	var imo = ship.getAttribute("imo");
	var id  = ship.getAttribute("id");
	var title = "<a target=\"_blank\" href=\"/en/Ships/"+encodeShipnameForUrl(name);
	if(imo)
	{
		title += "-"+imo+".html";
	}
	else
	{
		title += "-I"+id+".html";
	}
	title +="\">"+name+"</a>";
	
   	
	
	var status =  ship.getAttribute("status");
	var icon;
	if (status == "MOVING")
	{
	  icon = icons[ ship.getAttribute("icon") ];
	} 
	else if (status == "MOORED")
	{
	  icon = icons['moored'];
	}
	else if (status == "WAITING")
	{
	  icon = icons['waiting'];
	}
	else if (status == "ANCHORAGE")
	{
		icon = icons['anchorage'];
	}
	else if(status=="UNKNOWN0"){
		icon=icons[ship.getAttribute("icon")];
	}
	else
	{
	  icon = icons['waiting'];
	}
	 
	var point;
	var description;
	if(ship.getAttribute("lat")!=null && ship.getAttribute("lng")!=null){	
		addIcon(icon, ship.getAttribute("lat"), ship.getAttribute("lng"), null);
	}else if(ship.getAttribute("last_lat")!=null && ship.getAttribute("last_lon")!=null){
		description="<html><table><tr><td style='color:red;font-weight: bold;'>No curren position.</td></tr><tr><td>Last postion recived at:</td><td>"+ship.getAttribute("last_seen") +"</td></tr></table></html>";
		addIcon(icon, ship.getAttribute("last_lat"), ship.getAttribute("last_lon"), description);
	}
}

function addIcon(icon,lat, lon, description){
        if(lat==null || lon ==null){
                return null;
        }
        var point = new VELatLong(lat, lon);
        var shape = new VEShape(VEShapeType.Pushpin, point);
        shape.SetCustomIcon(icon);
	shape.SetDescription(description);
        map.AddShape(shape);
	map.PanToLatLong(point);
}
 
 
