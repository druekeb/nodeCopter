var vtMap;
var request;

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
	var zoom = 10;
	var width = 500;
        var height = 375;
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
	  height = parseInt(params['h']);
	}
	if (params['c'] != null)
	{
	   controls = (params['c'] == 1);
	}

	document.getElementById("gatshipMapSmall").style.cssText ="overflow:hidden;position:relative;width:" + width + "px;height:" + height + "px;";

    vtMap = new VtMap("gatshipMapSmall","infobox","sidebar","vtMap");
    vtMap.init();
    vtMap.addControl("KeyboardDefaults");
    vtMap.addControl("MouseDefaults");
    vtMap.addControl("Attribution");
    if(controls)
    {
    vtMap.addControl("PanZoom");
    }
    
    if (params['imo']== null || params['imo']=="")  return;
    
    imo = parseInt(params['imo'],10);
    if (imo == null || isNaN(imo) || imo == 0) return;

    //	var url = "http://www.vesseltracker.com/aisserver/googleMapsNew/ship_"+imo+".xml"; //permanently moved
	var url = "http://www.vesseltracker.com/googleMapsServlet/ship_"+imo+".xml";  

	
	vtMap.setZoomLevel(zoom);
	vtMap.loadVesselXML(url);
	//vtMap.loadVesselXML("singleVessel.xml"); //zum Testen
}

function changePosition(){} //um moveEnd-Event abzufangen(wg. large gatship-Map)

