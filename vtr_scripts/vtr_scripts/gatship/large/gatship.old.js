var map;
var request;
var icons;
var width;
var height;
var ownerId;
var minLat;
var maxLat;
var minLon;
var maxLon;
var regionXml;
var ownerXml;
var vessels=new Array();
var centerPoint;
var zoom;
var showArea;

var ABBREVS = new Array(
	 "CMA CGM","CMA-CGM","CMACGM","MOL","TK","UBC",
	 "MSC","APL","RMS","CSCL","MV","M/V","M.V.","BCL","RT",
	 "NYK","N.Y.K.","ECL","MF","YM","DT","WS","OOCL",
	 "BRO","MT","M/T","LS","EMS","STX","AB","BBC","BNS","BMS",
	 "HC","CSAV","COSCO","CEC","MS","JRS","IVS","COS",
	 "MT","OPDR","CCNI","UAL","HMS","HS","WMS","VOC","SKS",
	 "II", "III", "IV", "VI", "VII");

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
	var params = getUrlParams();
	zoom = 10;
	width = 500;
        height = 375;
	var controls = true;
	var mapType = VEMapStyle.Road;
	if (params['z'] != null)
	{
		zoom = parseInt(params['z']);
	}
	if (params['w'] != null)
	{
	  width = parseInt(params['w']);
	}
	if (params['h'] != null)
	{
	  height = parseInt(params['h']);
	}
	if (params['c'] != null)
	{
	   controls = (params['c'] == 1);
	}
	if (params['t'] != null)
	{
	    if (params['t'] == 1) { mapType = VEMapStyle.Road; }
	    else if (params['t'] == 2) {mapType = VEMapStyle.Aerial;}
	    else {mapType = VEMapStyle.Hybrid;}
	}
	if(params['owner']!=null){
		ownerId=parseInt(params['owner']);
	}
	if(params['minlon']!=null){
		minLon=parseFloat(params['minlon']);
	}
 	if(params['maxlon']!=null){
                maxLon=parseFloat(params['maxlon']);
        }
	if(params['minlat']!=null){
                minLat=parseFloat(params['minlat']);
        }
	if(params['maxlat']!=null){
                maxLat=parseFloat(params['maxlat']);
        }
	if(params['showall']!=null){
		 document.getElementById("allVesselsCB").checked=(params['showall'] == 1);
	}
	if(params['showarea']!=null){
		showArea=(params['showarea']==1);
	}

	document.getElementById("map").style.cssText="float:left;overflow:hidden;position:relative;width:" + (width-153) + "px;height:" + height + "px;";
	document.getElementById("sidebar").style.cssText="border:1px solid #808080;overflow:auto;padding-left:3px;width:150px;height:"+(height-2)+"px;font-family:Arial, Helvetica, sans-serif;font-size: 12px;";
	
	document.getElementById("nord").style.cssText="position:absolute; top:"+35+"px; left:"+((width-153)/2.0-20)+"px;color:white; z-index:1;";
	document.getElementById("south").style.cssText="position:absolute; top:"+(height-10)+"px; left:"+((width-153)/2.0-20)+"px;color:white; z-index:1;";
	document.getElementById("west").style.cssText="position:absolute; top:"+(height/2.0)+"px; left:"+(5)+"px;color:white; z-index:1;";
	document.getElementById("ost").style.cssText="position:absolute; top:"+(height/2.0)+"px; left:"+(width-153-60)+"px;color:white; z-index:1;";
	document.getElementById("noResult").style.cssText="position:absolute; top:"+(height/2.0)+"px;left:"+((width-153)/2.0-125)+"px;color:red; background-color:white; z-index:1; font-size:30px;"; 

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
    icons = new Array(12);
    for(var i = 1; i < 10; i++) 
    {
		icons[i] = 'http://images.vesseltracker.com/images/googlemaps/icon'+i+'.png';
    }
    
    icons['moored'] = 'http://images.vesseltracker.com/images/googlemaps/icon_moored.png';
    icons['anchorage'] = icons[5];
    icons['waiting'] = 'http://images.vesseltracker.com/images/googlemaps/icon_waiting.png';
    icons['circle']='http://images.vesseltracker.com/images/googlemaps/circle.png';
	icons['unknown0']='http://images.vesseltracker.com/images/googlemaps/icon_lastpos.png';
	
    map = new VEMap('map');
    if (! controls) {map.HideDashboard();}
	centerPoint=new VELatLong((maxLat+minLat)/2.0 , (maxLon+minLon)/2.0);
    	map.LoadMap(centerPoint, zoom , mapType, false);
	map.SetScaleBarDistanceUnit(VEDistanceUnit.Kilometers);
	try{
		map.AttachEvent("onchangeview", changePosition);
	}catch(VEException){
	}
	changePosition();
	showAllVessels();	
}

function changePosition(){
	var ll1 = map.PixelToLatLong(new VEPixel(0,0));
 	var ll2= map.PixelToLatLong(new VEPixel(width-153,height));

	document.getElementById('nord').innerHTML=ll1.Latitude.toFixed(2);
	document.getElementById('west').innerHTML=ll1.Longitude.toFixed(2);
	document.getElementById('south').innerHTML=ll2.Latitude.toFixed(2);
	document.getElementById('ost').innerHTML=ll2.Longitude.toFixed(2);
	if(showArea)
	{
		document.getElementById('minmaxlatlon').innerHTML="Area: "+ll1.Longitude.toFixed(2)+";"+ll2.Longitude.toFixed(2)+";"+ll2.Latitude.toFixed(2)+";"+ll1.Latitude.toFixed(2);
	}
}

function showAllVessels()
{
	var checked = document.getElementById("allVesselsCB").checked;
	vessels=new Array();
//	map.DeleteAllShapes();

	var url;	
	if(checked){	
		url="http://www.vesseltracker.com/googleMapsServlet/area.xml?minLat="+minLat+"&maxLat="+maxLat+"&minLon="+minLon+"&maxLon="+maxLon+"&ts="+(new Date()).getTime();
		loadRegion(url);
	}
	else{
		url="http://www.vesseltracker.com/googleMapsServlet/owner_"+ ownerId+"_allGroups_op.xml?ts="+(new Date()).getTime();
        	loadOwner(url);
	}
	window.setTimeout("showAllVessels()",60000);
}

function loadRegion(url){
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

	if (!request) {return false;}
	else
	{
		request.open('get', url, true);
        request.onreadystatechange = receiveRegion;
		request.send(null);
     }
} 

function receiveRegion() {
        switch (request.readyState) {
                case 4:
                	if (request.status != 200) {} 
                	else 
                	{
                   	    regionXml = request.responseXML;
			 			addToVessels(regionXml);
						var url="http://www.vesseltracker.com/googleMapsServlet/owner_"+ownerId+"_allGroups_op.xml?ts="+(new Date()).getTime();
						loadOwner(url);
                    }
					break;
				default:
					break;
	}
}


function loadOwner(url) {
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

	// �berpr�fen, ob Request erzeugt wurde
	if (!request) {
		//alert("Kann keine XMLHTTP-Instanz erzeugen");
		return false;
	} else {
		// Request �ffnen
		request.open('get', url, true);
		// Request senden
		//request.send(null);
		// Request auswerten
		request.onreadystatechange = receiveOwner;
		request.send(null);
	}
}



// Request auswerten
function receiveOwner() {
	switch (request.readyState) {
		// wenn der readyState 4 und der request.status 200 ist, dann ist alles korrekt gelaufen
		case 4:
			if (request.status != 200) {
				//alert("Der Request wurde abgeschlossen, ist aber nicht OK\nFehler:"+request.status);
			} else {
				ownerXml = request.responseXML;
				addToVessels(ownerXml);
				updateMap();
			}
			break;
		default:
			break;
	}
}

function addToVessels(xml){
	var elemRoot = xml.getElementsByTagName('markers').item(0);
	if(!elemRoot) return;
    var ships = elemRoot. getElementsByTagName("marker");
	for(var i=0; i<ships.length; i++){
		var ship = ships[i];
		var mmsi=String(ship.getAttribute("mmsi"));
		vessels[mmsi]= ship;
	}
}

function updateMap()
{	
	var sidebarInnerHtml="";
	var noResultElement=document.getElementById('noResult');
	noResultElement.innerHTML="";

 	map.DeleteAllShapes();
	if (vessels.length == 0)
	{
		noResultElement.innerHTML="No Vessel found.";
		document.getElementById("sidebar").innerHTML=sidebarInnerHtml;
		return;
	}
	
	for(var i in vessels){
		var ship = vessels[i];
 		var description;   		
		var groupname=ship.getAttribute("groupName");
   		var name= ship.getAttribute("name");
		var imo = ship.getAttribute("imo");
		var id  = ship.getAttribute("id");
		var call=ship.getAttribute("call");
		var mmsi=ship.getAttribute("mmsi");
		var th=ship.getAttribute("th"); 
		var cog=ship.getAttribute("cog");
		var speed=ship.getAttribute("speed");
		var length=ship.getAttribute("length");
		var width=ship.getAttribute("width");
		var left=ship.getAttribute("left");
		var front=ship.getAttribute("front");
		var country=ship.getAttribute("country");
		var foto=ship.getAttribute("p");
		
		var flag=ship.getAttribute("flag");
		var lastSeen=ship.getAttribute("last_seen");
		var titleSidebar;

		var title = "<tr><td>Name:</td><td><a target=\"_blank\" href=\"/en/Ships/"+encodeShipnameForUrl(name);
		if(imo)
		{
			title += "-"+imo+".html";
		}	
		else
		{
			title += "-I"+id+".html";
		}
		title +="\">"+encodeShipname(name)+"</a></td></tr>";
	
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
			icon=icons['unknown0'];
		}
		else
		{
		  icon = icons['waiting'];
		}

		var countryHtml= '<tr><td>Country:</td><td><img src="http://images.vesseltracker.com/images/flags/'+flag+'.png" title="'+country+'"/></td></tr>';
		var mmsiHtml='<tr><td>MMSI:</td><td>'+mmsi +'</td></tr>';
		var imoHtml="";
		var imageHtml;
		if(imo){
			imoHtml='<tr><td>IMO: </td><td>' +imo+'</td></tr>';
		}
		
		if(foto){
			imageHtml='<img src="http://images.vesseltracker.com/images/vessels/thumbnails/'+foto+'.jpg" />'
		}
		
		var callHtml='<tr><td>Callsign: </td><td>' +call+'</td></tr>';
		var lengthHtml='<tr><td>Length: </td><td>' +length+'</td></tr>';
		var widthHtml='<tr><td>Width: </td><td>' +width+'</td></tr>';
		
		var lastSeenHtml="";
		if(lastSeen!=null){
			lastSeenHtml='<tr><td>Last seen: </td><td>' +lastSeen+'</td></tr>';
		}

		var speedHtml="";
		if(speed!=null){
			speedHtml ='<tr><td>Speed: </td><td>' +speed+'</td></tr>';
		}
		
		thHtml="";
		if(th!=null){
			thHtml='<tr><td>True head: </td><td>' +th+'</td></tr>';
		}
		var cogHtml="";
		if(cog!=null){		
			cogHtml='<tr><td>Course over Ground: </td><td>' +cog+'</td></tr>';
		}

		description="<html><table>"+title+countryHtml+imoHtml+mmsiHtml+callHtml+lengthHtml+widthHtml;
		description += lastSeenHtml+speedHtml;
		description += thHtml+cogHtml+"</table><center>"+imageHtml+"</center></html>";

			
		var lat;
		var lon;

		if(ship.getAttribute("lat")!=null){
			lat=ship.getAttribute("lat");
		}else{
			lat=ship.getAttribute("last_lat");
		}
                
		if(ship.getAttribute("lng")!=null){     
                        lon=ship.getAttribute("lng");
                }else{
                        lon=ship.getAttribute("last_lon");
                }

			
 		var shapeId=addIcon(icon, lat, lon, name, null,description);

 /*		if(groupname){
                        titleSidebar="<a style=\"background:#ffff33;\" target=\"_blank\"  href='javascript:opener(\"" +shapeId +"\")'>";
                }else{
                        titleSidebar="<a href='javascript:opener(\"" +shapeId + "\")'>";
                }
                titleSidebar += encodeShipname(name)+"</a><br />";

*/

		if(groupname){
			shapeId=addIcon(null, lat, lon, name, groupname, description); 
//			sidebarInnerHtml=sidebarInnerHtml+titleSidebar; 			
		}else{
//			sidebarInnerHtml=sidebarInnerHtml+titleSidebar;
		}

		if(groupname){
                        titleSidebar="<a style=\"background: rgb(255, 255, 51)\"  href='javascript:opener(\"" +shapeId +"\")'>";
                	titleSidebar += encodeShipname(name)+" ("+groupname+")"+"</a><br />";
		}else{
                        titleSidebar="<a href='javascript:opener(\"" +shapeId + "\")'>";
			titleSidebar += encodeShipname(name)+"</a><br />";
                }
		if(lat!=null && lon!=null){
			sidebarInnerHtml=sidebarInnerHtml+titleSidebar;		
		}
	}
	document.getElementById("sidebar").innerHTML=sidebarInnerHtml;
}

function addIcon(icon,lat, lon, name, groupname, description){
	if(lat==null || lon ==null){
		return null;
	}
	var point = new VELatLong(lat, lon);
        var shape = new VEShape(VEShapeType.Pushpin, point);
        if(groupname){
		shape.SetCustomIcon("<img src='./circle.png' style='margin-top: -6px; margin-left: -6px;' />");
        	shape.SetTitle("Group: "+groupname);
       	}else{	
		shape.SetCustomIcon(icon);
	}
	shape.SetDescription(description);receiveRegion
        map.AddShape(shape);
	return shape.GetID();

}

function DoCenterZoom()
{
         map.SetCenterAndZoom(centerPoint, zoom);
}



function encodeShipname(name)
{
	var rets = name.toLowerCase();
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
		retb = retb+ sp[i].charAt(0).toUpperCase()+ sp[i].substr(1);
	}
	return retb;
}

function opener(id)
{
	var shape = map.GetShapeByID(id);
	map.SetCenter(shape.GetPoints()[0]);
	map.HideInfoBox();
	map.ShowInfoBox(shape);
}
