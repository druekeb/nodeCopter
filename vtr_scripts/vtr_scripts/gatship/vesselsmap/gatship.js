var vtMap;
var width;
var height;
var ownerId;
var userId;
var minLat;
var maxLat;
var minLon;
var maxLon;

var centerPoint;
var zoom;
var showArea;

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
	
function onLoad()
{
	var params = getUrlParams();
	zoom = 10;
	width = 500;
        height = 375;
	var controls = true;
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
	  height = parseInt(params['h']) -100; //-100 für infobox unterhalb
	}
	if (params['c'] != null)
	{
	   controls = (params['c'] == 1);
	}
        if(params['userid']!= null)
	{
	        userId = parseInt(params['userid']);
	}

	if(params['owner']!=null){
		ownerId=parseInt(params['owner']);
	}
	else
	{
		if (userId == 136621)
		{
	//	  ownerId = 168127;
		}
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
	
	document.getElementById("gatshipMap").style.cssText="float:left;overflow:hidden;position:relative;width:" + (width-153) + "px;height:" + height + "px;";
	document.getElementById("sidebar").style.cssText="border:1px solid #808080;overflow:auto;padding-left:3px;width:150px;height:"+(height-2)+"px;font-family:Arial, Helvetica, sans-serif;font-size: 12px;";
	document.getElementById("infobox").style.cssText="width:700px;height:100px;border:1px solid #808080;";
	document.getElementById("nord").style.cssText="position:absolute; top:"+35+"px; left:"+((width-153)/2.0-20)+"px;color:white; z-index:1;";
	document.getElementById("south").style.cssText="position:absolute; top:"+(height-10)+"px; left:"+((width-153)/2.0-20)+"px;color:white; z-index:1;";
	document.getElementById("west").style.cssText="position:absolute; top:"+(height/2.0)+"px; left:"+(5)+"px;color:white; z-index:1;";
	document.getElementById("ost").style.cssText="position:absolute; top:"+(height/2.0)+"px; left:"+(width-153-30)+"px;color:white; z-index:1;";
	document.getElementById("noResult").style.cssText="position:absolute; top:"+(height/2.0)+"px;left:"+((width-153)/2.0-125)+"px;color:red; background-color:white; z-index:1; font-size:30px;"; 
	
	
   vtMap = new VtMap("gatshipMap","infobox","sidebar","vtMap");
	 vtMap.init();
	 vtMap.addControl("NavigationPlusMouseWheel");
	 vtMap.addControl("MousePosition");
	 vtMap.addControl("Attribution");
	 vtMap.addControl("KeyboardDefaults");
	 if(controls)
	    {
	    vtMap.addControl("PanZoom");
	    }
	 
	window.setInterval(showAllVessels, 180000);
	centerPoint= new OpenLayers.LonLat((maxLon+minLon)/2.0, (maxLat+minLat)/2.0 );
	doCenterZoom();
	changePosition();
	showAllVessels();	
}	

function changePosition(){
	
	var bounds = vtMap.getBounds();
	var ll1 = new OpenLayers.LonLat(bounds.left, bounds.top);
 	var ll2 = new OpenLayers.LonLat(bounds.right, bounds.bottom);

	document.getElementById('nord').innerHTML=ll1.lat.toFixed(2);
	document.getElementById('west').innerHTML=ll1.lon.toFixed(2);
	document.getElementById('south').innerHTML=ll2.lat.toFixed(2);
	document.getElementById('ost').innerHTML=ll2.lon.toFixed(2);
	if(showArea){
		document.getElementById('minmaxlatlon').innerHTML="Area: "+ll1.lon.toFixed(2)+";"+ll2.lon.toFixed(2)+";"+ll2.lat.toFixed(2)+";"+ll1.lat.toFixed(2);
	}
}
function showAllVessels()
{
	var checked = document.getElementById("allVesselsCB").checked;
	var regionURL = "http://www.vesseltracker.com/googleMapsServlet/area.xml?minLat="+minLat+"&maxLat="+maxLat+"&minLon="+minLon+"&maxLon="+maxLon+"&ts="+(new Date()).getTime();
	//var ownerURL = "http://www.vesseltracker.com/googleMapsServlet/owner_"+ ownerId+"_allGroups_op.xml?ts="+(new Date()).getTime();
	var ownerURL = "http://www.vesseltracker.com/googleMapsServlet/user_"+ userId+"_allGroups_op.xml?ts="+(new Date()).getTime();

	if (checked)
	{
		vtMap.loadVesselXML(regionURL,null, ownerURL);
	}
	else 
	{
		vtMap.loadVesselXML(ownerURL);
	}
}

 function doCenterZoom()
 {
	 vtMap.setCenter(centerPoint.lon,centerPoint.lat, zoom);
 }
 


