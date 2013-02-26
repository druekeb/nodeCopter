var map;
var markers = new OpenLayers.Layer.Markers( "Markers" );
var proj4326 = new OpenLayers.Projection("EPSG:4326"); //WGS84 (Lon, Lat)
var projmerc = new OpenLayers.Projection("EPSG:900913"); //Mercator (m)
var sidebar = "";
var g_data;
var icons;
var osb_state = 0;

var currentPopup;

function transform(latlon)
{
	var latlon2 = latlon.clone();
	latlon2.transform(proj4326,projmerc);
	return latlon2;
}

function prepareIcons() {
	var size = new OpenLayers.Size(22,22);
	var offset = new OpenLayers.Pixel(-11, -11);
	icons = new Array(10);
	for(var i = 1; i < 10; i++) {
		icons[i] = new OpenLayers.Icon("http://www.vesseltracker.com/images/googlemaps/icon"+i+".png",size,offset);
	}
	return icons;
}


function init()
{
	
	prepareIcons();
	var center = transform(new OpenLayers.LonLat(9.877434,53.572986));
	var zoom = 13;
	map = new OpenLayers.Map("map", {
	controls: [
	new OpenLayers.Control.KeyboardDefaults(),
	new OpenLayers.Control.MouseDefaults(),
	new OpenLayers.Control.LayerSwitcher(),
	new OpenLayers.Control.PanZoomBar(),
	new OpenLayers.Control.MousePosition()],
	maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34),
	numZoomLevels: 18,
	maxResolution: 156543,
	units: 'm',
	projection:projmerc,
	displayProjection: proj4326});

	 OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;
         OpenLayers.Util.onImageLoadErrorColor = "transparent";


  var urlArray = ["http://t1.tiles.vesseltracker.com/vesseltracker/${z}/${x}/${y}.png",
                   "http://t2.tiles.vesseltracker.com/vesseltracker/${z}/${x}/${y}.png",
                   "http://t3.tiles.vesseltracker.com/vesseltracker/${z}/${x}/${y}.png"];

var vt = new OpenLayers.Layer.OSM("vesseltracker", urlArray);

 
	var mapnik_layer = new OpenLayers.Layer.OSM.Mapnik("Mapnik");
	var tah_layer = new OpenLayers.Layer.OSM.Osmarender("Tiles@Home");
	map.addLayers([vt,mapnik_layer, tah_layer]);
	reloadMap();

}


function reloadMap()
{
	var jetzt = new Date();
	var ts = jetzt.getTime();
	var request = OpenLayers.Request.GET({url: "http://www.vesseltracker.com/googleMapsServlet/owner_16878_default.xml?id="+ts, callback: refreshMap});
}

function closeBoxCallbackFunc(ev){

	map.removePopup(currentPopup)
	osb_state = 0;
	osb_current_feature = null;
	OpenLayers.Event.stop(ev);
}

function addMarker(layer, lon, lat, popupContentHTML,icon) {


	var ll = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
    	var feature = new OpenLayers.Feature(layer, ll,{icon:icon});
	var popup=new OpenLayers.Popup.FramedCloud(null,ll,null,popupContentHTML,icon,true,closeBoxCallbackFunc);
   	feature.popup=popup;
	
	var marker = feature.createMarker();

    	var marker_click = function (ev)
	{
		if (osb_state == 0)
		{
			this.createPopup(this.closeBox);
			map.addPopup(this.popup);
			currentPopup=this.popup;
			osb_state = 1;
			osb_current_feature = this;
		}
		else if (osb_state == 1 && osb_current_feature == this)
		{
			map.removePopup(this.popup)
			osb_state = 0;
			osb_current_feature = null;
		}
		OpenLayers.Event.stop(ev);
	};
	var marker_mouseover = function (ev)
	{
		if (osb_state == 0)
		{
			document.getElementById("map_OpenLayers_Container").style.cursor = "pointer";
			this.createPopup(this.closeBox);
			map.addPopup(this.popup)
		}
		else if (osb_state != 2 && this == osb_current_feature) /* If not adding a new bug show pointer over current feature */
			document.getElementById("map_OpenLayers_Container").style.cursor = "pointer";

		OpenLayers.Event.stop(ev);
	};
	var marker_mouseout = function (ev)
	{
		if (osb_state == 0)
		{
			document.getElementById("map_OpenLayers_Container").style.cursor = "crosshair";
			map.removePopup(this.popup);
		}
		else
			document.getElementById("map_OpenLayers_Container").style.cursor = "default";
		OpenLayers.Event.stop(ev);
	};
	
	marker.events.register("click", feature, marker_click);
	marker.events.register("mouseover", feature, marker_mouseover);
	marker.events.register("mouseout", feature, marker_mouseout);

    layer.addMarker(marker);
}

  




function refreshMap(request)
{
	var xmlDoc = request.responseXML;
	var markerElements = xmlDoc.documentElement.getElementsByTagName("marker");
	marker = new Array(markerElements.length);
	info = new Array(markerElements.length);
	sidebar_html = "- ";
	markers.destroy();
	markers = new OpenLayers.Layer.Markers( "Markers" );
	map.addLayer(markers);
	sidebar = "";
	for(var i = 0; i < markerElements.length; i++)
	{
		var lat = parseFloat(markerElements[i].getAttribute("lat"));
		var lon = parseFloat(markerElements[i].getAttribute("lng"));
		var pt = transform(new OpenLayers.LonLat(lon, lat));
		var icon = parseInt(markerElements[i].getAttribute("icon")); 
		addMarker(markers,lon,lat,markerElements[i].getAttribute("name"),icons[icon].clone());
		sidebar += "<a onclick='return false;' href=''>"+markerElements[i].getAttribute("name") + "</a> - ";
		map.setCenter(pt,13);
	}
	document.getElementById("vessellist").innerHTML = sidebar;
}

