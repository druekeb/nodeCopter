
function VtMap(mapdiv, infoboxdiv, sidebardiv, vname) {
	var POLYGON_MINZOOM = 14;
	var COMPARE_RECTANGLES_ARRAY_SIZE = 8;
	
	var me = this;
	var varname = vname;
	var divname_map = mapdiv;
	var map;
	var reloadInterval;
	var moveEndEvent = true;
	var clusterMode = false;
	var myVesselMode = false;
	var clickControl;
	var drawFeatureControl;
	var borderColor;
		
	var divname_sidebar = sidebardiv;
	var divname_infobox = infoboxdiv;

	var projwgs84 = new OpenLayers.Projection("EPSG:4326"); // WGS84 (Lon, Lat)
	var projmerc = new OpenLayers.Projection("EPSG:900913"); // Mercator (m)
	
	var mapLayer;
	var iconLayer;
	var trackingAndClusteringLayer;
	var trackPointLayer;
	var followIconLayer;
	var polygonLayer;
	var lastReload = 0;
	var followShipId;
	var currentMarkerShipId;
	var currentMarkerVesselName;
	
	var specialIcon;
	var specialMarker;
	
	var lastReloadBounds = null;
	var clusters;
	var historyShips = [];
	var keepDialogOpen = false;
	
	var reloadTimer;
	var reloadMyVesselsTimer;
	
	var colors =['Red','Blue','Yellow','Magenta','White','Orchid','SpringGreen','Gray','Crimson','Aqua'];
	var firstLoad = true;
	var adder = true;
	var clickEvent = Object();

	var vesselsToShow_startIndex;
	var vesselsToShow_vessels;
	var vesselsToShow_filter;
	var vesselsToShow_timeout;
	var vesselsToShow_sidebarPanTo;
	var vesselsToShow_showNames;
	var compare_rectangles = [createRectangle(0,0,0,0,0)];		
	
	var nameGridArray = new Array();
	var nameGridX = 0; 
	var nameGridY = 0;
	var keyControl;
	var currentMeasureShipId;
/**
	 *Initialisation of the map
	 */
	
	this.changeBaseLayer= function(layername){
		var layer ;
		
		if (layername == "Google Physical") {
			layer = new OpenLayers.Layer.Google("Google Physical", {
				type : google.maps.MapTypeId.TERRAIN,
				numZoomLevels : 19,
				animationEnabled:false
			});
		} else if (layername == "Google Streets") {
			var layer = new OpenLayers.Layer.Google("Google Streets", {
				numZoomLevels : 19,
				animationEnabled:false
			});
		} else if (layername == "Google Hybrid") {
			var layer = new OpenLayers.Layer.Google("Google Hybrid", {
				type : google.maps.MapTypeId.HYBRID,
				numZoomLevels : 19,
				animationEnabled:false
			});
		} else if (layername == "Google Satellite") {
			var layer = new OpenLayers.Layer.Google("Google Satellite", {
				type : google.maps.MapTypeId.SATELLITE,
				numZoomLevels : 19,
				animationEnabled:false
			});
		} else {
			var urlArray = [
					"http://t1.tiles.vesseltracker.com/vesseltracker/",
					"http://t2.tiles.vesseltracker.com/vesseltracker/",
					"http://t3.tiles.vesseltracker.com/vesseltracker/" ];
			var layer = new OpenLayers.Layer.TMS(
					"OpenStreetMap",
					urlArray,
					{
						transitionEffect : 'resize',
						numZoomLevels : 19,
						transitionEffect : 'resize',
						type : 'png',
						getURL : getTileURL,
						attribution : 'Map-Data <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-By-SA</a> by <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors'
					});
		}
		map.addLayer(layer);
		map.setBaseLayer(layer);
		
	}
	
	
	this.getPolygonLayer = function() {return polygonLayer;}
	
	this.getTrackingAndClusteringLayer = function() {return trackingAndClusteringLayer;}
	
	function getTileURL(bounds) 
	{
	  var res = this.map.getResolution();
	  var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
	  var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
	  var z = this.map.getZoom();
	  var limit = Math.pow(2, z);
	  if (y < 0 || y >= limit) 
	  {
	    return null;
	  }
	  else 
	  {
	    x = ((x % limit) + limit) % limit;
	    url = this.url;
	    path= z + "/" + x + "/" + y + "." + this.type;
	    if (url instanceof Array) 
	    {
	      url = this.selectUrl(path, url);
	    }
	    return url+path;
	  }
	}
	
	this.init = function(showGoogle)
	{
		 map = new OpenLayers.Map(divname_map, {
			controls : [],
			maxExtent : new OpenLayers.Bounds(-20037508.34, -20037508.34,20037508.34, 20037508.34),
			numZoomLevels : 18,
			maxResolution : 156543,
			units : 'm',
			projection : projmerc,
			displayProjection : projwgs84
			});
		OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;
		OpenLayers.Util.onImageLoadErrorColor = "transparent";
		if(reloadInterval)
		{
			window.setInterval(varname + ".reloadData()",reloadInterval);
		}
		moveEndEvent = true;
		if(moveEndEvent)
		{
			map.events.on({"moveend":mapEventTimer});
		}
		
		var urlArray = [	"http://t1.tiles.vesseltracker.com/vesseltracker/",
		                	"http://t2.tiles.vesseltracker.com/vesseltracker/",
		                	"http://t3.tiles.vesseltracker.com/vesseltracker/"	];
		
		mapLayer = new OpenLayers.Layer.TMS("OpenStreetMap", urlArray, {
			transitionEffect : 'resize',  
			numZoomLevels: 19, 
	        transitionEffect: 'resize',
	        type: 'png', 
	        getURL: getTileURL, 
	        attribution: 'Map-Data <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-By-SA</a> by <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors'
	    });
		
		followIconLayer = new OpenLayers.Layer.Markers("followIconLayer",{ displayInLayerSwitcher :false});
		iconLayer = new OpenLayers.Layer.Markers("iconLayer",{ displayInLayerSwitcher :false});
		trackingAndClusteringLayer = new OpenLayers.Layer.Vector("trackingAndClusteringLayer",{ displayInLayerSwitcher :false});
		trackPointLayer = new OpenLayers.Layer.Markers("trackPointLayer",{ displayInLayerSwitcher :false});
		polygonLayer = new OpenLayers.Layer.Vector("polygonLayer",{	maxResolution : 1000, displayInLayerSwitcher :false});
		
		this.handleKeypress = function(evt) {
			if (evt.keyCode === 27) { // ESCAPE 
										evt.stopImmediatePropagation();
										this.drawFeatureControl.deactivate();
										$('.measureDist').each(function(i,elem){
											$(elem).html("Distance Meter");
											});
										keyControl.deactivate();
									}
			};
		var keyboardOptions = {keydown: this.handleKeypress	};
		keyControl = new OpenLayers.Handler.Keyboard(this, keyboardOptions);

		this.drawFeatureControl = createDrawFeatureControl();
		map.addControl(this.drawFeatureControl);
		map.addLayers( [ mapLayer, polygonLayer, trackingAndClusteringLayer,
				trackPointLayer, iconLayer, followIconLayer ]);
		
	}
	
	this.wrapDateLine = function(doOrDont)
	{
		mapLayer.displayOutsideMaxExtent = doOrDont;
		mapLayer.wrapDateLine = doOrDont;
	}
	
	this.setInterval = function(time)
	{
		reloadInterval = time;
	}
	
	this.setMyVesselInterval = function(time)
	{
		if($('#nextReload').find('input').attr('checked')!=undefined)
		{
			me.reloadData();
			reloadMyVesselsTimer = window.setInterval(varname + ".reloadData()",time);
			$("#nextReload").html(g_nextReloadText +"<div onclick='javascript:vtMap.setMyVesselInterval(60000);'>"+
					"<input type='checkbox' checked='checked'/><span id='autoReload'>"+
					$("#translations input[name='reload_myvessels_auto']").val()+"</span></div>");
		}
		else
		{
			window.clearTimeout(reloadMyVesselsTimer);
			$("#nextReload").html("<div id='reloadNow' onclick='javascript:sendAjaxRequest(\"myVesselGroups\");sendAjaxRequest(\"myVessels\");vtMap.displayLoadGif(\"block\");'>"+
					$("#translations input[name='reload_myvessels']").val()+"</div>"+
					"<div onclick='javascript:vtMap.setMyVesselInterval(60000);'><input type='checkbox'/><span id='autoReload'>"+$("#translations input[name='reload_myvessels_auto']").val()+"</span></div>");	
		}
	}

	this.setMyVesselMode = function(mvMode)
	{
		lastReloadBounds=null;
		myVesselMode = mvMode;
		me.setInterval(mvMode?undefined:60000); //im MyVesselMode nicht automatisch nachladen
		var displaySlider = mvMode?"none":"block";
		$('#slider').css("display",displaySlider);
	}
	this.isClusterMode = function()
	{
		return clusterMode;
	}

	var closeDialog = function(x)
	{
		var ship = "'#ship_"+x+"'";
		$(ship).dialog('close');
	}
	
	this.setMoveEndEvent = function(doIt)
	{
		moveEndEvent = doIt;
		if (map)
		{
			if(doIt)
			{
				map.events.un({"moveend":mapEventTimer});
				map.events.on({"moveend":mapEventTimer});
			}
			else
			{
				map.events.un({"moveend":mapEventTimer});
			}
		}
	}
	/**
	 * Centers the map to lon,lat,zoom (WGS84)
	 */
	this.setCenter = function(lon, lat, zoom) {
		var ll = new OpenLayers.LonLat(lon, lat).transform(projwgs84, projmerc);
		map.setCenter(ll,zoom);
	}
	
	/**
	 * Get current ZoomLevel of the map
	 */
	this.getZoom = function() {
		return map.getZoom();
	}

	
	//Spezielle Methode für OSMSingleVessel.js, die einen VesselMarker zeichnet

	this.drawSingleMarker = function(lon,lat,iconNo,timestamp){
		var iconURL= "http://images.vesseltracker.com/images/googlemaps/icon"+(iconNo == "0"?"_lastpos":iconNo) + ".png";
		var ll = new OpenLayers.LonLat(lon, lat).transform(projwgs84, projmerc);
		var singleVesselIcon = new OpenLayers.Icon(iconURL, new OpenLayers.Size(20, 20));
		var ts = new Date();
		ts.setTime(timestamp);
		var hours = ts.getHours() < 10 ? "0" + ts.getHours() : ts.getHours();
		var minutes = ts.getMinutes() < 10 ? "0" + ts.getMinutes() : ts.getMinutes();
		var day = ts.getDate() < 10? "0" + ts.getDate() : ts.getDate();
		var month = (ts.getMonth()+1) < 10? "0" + (ts.getMonth()+1) : (ts.getMonth()+1);
		var date = day + "." + month + "." + ts.getFullYear();
		var bubbleText =  "" + date + "<br/>" + hours + ":" + minutes;
		
		var singleVesselFeature = new OpenLayers.Feature(trackPointLayer, ll,{icon:singleVesselIcon});
		singleVesselFeature.data.popupContentHTML = bubbleText;

		var singleVesselMarker = singleVesselFeature.createMarker();
	
		var singleVessel_mouseover = function (ev)
		{
			if (this.popup == null)
			{
				this.popup = this.createPopup();
				this.popup.autoSize = true;
				this.popup.maxSize = new OpenLayers.Size(600,100);
				map.addPopup(this.popup, false);
			}
			else
			{
			this.popup.toggle();
			}
		}
		var singleVessel_mouseout = function (ev)
		{
			this.popup.toggle();
		}
		singleVesselMarker.events.register("mouseover", singleVesselFeature, singleVessel_mouseover);
		singleVesselMarker.events.register("mouseout", singleVesselFeature, singleVessel_mouseout);
		
		iconLayer.clearMarkers();
		iconLayer.addMarker(singleVesselMarker);	
		}	

//Spezielle Methode für  OSMMediaPositionMap.js, um ein draggable Feature(MediaIcon) zu plazieren
	
	this.drawSingleFeature = function(lon,lat,iconURL, size, draggable, longitudeId, latitudeId, iconWidth, iconHeight, iconXOffset, iconYOffset){
		var ll = new OpenLayers.LonLat(lon, lat).transform(projwgs84, projmerc);

		var defaultStyle = new OpenLayers.Style(
   			 {
   	      	      externalGraphic : iconURL,
   	      	      fillOpacity : 1,
   	      	      pointRadius : size,
   	      	      graphicWidth : iconWidth,
   	      	      graphicHeight : iconHeight,
   	      	      graphicXOffset : iconXOffset,
   	      	      graphicYOffset : iconYOffset
   	      	   });
   	   var styles = new OpenLayers.StyleMap(
   	   {
   	      "default" : defaultStyle 
   	   });
      
       		var point = new OpenLayers.Geometry.Point(ll.lon, ll.lat);
      		var pointFeature = new OpenLayers.Feature.Vector(point);
      		trackingAndClusteringLayer.styleMap = styles;
      		trackingAndClusteringLayer.addFeatures([pointFeature]);
      		if(draggable)
			{
      			var dragControl = new OpenLayers.Control.DragFeature(trackingAndClusteringLayer,{
				    onComplete: function(feature, pixel) 
				    {
	      				var lonlat = new OpenLayers.LonLat(feature.geometry.x, feature.geometry.y).transform(projmerc,projwgs84);
			   			$("#"+latitudeId).val(lonlat.lat);
			   			$("#"+longitudeId).val(lonlat.lon);
				    }
			    });
      			map.addControl(dragControl);
				dragControl.activate();
			}
		}

//Methode, die aus einer Json-Liste die passenden Schiffs-Marker in den IconLayer zeichnet	
	this.addVesselsCustomer = function(filter,sidebarPanTo)
	{
		borderColor=0;
		var vessels = [];
		var index = myVesselMode?0:1;
		
		for (x in g_vessels[index]) {
			vessels.push(g_vessels[index][x]);
		}
		if(!myVesselMode)
		{
			for (x in g_vessels[2])
			{
				if (g_vessels[index][x] == undefined && g_vessels[2][x] !== undefined)
				{
					vessels.push(g_vessels[2][x]);
					g_vessels[2][x].independent = true;
				}
				else
				{
					delete g_vessels[2][x];
				}
			}
		}
		clusterMode=false;
		
		polygonLayer.destroyFeatures();
		
		/* remove and destroy all features from the trackingAndClusteringLayer*/
		while (trackingAndClusteringLayer.features.length >0)
		{
		    trackingAndClusteringLayer.features[0].destroy();
		}
		trackingAndClusteringLayer.removeAllFeatures(); 
		/* remove clickControl, cause it's for clusterMode only -> see drawClusters()*/
		if (clickControl)
			{
				clickControl.deactivate();
			}
		/* remove and destroy all objects from the map and from the marker layers (memory leak?) */
		while (trackPointLayer.markers.length > 0) {
				trackPointLayer.markers[0].destroy();
				trackPointLayer.removeMarker(trackPointLayer.markers[0]);
			}
		while (iconLayer.markers.length > 0) {
				iconLayer.markers[0].destroy();
				iconLayer.removeMarker(iconLayer.markers[0]);
			}
		while (map.popups.length > 0) {
					map.popups[0].destroy();
			}

		while (followIconLayer.markers.length > 0) {
				followIconLayer.markers[0].destroy();
				followIconLayer.removeMarker(followIconLayer.markers[0]);
			}
		$(".rectClass").remove();
		var followLonlat;
		
		if (!myVesselMode) {
			$("#vessellist").html("");
		}
		
		vesselsToShow_startIndex=0;
		vesselsToShow_vessels = [];
		for (var a = 0; a < vessels.length; a++)
		{
			if(!vesselsToShow_filter || showVessel(vessels[a]))
			{
				vesselsToShow_vessels.push(vessels[a]);
				if(!myVesselMode && typeof vessels[a].independent  == "undefined")
				{
					var vtUrl =  "http://" + window.location.host + "/"+ g_language+"/Ships/"+me.encodeShipnameForUrl(vessels[a].shipName);
					vtUrl += (vessels[a].imo?"-" + vessels[a].imo + ".html":"-I" + vessels[a].shipId + ".html");
					var sidebar_html="";
					sidebar_html += "<a style='color:#555555' href='javascript:"+varname+".opener("+ vessels[a].shipId;
					sidebar_html += (vesselsToShow_sidebarPanTo?",true)'":")'");
					sidebar_html += " ondblclick='javascript:window.open(\""+vtUrl+"\")'>"+ me.encodeShipname(vessels[a].shipName) + "</a><br/>";	
					$("#vessellist").append(sidebar_html);		
					vtUrl = null;
				}
			}
		}
		vesselsToShow_filter = filter;
		vesselsToShow_sidebarPanTo = sidebarPanTo;
		vesselsToShow_showNames = g_showVesselNames;
		if (vesselsToShow_showNames)	
		{
			nameGridX = Math.round(map.getSize().w / 20); 
			nameGridY = Math.round(map.getSize().h / 20);
			nameGridArray = new Array();
		}
		me.showIconsFrom();
		
		adder=!adder;
		if (followLonlat)
		{
			map.panTo(followLonlat);
		}
		followLonlat=null;
	}
	
	this.showIconsFrom = function()
	{
		var iii = 0
		var vessels = vesselsToShow_vessels;

		for (var i = vesselsToShow_startIndex; i < vessels.length; i++)
		{
			if (iii >= 500) 
			{
				vesselsToShow_startIndex = i;
				vesselsToShow_timeout = window.setTimeout(varname	+ ".showIconsFrom()", 0);
				return;
			}
			else
			{
				iii++;
			}
			
			vessels[i].lonlat = me.getLonLat(vessels[i]);
					
			if (vessels[i].lonlat)
			{
				var vesselPixel= map.getViewPortPxFromLonLat(vessels[i].lonlat.transform(projwgs84,projmerc));
				var gridX = Math.round(vesselPixel.x/20);
				var gridY = Math.round(vesselPixel.y/20);
				var gridIdx = nameGridX * gridY + gridX; 
				if(typeof nameGridArray[gridIdx] != "undefined"){
					if (nameGridArray[gridIdx][3] < vesselPixel.x) {
						nameGridArray[gridIdx] = [vessels[i].lonlat, vessels[i].shipName, i, vesselPixel.x];
					}
				}else {
					nameGridArray [gridIdx] = [vessels[i].lonlat, vessels[i].shipName, i, vesselPixel.x];
				}
				
				//male den Marker für das Vessel
				if (!vessels[i].icon) 
				{
					vessels[i].icon = "_lastpos";
				}
				addMouseOverMarker(vessels[i].shipId, vessels[i].lonlat, "http://images.vesseltracker.com/images/googlemaps/icon" + vessels[i].icon + ".png", new OpenLayers.Size(20, 20), vessels[i].shipName);
				
				if (map.getZoom() >= POLYGON_MINZOOM ||myVesselMode)
				{
					polygonLayer.addFeatures([me.addPolygon(vessels[i])]);
				}
				//kontrolliere, ob gelber Kreis für currentshipId gemalt werden muss
				if(vessels[i].shipId == currentMarkerShipId)
				{
					specialIcon = new OpenLayers.Icon("http://images.vesseltracker.com/images/googlemaps/circle.png", new OpenLayers.Size(22, 22));
					specialMarker = new OpenLayers.Marker(me.getLonLat(vessels[i]).transform(projwgs84,projmerc),specialIcon);
					followIconLayer.addMarker(specialMarker);
					specialMarker=null;
					specialIcon=null;
					me.opener(currentMarkerShipId);
				}
				if($('#cockpit').length > 0) //code only for CockpitMap
				{
					var filter = vesselsToShow_filter;
					//kontrolliere, ob blauer Kreis für myVessel-shipId's gemalt werden muss
					if(filter && g_highlight_myVessels == true)
					{
						if(g_vessels[0]["_"+ vessels[i].shipId] != undefined)
						{
							addMouseOverMarker(vessels[i].shipId, vessels[i].lonlat, "http://images.vesseltracker.com/images/circleblue.png", new OpenLayers.Size(27, 27));
						}
					}
					//kontrolliere, ob roter Kreis für ein Vessel mit followshipId gemalt werden muss
					if(followShipId && vessels[i].shipId == followShipId) 
					{
						if(map.calculateBounds().contains(vessels[i].lonlat.lon,vessels[i].lonlat.lat))
						{
							followLonlat = vessels[i].lonlat;
						}
						addMouseOverMarker(vessels[i].shipId, vessels[i].lonlat, "http://images.vesseltracker.com/images/googlemaps/circle_red.png", new OpenLayers.Size(30,30));
					}
					
					if (g_mytracks && g_mytracks.length >0)
					{
						if(g_mytracks[vessels[i].shipId]!=undefined)
						{
							me.addTrackingLine(g_mytracks[vessels[i].shipId],false);
						}
					}
				}
				newVtUrl = null;
			}
		}
		
		window.clearTimeout(vesselsToShow_timeout);
		
		if (vesselsToShow_showNames) {
			var layername = me.getBaseLayer().name;
			var cssClassName = "shipname_black";
			if (layername.indexOf("Hybrid") != -1 || layername.indexOf("Satellite") != -1) {
				cssClassName = "shipname_white";
			}
			
			var freePlace = 0;
			for ( var iii = nameGridX * nameGridY; iii > 0; iii--) {
				if (typeof nameGridArray[iii] != "undefined") {
					if (freePlace > (nameGridArray[iii][1].length / 3)) {
						var namePopup = new OpenLayers.Popup("popup_"+ nameGridArray[iii][2], nameGridArray[iii][0],
										new OpenLayers.Size(100, 30), "<div><nobr><span style='font-size:10px; position:absolute;' class='"+cssClassName+"'>"+nameGridArray[iii][1]+"</span></nobr></div>");
						map.addPopup(namePopup, false);
					}
					freePlace = 0;
				} else {
					freePlace++;
				}
			}
		}
		
		nameGridArray = new Array();
	}
	
//	Create Clusterfeatures and give them a "type" attribute for their size and a label attribute for display their ship-count
	
	this.drawClusters = function(){
		clusterMode = true;
		clusters = new Array(g_vessels[1].length);

		/* remove and destroy all features from the trackingAndClusteringLayer*/
		while (trackingAndClusteringLayer.features.length >0)
		{
		    trackingAndClusteringLayer.features[0].destroy();
		}
		trackingAndClusteringLayer.removeAllFeatures(); 
		
		while (trackPointLayer.markers.length > 0) {
			trackPointLayer.markers[0].destroy();
			trackPointLayer.removeMarker(trackPointLayer.markers[0]);
		}
		
		polygonLayer.destroyFeatures();
		/* remove and destroy all markers from the icon layer (memory leak?) */

		while (iconLayer.markers.length > 0) {
				iconLayer.markers[0].destroy();
				iconLayer.removeMarker(iconLayer.markers[0]);
			}
		while (map.popups.length > 0) {
					map.popups[0].destroy();
				}

		while (followIconLayer.markers.length > 0) {
				followIconLayer.markers[0].destroy();
				followIconLayer.removeMarker(followIconLayer.markers[0]);
			}

		for (var i = 0; i < g_vessels[1].length; i++)
		{
			var lat = g_vessels[1][i].lat;
			var lon = g_vessels[1][i].lon;
			var count = g_vessels[1][i].count;
	        clusters[i] = new OpenLayers.Feature.Vector((new OpenLayers.Geometry.Point(lon, lat)).transform(projwgs84,projmerc), {type: 15+ parseInt((Math.pow(Math.log(count),1.5))), label:count});
		}
		// create a layer styleMap with a symbolizer template for the trackingAndClusteringLayer
		trackingAndClusteringLayer.styleMap = new OpenLayers.StyleMap({
           		pointRadius: "${type}", // based on feature.attributes.type
                fillOpacity: 0,
                strokeOpacity:0,
               	label:"${label}", //based on feature.attributes.label
                fontWeight:"bold",
                fontSize:"0.9em",
                fontColor:"white",
				backgroundGraphic: "http://images.vesseltracker.com/images/osm/blur.png",
                backgroundGraphicZIndex:100000,
                graphicOpacity:1
            });
		trackingAndClusteringLayer.addFeatures(clusters);
		if(!clickControl)
		{
			clickControl = new OpenLayers.Control.SelectFeature(trackingAndClusteringLayer,
			{
				clickout: true, 
				toggle: true,
				multiple: false,
				hover: false
			});
			function selected (evt) {
			    var fx = evt.feature.geometry.x;
				var fy = evt.feature.geometry.y;
				var zoomInTo = map.getZoom() +4;
				map.setCenter(new OpenLayers.LonLat(fx,fy),zoomInTo);
			}
			map.addControl(clickControl);
			trackingAndClusteringLayer.events.un({"featureselected": selected});
			trackingAndClusteringLayer.events.on({"featureselected": selected});

		}

		clickControl.activate();
        $("#vessellist").html("");
	}
	
	//Methode, die aus einem mediaArray Features kreiert, die 
	//1. einen Marker in den iconLayer setzen und 
	//2. ein Popup onMouseOver öffnen
	
	this.addMediaObjects = function(type){
		var media_icon, vtUrl1,vtUrl2, m_icon, ll, m_feature, size; 
		
		iconLayer.clearMarkers();
		while (map.popups.length > 0) {
			map.popups[0].destroy();
		}
		if (type == "report")
		{
			var sidebar_html = "<table>";
			for (var i = g_reports.length -1; i >= 0 ; i--)			
			{
				media_icon = "http://images.vesseltracker.com/images/googlemaps/"+g_reports[i]['type']+"_"+g_reports[i]['category']+".png";
				size = new OpenLayers.Size(22,22);
				m_icon = new OpenLayers.Icon(media_icon, size);
				ll = new OpenLayers.LonLat(g_reports[i]['lon'],g_reports[i]['lat']).transform(projwgs84, projmerc);
				
				vtUrl1 =  "http://"+window.location.hostname+':'+window.location.port+'/'+g_language+'/';
				if (g_reports[i]['type']=="VesselReport")
				{
					var shipName = this.encodeShipnameForUrl(g_reports[i]['name']);
					vtUrl1 +="Ships/";
					vtUrl1 += shipName + '-' + g_reports[i]['objectId']; 
				}
				else //type =="PortReport"
				{
					var portName = g_reports[i]['vName'];
					vtUrl1 +="Port/";
					vtUrl1 += portName +"/Dashboard";
				}
				vtUrl2 = ".html?show=reports";
				sidebar_html += createSidebarText(g_reports[i], media_icon, vtUrl1, vtUrl2);
				
				m_feature = new OpenLayers.Feature(trackingAndClusteringLayer, ll,{icon:m_icon});
				m_feature.popupClass = OpenLayers.Class(OpenLayers.Popup.AnchoredBubble, 
						{ 'autoSize': true, 'closeOnMove': true, 'panMapIfOutOfView': false, 'keepInMap':true,'minSize':(new OpenLayers.Size(320,180)), 'maxSize':(new OpenLayers.Size(520,180))});
				
				m_feature.id = g_reports[i]['id'];
				m_feature.closeBox = true;
				m_feature.data.popupContentHTML =  createPopupText(type, g_reports[i],vtUrl1);
				m_feature.data.vtUrl = vtUrl1 + g_reports[i]['id'] + vtUrl2;
				m_feature.data.clicked = false;
				var m_marker = m_feature.createMarker();
				
				var feature_mouseover = function (ev)
				{
					if (this.popup == null) 
					{
						this.popup = this.createPopup();
						var close = function()
						{
							this.feature.data.clicked = false;
							this.hide();
						};
						this.popup.addCloseBox(close);
						map.addPopup(this.popup, false);
					}
					else
					{
						this.popup.show();
					}
				};
				var feature_mouseout = function (ev)
				{
					if(!this.data.clicked)
					{
						this.popup.hide();
					}
				};
				var feature_click = function (ev)
				{
					if (this.data.clicked) 
					{
						this.popup.hide();
						this.data.clicked = false;
					}
					else 
					{
						this.data.clicked = true;
					}
				};				
				m_marker.events.register("mousedown", m_feature, feature_click);
				m_marker.events.register("mouseover", m_feature, feature_mouseover);
				m_marker.events.register("mouseout", m_feature, feature_mouseout);
				iconLayer.addMarker(m_marker);
				trackingAndClusteringLayer.addFeatures([m_feature]);
			}
			sidebar_html += "</table>"
			document.getElementById(divname_sidebar).innerHTML = sidebar_html;
			sidebar_html=null;
			map.events.unregister("moveend", null, null);
			map.events.register("moveend", this, function (event) {
						for (var i=0; i<trackingAndClusteringLayer.features.length; i++)
						{
							var feature = trackingAndClusteringLayer.features[i];
							feature.destroyPopup();
						}
			});
		}
		else //(type == video or photo)
		{
			for (var i = 0; i < g_media.length; i++)		
			{
				if (type == "video")
				{
					media_icon = 'http://images.vesseltracker.com/images/googlemaps/icon_video.png';
					vtUrl1 = "http://images.vesseltracker.com/images/video_popup.html?youtube_id=";
					vtUrl2 ="";
				}
				else if (type == "photo")
				{
					media_icon = 'http://images.vesseltracker.com/images/googlemaps/icon_photo.png';
					vtUrl1 =  "http://"+window.location.hostname+':'+window.location.port+'/'+g_language+"/ShipPhotos/";
					var vtUrl2 = "-photo.html";
				}
				m_icon = new OpenLayers.Icon(media_icon, new OpenLayers.Size(22,22));
				ll = new OpenLayers.LonLat(g_media[i]['lon'],g_media[i]['lat']).transform(projwgs84, projmerc);
				m_feature = new OpenLayers.Feature(iconLayer, ll,{icon:m_icon});
				size = new OpenLayers.Size(g_media[i]['width'],g_media[i]['height']);
				m_feature.popupClass = OpenLayers.Class(OpenLayers.Popup.FramedCloud, { 'autoSize': false, 'panMapIfOutOfView': false, 'minSize': size });
				m_feature.data.overflow = "hidden";
				m_feature.data.popupContentHTML = createPopupText(type, g_media[i]);
				m_feature.data.vtUrl = vtUrl1 + g_media[i]['id'] + vtUrl2;

				var m_marker = m_feature.createMarker();
					var feature_mouseover = function (ev)
					{
						if (this.popup == null)
						{
							this.popup = this.createPopup();
							map.addPopup(this.popup,false);
						}
						else
						{
							this.popup.toggle();
						}
					}
					var feature_mouseout = function (ev)
					{
						this.popup.toggle();
					}
					var feature_dblclick = function(ev)
					{
						if (this.data.vtUrl.indexOf("video")>=0)
						{
							var w = 750;
							var h = 460;
							var x = screen.availWidth/2-wvessels/2;
							var y = screen.availHeight/2-h/2;
							var popupWindow = window.open(
							    		this.data.vtUrl,'','width='+w+',height='+h+',left='+x+',top='+y+',screenX='+x+',screenY='+y);
							    
							window.open(this.data.vtUrl,"video","width=600,height=400,left=500,top=100");
						}
						else
						{
							window.location.href = this.data.vtUrl;
						}
					}
				m_marker.events.register("mouseover", m_feature, feature_mouseover);
				m_marker.events.register("mouseout", m_feature, feature_mouseout);
				m_marker.events.register("dblclick", m_feature, feature_dblclick);
				
				iconLayer.addMarker(m_marker);
			}
		}
	}
	
	/**
	 * @param id String with the id of the feature on which the popup is to be opened
	 * @param lonlat position of the popup
	*/
	
	this.popupOpener = function (id,longitude, latitude) 
	{
		var feat = trackingAndClusteringLayer.getFeatureById(id);
		if (feat.popup && feat.popup.visible())
		{
			feat.marker.events.triggerEvent("mouseout");
			me.setCenter(longitude,latitude);
		}
		else
		{
			var zoom = map.getZoom();
			longitude += 4 ;
			me.setCenter(longitude,latitude,6);
			feat.marker.events.triggerEvent("mouseover");
		}
	}
	
	this.setFollowShipId = function(shipId)
	{
		followShipId = shipId;
	}
	
	this.getCurrentShipId = function()
	{
		return currentMarkerShipId;
	}
	
	this.setCurrentShipId = function(shipId)
	{
		currentMarkerShipId = shipId;
	}
	
	this.getCurrentShipName = function()
	{
		return currentMarkerVesselName;
	}
	
	this.encodeShipnameForUrl = function(name)
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
	
	 this.reloadData = function(restClock)
	{
		 if($('#nextReloadTime'))
			 {
			 	$('#nextReloadTime').text("60");
			 }
		 if (myVesselMode == true)
		 {
			 sendAjaxRequest("myVesselGroups");
			 sendAjaxRequest("myVessels");
		 }
		 else
		 {
			 lastReload = new Date().getTime();
			 lastReloadBounds = map.getExtent().transform(projmerc, projwgs84);
			 var params = getUrlParams();
			 var shipIds =[];
			 if (typeof g_openDialog_shipIds != "undefined")
			 {
				 shipIds = g_openDialog_shipIds;
			 }
			 var pageSource = undefined;
			 if (typeof g_pageSource != "undefined")
			 {
				 pageSource = g_pageSource;
			 }
			 var lastSeenTimeSpan = undefined;
			 if (typeof g_lastSeenTimeSpan!= "undefined")
			 {
				 lastSeenTimeSpan = g_lastSeenTimeSpan;
			 }
			 var showAllVesselsButtonActive = undefined;
			 if (typeof g_showAllVesselsButtonActive!= "undefined")
			 {
				 showAllVesselsButtonActive = g_showAllVesselsButtonActive;
			 }
			 /**
			  * params: 
			  * 0: subject
			  * 1,2,3,4: coordinates
			  * 5:zoom
			  * 6:params for 'genericMapVessels'
			  * 7:g_openDialog_shipIds of additional ships (satellite, lastposition, searchResults)
			  * 8:g_pageSource 
			  * 9:g_lastSeenTimeSpan: for super Account the timeLimit how far into the past shippositions are requested
			  * 10: show all vessels button, in cluster mode
			  * */
			 sendAjaxRequest("allVessels", lastReloadBounds.top, lastReloadBounds.left, lastReloadBounds.bottom, lastReloadBounds.right, map.getZoom(), params['type'],shipIds, pageSource, lastSeenTimeSpan, showAllVesselsButtonActive);
			 firstLoad=false;
		 }
		 me.displayLoadGif("block");
	}
  
 	this.zoomOut = function(levelCount){
 		if(levelCount == undefined)
 		{
 			map.zoomOut()
 		}
 		else
 		{
 	 		map.zoomTo(map.getZoom()-levelCount);
 		}
 	}

	this.zoomIn = function(levelCount){
 		if(levelCount == undefined)
 		{
 			map.zoomIn()
 		}
 		else
 		{
 	 		map.zoomTo(map.getZoom() + levelCount);
 		}
	}
	
	this.zoomTo = function(zoomLevel){
		map.zoomTo(zoomLevel);
	}
		
	/*Spezielle Methode für OSMSingleVessel.js und OSMCockpitMap.js, die den Track  zu einem Schiff anzeigt*/
	
	this.addTrackingLine = function(mytrack, zoomToExtent)
	{
		var trackingPoints = [];
		for (i in mytrack)
		{
			if (typeof mytrack[i]["lon"] == "number") //notwendig, weil IE 8 auch die Methoden eines js-assoziativen Arrays  durchläuft 
			{
				var trackPoint = new OpenLayers.Geometry.Point(mytrack[i]["lon"],mytrack[i]["lat"]);
				trackPoint.transform(projwgs84,projmerc);
				trackingPoints.push(trackPoint);
				if(mytrack[i]["desc"])
				{
					var ll = new OpenLayers.LonLat(mytrack[i]["lon"],mytrack[i]["lat"]).transform(projwgs84,projmerc);
					var trackPointIcon = new OpenLayers.Icon("http://images.vesseltracker.com/images/googlemaps/timedot.png", new OpenLayers.Size(25, 25));
					var trackPointFeature = new OpenLayers.Feature(trackPointLayer, ll,{icon:trackPointIcon});
			        trackPointFeature.data.popupContentHTML = mytrack[i]["desc"];
	
					var trackPointMarker = trackPointFeature.createMarker();
			
					var trackPoint_mouseover = function (ev)
					{
						if (this.popup == null)
						{
							this.popup = this.createPopup();
							this.popup.autoSize = true;
							this.popup.maxSize = new OpenLayers.Size(600,100);
							map.addPopup(this.popup, false);
						}
						else
						{
						this.popup.toggle();
						}
					}
					var trackPoint_mouseout = function (ev)
					{
						this.popup.toggle();
					}
					trackPointMarker.events.register("mouseover", trackPointFeature, trackPoint_mouseover);
					trackPointMarker.events.register("mouseout", trackPointFeature, trackPoint_mouseout);
					
					trackPointLayer.addMarker(trackPointMarker);	
				}
			}
		}

		var trackingLineStyle =  
        {
            strokeColor: colors[0],
            strokeWidth: 2,
            strokeLinecap: 'round'
        }; 
		
		var trackingLine = new OpenLayers.Geometry.LineString(trackingPoints);

		var trackingLineFeature = new OpenLayers.Feature.Vector(trackingLine, null,trackingLineStyle);
		trackingAndClusteringLayer.addFeatures([trackingLineFeature]);
		trackingAndClusteringLayer.drawFeature(trackingLineFeature);

		if (zoomToExtent)
		{
			map.zoomToExtent(trackingAndClusteringLayer.getDataExtent());
		}
	}
	
	this.addControl = function(c_name)
	{
		map.addControl(getControlByName(c_name));
	}
	
	/**
	Methode, um den Extent der angezeigten map abzufragen in wgs84
	*/
	
	this.getExtent = function()
	{
		map.updateSize();
		return map.getExtent().transform(projmerc,projwgs84);
	}
	
	/**
	Methode, um auf den Datenbereich eines Layers zu zoomen
	@param layer_name  = icon oder track
	*/
	
	this.zoomToExtent = function(layer_name)
	{
		
		map.updateSize();
		if (layer_name.toLowerCase() == "track")
		{
			if(trackingAndClusteringLayer.getDataExtent != null)
			{
				map.zoomToExtent(trackingAndClusteringLayer.getDataExtent());
			}
		}
		else if(layer_name.toLowerCase() == "icon")
		{
			if(!myVesselMode || !followShipId)
			{
				if(iconLayer.getDataExtent() != null)
				{
					map.zoomToExtent(iconLayer.getDataExtent());
					if (map.getZoom() < 2)
					{
						map.zoomTo(2);
					}
					else if (map.getZoom() > 12)
					{
						map.zoomTo(10);
					}
				}
			}
		}
		else if (layer_name.toLowerCase() == "polygon")
		{
			if(polygonLayer.getDataExtent() != null)
			{
				map.zoomToExtent(polygonLayer.getDataExtent());
			}
		}
	}	
	
	/**
	 * @param i integer index of ship in array vessels
	 * @param boolean pan indicates if to pan(center map) to ship or not
	*/
	
	this.opener = function (shipId, pan) {
		if(clusterMode == true)
		{
			return;
		}
		if (currentMarkerShipId != null) {
			if (followIconLayer.markers != null) {
				while (followIconLayer.markers.length > 0) {
					followIconLayer.markers[0].destroy();
					followIconLayer.removeMarker(followIconLayer.markers[0]);
				}
			}
		}
		var index = g_myVesselMode?0:1;
		var vessel = g_vessels[index]["_"+shipId];
		
		if (vessel == undefined)
		{
			vessel = g_vessels[2]["_"+shipId];
			index = 2;
		}
		if (vessel == undefined)
		{	
			vessel = g_vessels[0]["_"+shipId];
		}
		specialIcon = new OpenLayers.Icon("http://images.vesseltracker.com/images/googlemaps/circle.png", new OpenLayers.Size(24, 24));
		specialMarker = new OpenLayers.Marker(me.getLonLat(vessel).transform(projwgs84,projmerc),specialIcon);
		specialMarker.events.fallThrough=true;
		specialIcon=null;
		if(typeof g_vesselDetails != "undefined" && !g_vesselDetails)
		{
			specialMarker.events.register("click", specialMarker, function(e){
				sendAjaxRequest("vesselDetails",shipId, e.clientX, e.clientY);
			});
			
			specialMarker.events.register("mouseover", specialMarker, function(e){
				var mouseOverPopup= "<div class='mouseOverSpecialMarker' style='top:"+e.clientY+"px;left:"+e.clientX+"px;' >";
				mouseOverPopup +="<table><tr><td>";
				if (vessel.flagid){
					mouseOverPopup+="<img src='http://images.vesseltracker.com/images/flags/"+vessel.flagid+".png' style='height:15px;margin-bottom:-4px;'/>";
				}
				mouseOverPopup+="</td><td><b>"+me.encodeShipname(vessel.shipName)+"</b></nobr></td></tr>";
				mouseOverPopup+="<tr><td>Type:</td><td><nobr>"+vessel.type+"</nobr></td></tr>";
				if(vessel.destination != null && vessel.eta !=null){
					mouseOverPopup+="<tr><td><nobr>Dest:</td><td style='font-size:smaller'>"+vessel.destination+"</nobr></td></tr>";
					mouseOverPopup+="<tr><td><nobr>ETA:</td><td>"+ vessel.eta +"</nobr></td></tr>";
				}else if(vessel.destination != null){
					mouseOverPopup+="<tr><td><nobr>Dest:</td><td style='font-size:smaller'>"+vessel.destination+"</nobr></td></tr>";
					mouseOverPopup+="<tr><td><nobr>ETA:</td><td>-</nobr></td></tr>";
				}
				if (vessel.pic){
					mouseOverPopup+="<tr><td colspan='2'><img src='http://images.vesseltracker.com/images/vessels/thumbnails/"+vessel.pic+".jpg'/></td></tr>";
				}
				mouseOverPopup+="</table></div>";
				$('body').append(mouseOverPopup);
			});
			
			specialMarker.events.register("mouseout", specialMarker, function(e){
				$(".mouseOverSpecialMarker").remove();
			});
		}else{
			specialMarker.events.register("dblclick", specialMarker, function(e){
				window.open("/" +g_language+"/Ships/"+me.encodeShipnameForUrl(vessel.shipName)+"-I"+shipId+".html","_blank",null);
			});
		}
		followIconLayer.addMarker(specialMarker);
		specialMarker=null;
			
		currentMarkerShipId = shipId;
		currentMarkerVesselName = vessel.shipName;
		if($("#"+divname_infobox).length > 0)
		{
			document.getElementById(divname_infobox).innerHTML = showVesselInfo(vessel);
		}
		if(pan)
		{
			map.panTo(me.getLonLat(vessel).transform(projwgs84,projmerc));
		}
	}
	
	
	this.getLonLat = function(vessel)
	{
		if (vessel!=null)
			{			
				if (vessel.lat) 
				{
					var lat = vessel.lat;
					var lon = vessel.lon;
					return new OpenLayers.LonLat(lon,lat);
				}
	//			else if (vessel.lastlon)
	//			{
	//				return new OpenLayers.LonLat(vessel.lastlon, vessel.lastlat);
	//			}
			}
		return null;
	}
	this.addPolygon = function(vessel) {
		//benötigte Daten
		var hdg = vessel.heading;
		var cog = vessel.course;
		var left = vessel.left;
		var front = vessel.front;
		var len = vessel.length;
		var lonlat = me.getLonLat(vessel);
		var lon = lonlat.lon;
		var lat = lonlat.lat;
		var wid = vessel.width;
		var angle_rad;
		if(!hdg || hdg==0.0)
		{
			if (!cog)
			{
				cog = 0.0;
			}
			angle_rad = deg2rad(-cog);
		}
		else
		{
			angle_rad = deg2rad(-hdg);
		}
		var cos_angle=Math.cos(angle_rad);
		var sin_angle=Math.sin(angle_rad);
		var shippoints = [];
	
		//front left
		var dx = -left;
		var dy = front-(len/10.0);	
	    shippoints.push(calcPoint(lon,lat, dx, dy,sin_angle,cos_angle));
	    
	    //rear left
	    dx = -left;
	    dy = -(len-front);
		shippoints.push(calcPoint(lon,lat, dx,dy,sin_angle,cos_angle));
		
		//rear right
	    dx =  wid - left;
	    dy = -(len-front);
		shippoints.push(calcPoint(lon,lat, dx,dy,sin_angle,cos_angle));
		
		//front right
		dx = wid - left;
		dy = front-(len/10.0);
		shippoints.push(calcPoint(lon,lat,dx,dy,sin_angle,cos_angle));	
	    
	    //front center
		dx = wid/2.0-left;
		dy = front;
		shippoints.push(calcPoint(lon,lat,dx,dy,sin_angle,cos_angle));
		
		shippoints.push(shippoints[0]);		
		
		var linering = new OpenLayers.Geometry.LinearRing(shippoints);
		var polygon = new OpenLayers.Geometry.Polygon([linering]);
	
		// Define polygon style
		var fillColorMoving = "#85B5E6";
		var fillColorMoored = "#FAB57A";
		
		var fillColor = (vessel.status == "MOVING"?fillColorMoving:fillColorMoored);
	
		     var polystyle =
		     {
		         strokeColor: "#000000",
		         strokeOpacity: 1,
		         strokeWidth: 1,
		         fillColor: fillColor,
		         fillOpacity: 0.6
		     };
		
		var polygonVector = new OpenLayers.Feature.Vector(polygon, null, polystyle);
			
		return polygonVector;
	}
	
	this.displayTimelines = function(display){
		if(display)
		{
			if (g_timelines != undefined && g_timelines.length > 0)
			{
				var timelineStyle =  
		        {
		            strokeColor: colors[0],
		            strokeWidth: 2,
		            strokeLinecap: 'round'
		        }; 
				var timelineFeatures = [];
				for (var i = 0 ; i < g_timelines.length; i++)
				{
					var timelinePoints = [];
					for (var j= 0; j<g_timelines[i].polyline.length; j++ )
					{
						var timelinePoint = new OpenLayers.Geometry.Point(g_timelines[i].polyline[j].x,g_timelines[i].polyline[j].y);
						timelinePoint.transform(projwgs84,projmerc);
						timelinePoints.push(timelinePoint);
					}
					var timeline = new OpenLayers.Geometry.LineString(timelinePoints);
					var timelineFeature = new OpenLayers.Feature.Vector(timeline, null,timelineStyle);
					timelineFeatures.push(timelineFeature);
				}
				trackingAndClusteringLayer.addFeatures(timelineFeatures);
			}
			else
			{
				sendAjaxRequest("timelines");
			}
		}
		else
		{
			trackingAndClusteringLayer.removeAllFeatures(); 
		}
	}
	
	this.toggleMeasure = function(shipId, lon, lat)
	{
		if(drawFeatureControl.active)
		{
			drawFeatureControl.deactivate();
			$('.measureDist').each(function(i,elem){
				$(elem).html("Distance Meter");
				});
			keyControl.deactivate();
		}
		else
		{
			currentMeasureShipId =shipId;
			$('#output_KM_'+currentMeasureShipId).html("<span>0.00</span><span class='measureUnit'>KM</span>").next().html("<span>0.00</span><span class='measureUnit'>NMI</span>").parent().css("background", "url('http://images.vesseltracker.com/images/js/jquery/css/ui-lightness/images/ui-bg_gloss-wave_35_f6a828_500x100.png') repeat-x scroll 50% 50% #F6A828");
			startPoint = new OpenLayers.Geometry.Point(lon,lat).transform(projwgs84, projmerc);
			drawFeatureControl.activate();
			drawFeatureControl.handler.createFeature(startPoint.x,startPoint.y);
			drawFeatureControl.handler.insertXY(startPoint.x,startPoint.y);
			$('.measureDist').each(function(i,elem){
				$(elem).html("Stop");
				});
			keyControl.activate();
		}
	}
	
	this.removeMeasure = function() {
		if (drawFeatureControl.active) {
			drawFeatureControl.deactivate();
			$('.measureDist').each(function(i, elem) {
				$(elem).html("Distance Meter");
			});
			keyControl.deactivate();
		}
	}

	this.displayLoadGif = function(value){
		 if($("#loading_gif") != null)
			 $("#loading_gif").css("display",value);
	}

	function showVessel(vessel)
	{
		var status = vessel.status;
		if(	g_statusFilter[status] == false)
		{
			return false;
		}
		var type = vessel.type;
		if (type == 'Towing Vessel')
		{
			type ='Tug';
		}
		if(g_typeFilter[type] == null)
		{
			type = "Other";
		}
		if(g_typeFilter[type] == false)
		{
			return false;
		}
		
		if (g_lengthFilter !=null)
		{
			if(vessel.length < g_lengthFilter)
			{
				return false;
			}
		}	
				
		if (vessel.groupName != undefined
				&& !g_myVesselGroupFilter[vessel.groupName]) {
			return false;
		}
		
		return true;
	}
		
	function loadNews(hrs){
		window.open("http://"+window.location.hostname+":"+window.location.port+"/" +g_language+"/NewsHome.html?hours="+hrs,"_self",null);
	}

	function createGroupSelection(shipId)
	{		
		var groupSelection ='<select id="groupSelection_'+shipId+'">';
		for (var i = 0;i<g_myVesselGroupNames.length; i++)
		{
			var groupName = g_myVesselGroupNames[i];
			groupSelection +='<option'; 
			groupSelection +=(i == 0?" selected='selected' ":"");
			groupSelection += ' value="'+groupName+'">'+groupName+'</option>';
		}
		 return groupSelection +='</select>';
	}
	
	function createPopupText(type, mediaObject, vtUrl) {
		var text;
		if (type == "photo")
		{
			text = "<table><tr><td><b>" +mediaObject['title']+ "</b></td></tr><tr><td>";
			text += "<img name='"+mediaObject['id']+"_popup' src='http://images.vesseltracker.com/images/vessels/small/"+mediaObject['id']+".jpg'/></td></tr></table>";
		 }
		 else if (type == "video")
		 {	
			text = "<table><tr><td><b>" +mediaObject['title']+ "</b></td></tr><tr><td>";
			text += "<img name=\'"+mediaObject['id']+"_popup\' src='http://i.ytimg.com/vi/" +mediaObject['id']+"/default.jpg' /></td></tr></table>";
		 }
		 else if (type == "report")
		 {
			 text = "<div style='overflow:auto;height:172px;'>";
			text += "<table cellpadding='1px'><tr><td rowspan='2'>" +
					"<a href='" +vtUrl+ ".html'><img height='40px' src=\'"+mediaObject['image']+"\'></img></a>" +
							"</td><td><img width=\'20px\' src=\'"+mediaObject['flag'] +"\'></img>&nbsp;&nbsp;<a href='" +vtUrl+ ".html'><b>"
							+mediaObject['name']+ "</b></a></td></tr>" +
					"<tr><td >"+mediaObject['creationTime']+  mediaObject['creator']+"</td></tr>";
			text += "<tr><td colspan='2' style='font-size:13px'><b>" +mediaObject['subject']+"</b></td></tr>";
			text += "<tr><td colspan='2'>" +mediaObject['message'];
			
			text += "</td></tr></table></div>";
			if(mediaObject['prev']!=null || mediaObject['next']!=null)
			{
				text += "<div style='height:25px'>";
				text += "<table width='100%'><tr><td style='text-align:left'>";

				if(mediaObject['prev']!=null)
				{
					text += "<a href='javascript:"+varname+".popupOpener(\"" + mediaObject["prev"] +"\","+(mediaObject["prevLon"]?mediaObject["prevLon"]:mediaObject["lon"])+","+(mediaObject["prevLat"]?mediaObject["prevLat"]:mediaObject["lat"])+")\'>";
					text += "<&nbsp;"+(g_language=="de"?"aktuellere Meldung":"more recent News") +"</a>";
				}
				text += "</td><td style='text-align:right'>";
				if(mediaObject['next']!=null)
				{
					text += "<a href='javascript:"+varname+".popupOpener(\"" + mediaObject["next"] +"\","+(mediaObject["nextLon"]?mediaObject["nextLon"]:mediaObject["lon"])+","+(mediaObject["nextLat"]?mediaObject["nextLat"]:mediaObject["lat"])+")\'>";
					text += (g_language=="de"?"ältere Meldung":"older News") +"&nbsp;></a>";
				}
				text += "</td></tr></table>";
				text +="</div>";
			}
		 }
		return text;
	}
		
	function createSidebarText(mediaObject, mediaIcon,vtUrl1,vtUrl2){
		
		var text = "<tr><td nowrap style='font-size:10px' width='40%'>"+mediaObject['creationDate']+"</td><td width='10%'><img height='16px' src='"+mediaIcon+"'></img></td>";
		text +="<td nowrap style='font-size:11px' width='50%'><a style='color:#555555' href='javascript:"+varname+".popupOpener(\"" + mediaObject['id'] +"\","+mediaObject['lon']+","+mediaObject['lat']+")\'; ";
		text +="ondblclick=\"javascript:window.open(\'"+vtUrl1 + vtUrl2 +"\', \'_blank\',\'width=860,height=750,toolbar=yes,scrollbars=yes,left=800\');";
		text +="\">" +  mediaObject['name']+  "</a></td></tr>";	
		return text;
	}
	 
	 function deg2rad(grad) {return  grad * Math.PI/180.0;}

	function calcPoint(lon, lat, dx, dy, sin_angle, cos_angle)
	{
		var dy_deg = -((dx*sin_angle + dy*cos_angle)/(1852.0))/60.0;
		var dx_deg = -(((dx*cos_angle - dy*sin_angle)/(1852.0))/60.0)/Math.cos(deg2rad(lat));
	
		var lonlat = new OpenLayers.LonLat(lon - dx_deg, lat - dy_deg).transform(projwgs84, projmerc);
		
		return new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
	}

	function addMouseOverMarker(shipId, lonlat, iconUrl, size,title) 
	{
		var icon = new OpenLayers.Icon(iconUrl, size);
		var marker = new OpenLayers.Marker(lonlat,icon);
		marker.events.register("mouseover", marker, function(e) {
				me.opener(shipId);
				});
		iconLayer.addMarker(marker);
		icon=null;
		marker=null;
	}
	
	function mapEventTimer(event){
		window.clearTimeout(reloadTimer);
		reloadTimer = window.setTimeout(varname+".mapEvent()", 1000);
	}
	
	this.mapEvent = function() {
		if (varname == "vtMap") {
			$("#zoomBar").slider("option", "value", map.getZoom());
			
			if (typeof g_showAllVesselsButtonActive != "undefined"
					&& g_showAllVesselsButtonActive == true) {
				var newBounds = map.getExtent().transform(projmerc, projwgs84);
				if (lastReloadBounds != null) {
					var b_top = (parseFloat(lastReloadBounds.top) < parseFloat(newBounds.top));
					var b_left = (parseFloat(lastReloadBounds.left) > parseFloat(newBounds.left));
					var b_right = (parseFloat(lastReloadBounds.right) < parseFloat(newBounds.right));
					var b_bottom = (parseFloat(lastReloadBounds.bottom) > parseFloat(newBounds.bottom));
					if (b_top || b_left || b_right || b_bottom) {
						g_showAllVesselsButtonActive = false;
					}
				}
			}

			if (g_myVesselMode == false)
			{
				var shouldReload = true;

				// don't allow not REALTIME - users to zoom out too far
				if (map.getZoom() < 9 && g_mapType != 'REALTIME') {
					map.zoomTo(9);
					return;
				}
				if (shouldReload) {
					me.reloadData();
				} else if (!clusterMode && g_showVesselNames) {
					me.addVesselsCustomer(true);
				}
			}else{
				me.addVesselsCustomer(true);
			}
		}
	}
	
	function getUrlParams()
	{
		var strVars = window.location.search;
		strVars = strVars.replace("?","");
		var splitVars = [];
		var vars = [];
		splitVars = strVars.split("&");
		for(i=0;i<splitVars.length;i++)
		{
			var tmp = splitVars[i].split("=");
			var nname = tmp[0];
			vars[nname] = tmp[1];
		}
		return vars;
	}
	
	function formatLat(lat, showSeconds)
	{
		var ret;
		if(lat<0)
		{
			lat = -lat;
			ret ='S ';
		}
		else
		{
			ret ='N ';
		}
		var deg = Math.floor(lat);
		ret += padDigits(deg,2)+"° ";
		var min = ((lat-deg)*60.0);
		var minF = Math.floor(min);
		
		var sec = ((min - minF) * 60.0).toFixed(2);
		if (sec == 60.00)
		{
			sec = 0.0;
			sec = sec.toFixed(2);
			minF += 1;
		}
		if (showSeconds)
		{
			ret += padDigits(minF, 2) + "' ";
			ret += padDigits(sec, 5) + "\" ";
		}
		else
		{
			ret += padDigits(min.toFixed(2), 5) + "' ";	
		}
		return ret;
	}


	function padDigits(n, totalDigits) 
	{ 
		n = n.toString(); 
		var pd = '';
		if (totalDigits > n.length) 
		{ 
			for (var i=0; i < (totalDigits-n.length); i++) 
			{ 
					pd += '0'; 
			} 
		} 
		return pd + n;
	} 

	function formatLon(lon, showSeconds)
	{
		var ret;
		if(lon<0)
		{
			lon=-lon;
			ret='W ';
		}
		else
		{
			ret='E ';
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
		if (showSeconds)
		{
			ret += padDigits(minF, 2) + "' " + padDigits(sec, 5) + "\"";
		}
		else
		{
			ret += padDigits(min.toFixed(2), 5) + "' ";	
		}
		return ret;
	}

	function showVesselInfo(vessel) 
	{
		var vtUrl = "";
		if (vessel.imo)
		{
			vtUrl = "http://" + window.location.host + "/"+ g_language+"/Ships/"+me.encodeShipnameForUrl(vessel.shipName)+"-" + vessel.imo + ".html";
		}
		else
		{
			vtUrl = "http://" + window.location.host + "/" + g_language+"/Ships/"+me.encodeShipnameForUrl(vessel.shipName)+"-I" + vessel.shipId + ".html";
		}
		var photoTag;
		if (vessel.pic)
		{
			photoTag = '<img  border="0" src="http://images.vesseltracker.com/images/vessels/thumbnails/' + vessel.pic +'.jpg"/>';
		}
		else
		{
			photoTag = '<img  border="1" height="70px" src="http://images.vesseltracker.com/images/no-picture-available_HIRES.gif"/>';
		}
		var iconURL="http://images.vesseltracker.com/images/googlemaps/icon" + vessel.icon + ".png"
		
		var infoHtml = "<table class='customerInfo' border='0' cellspacing='0' width='100%' height='100%' cellpadding='3'><tr>";
		
		infoHtml += "<td class='desc' width='15%' rowspan='4'><a href="+vtUrl+" target='_blank'>"+photoTag+"</a></td>";
		infoHtml += "<td class='desc' width='8%'>Name:</td><td class='data' width='15%'><a href='"+vtUrl+"' target='_blank'><b>"+ me.encodeShipname(vessel.shipName) + "</b></a></td>";

		infoHtml += "<td class='desc' width='7%'>Flag:</td><td class='data' width='13%'>";
		if (vessel.nationality) {infoHtml += vessel.nationality;}
		infoHtml += "&nbsp;</td>";
		
		var status = (vessel.status && vessel.status != "null"?vessel.status:"UNKNOWN");
		infoHtml += "<td class='desc' width = '7%'>Status:</td><td class='data' width = '13%'>"+ status +"</td>";
		infoHtml += "<td class='desc' width='6%'>"+(vessel.lastSeen?"Time:":"")+"</td><td class='data' width='17%'>"+ (vessel.lastSeen?vessel.lastSeen:"") + "</td></tr>";
		
		infoHtml += "<tr><td class='desc'>IMO No.:</td><td class='data'>";
		if (vessel.imo) { infoHtml +=  vessel.imo;}
		infoHtml +=  "&nbsp;</td>";
		
		infoHtml += "<td class='desc'>Type:</td><td class='data'>";
		if (vessel.type) {infoHtml += vessel.type; }
		infoHtml += "</td>";
		
		infoHtml += "<td class='desc' width='7%'>"
		if (status == "MOORED")
		{
			infoHtml += (vessel.port && vessel.port != "null"?"Port:":"")+"</td><td width='12%' class='data'>";
			infoHtml += (vessel.port && vessel.port != "null"?vessel.port:"")
		}
		else if (status == "UNKNOWN") 	
		{
			infoHtml += (vessel.datasource && vessel.datasource != "null" ?"Datasource:":"") + "</td><td width='12%' class='data'>";
			infoHtml += (vessel.datasource && vessel.datasource != "null"?vessel.datasource:"");
		}
		else 
		{
			infoHtml += (vessel.destination && vessel.destination != "null"?"Destination:":"") + "</td><td width='12%' class='data'>";
			infoHtml += (vessel.destination && vessel.destination != "null"?vessel.destination:"");  
		}
		infoHtml += "&nbsp;</td>";
		
		if (vessel.datasource != "ExactEarth"){
			infoHtml += "<td class='desc'>Lat:</td><td class='data'>";
			if (vessel.lat && vessel.lat != "null")
			{
				infoHtml += formatLat(vessel.lat)
			}
//			else if (vessel.lastlat && vessel.lastlat != "null")
//			{
//				infoHtml += formatLat(vessel.lastlat);
//			}
			infoHtml += "</td></tr>";
		}
		else
		{
			infoHtml += "<td class='desc'></td><td class='data'></td></tr>";
		}
	
		infoHtml += "<tr><td class='desc'>Callsign:</td><td class='data'>"
		if (vessel.call && vessel.call != "null") {infoHtml += vessel.call;}
		infoHtml += "&nbsp;</td>";
		
		infoHtml += "<td class='desc'>L x W:</td><td class='data'>";
		if (vessel.length && vessel.length != "null") { infoHtml +=  vessel.length + " m x ";}
		if (vessel.width && vessel.width) { infoHtml +=  vessel.width + " m";}
		infoHtml+= "&nbsp;</td>";
		
		infoHtml += "<td class='desc'>";
		if (status == "MOORED")
		{ 
			infoHtml += (vessel.berth && vessel.berth != "null"?"Berth":"") + "</td><td class='data'>"  + (vessel.berth && vessel.berth != "null"?vessel.berth:"");
		}
		else if (status == "ANCHORAGE")	
		{
			infoHtml += (vessel.anchorage && vessel.anchorage != "null"?"Anchorage:":"") + "</td><td class='data'> " + (vessel.anchorage && vessel.anchorage != "null"?vessel.anchorage:"");
		} 
		else if (status == "UNKNOWN") 	
		{
			infoHtml += (vessel.destination && vessel.destination != "null"?"Destination:":"") + "</td><td width='12%' class='data'>";
			infoHtml += (vessel.destination && vessel.destination != "null"?vessel.destination:"");  
		}
		else 
		{ 
			infoHtml += (vessel.speed && vessel.speed != "null"?"Speed:</td><td class='data'>":"</td><td class='data'>") + (vessel.speed && vessel.speed != "null"?vessel.speed + " kn":"") ;
		}
		infoHtml += "</td>";
		
		if (vessel.datasource != "ExactEarth")
		{
			infoHtml += "<td class='desc'>Lon:</td><td class='data'>";
			if (vessel.lon && vessel.lon != "null")
			{
				infoHtml += formatLon(vessel.lon);
			}
//			else if (vessel.lastlon && vessel.lastlon != "null")
//			{
//				infoHtml += formatLon(vessel.lastlon);
//			}
			infoHtml += "</td></tr>";
		}
		else
		{
			infoHtml += "<td class='desc'></td><td class='data'></td></tr>";
		}
		
		infoHtml += "<tr><td class='desc'>MMSI:</td><td class='data'>"+ vessel.mmsi+ "</td>";
		
		infoHtml += "<td class='desc'>" + (vessel.draught && vessel.draught != "null"?"Draught:":"") + "</td><td class='data'>";
		if (vessel.draught) { infoHtml += (vessel.draught && vessel.draught != "null"?vessel.draught+ " m":"") ;}
		infoHtml +=   "&nbsp;</td>";
		
		infoHtml += "<td class='desc'>"
		
		if(status == "MOORED")
		{
			infoHtml += (vessel.time_moored && vessel.time_moored != "null"?"Moored:": "") + "</td><td class='data'>" + (vessel.time_moored && vessel.time_moored != "null"? vessel.time_moored : "");
		}
		else if (status == "ANCHORAGE")    
		{
			infoHtml += (vessel.time_anchored && vessel.time_anchored != "null"?"Anchored:":"") + "</td><td class='data'>" + (vessel.time_anchored && vessel.time_anchored != "null"?vessel.time_anchored:"");
		}  
		else
		{
			infoHtml += (vessel.course && vessel.course != "null"?"Course: </td><td class='data'>":"</td><td class='data'>") + (vessel.course && vessel.course != "null"?vessel.course + "°":"");
		}
		infoHtml += "</td><td class='desc'>";
		if (vessel.eta){ infoHtml += "ETA: ";}
		infoHtml += "</td><td class='data'>";
		if (vessel.eta){	infoHtml += vessel.eta;}
		return infoHtml += "</td></table></div>";
	}

	this.showPortInfo = function(port) 
	{
		var portUrl = "http://" + window.location.host + "/"+ g_language+"/Port/"+port.portName+ "/Dashboard.html";
		var photoTag;
		if (port.pic)
		{
			photoTag = '<img  border="0" src="http://images.vesseltracker.com/images/vessels/thumbnails/' + port.portName+'-'+port.pic+'.jpg"/>';
		}
		else
		{
			photoTag = '<img  border="1" height="70px" src="http://images.vesseltracker.com/images/no-picture-available_HIRES.gif"/>';
		}
		var infoHtml = "<table class='customerInfo' border='0' cellspacing='0' width='100%' height='100%' cellpadding='3'><tr>";
		
		infoHtml += "<td class='data' width='10%' rowspan='4'><a href="+portUrl+" target='_blank'>"+photoTag+"</a></td>";
		infoHtml += "<td class='data' width='10%'><b>Port of:</b></td><td class='data' width='10%'><a href='"+portUrl+"' target='_blank'><b>"+ port.portName + "</b></a></td>";
		infoHtml += "<td class='data' width= '10%'></td><td class='data' width='70%' colspan='3'>"; 
		if (port.lastUpdate)
		{
			infoHtml += "<b>Time of last Update:  <font color=";
			infoHtml += (port.inTime?"'green'":"'red'")+">"+port.lastUpdate +"</font></b></td></tr>";
		}
		else
		{
			infoHtml += "</td></tr>";
		}	
		infoHtml += "<tr><td class='data'>Country:</td><td class='data'>"
			if (port.flagid) {infoHtml +="<img src='http://images.vesseltracker.com/images/flags/"+ port.flagid + ".png'/>";}
		if (port.nationality) {infoHtml += "&nbsp;&nbsp;&nbsp;" + port.nationality}
		infoHtml+= "</td>";
		infoHtml += "<td class='data' width='10%' valign='center' rowspan='3'>";
		infoHtml += "<a href='http://" + window.location.host + "/"+ g_language+"/Port/"+port.portName+ "/Incoming.html' target='_blank'>Approaching Vessels("+port.approachingVesselsCount+")</a>";
		infoHtml +="</td>";

		infoHtml += "<td class='data' width='10%' valign='center' rowspan='3'>";
		infoHtml += "<a href='http://" + window.location.host + "/"+ g_language+"/Port/"+port.portName+ "/Expected.html' target='_blank'>Expected Vessels("+port.expectedVesselsCount+")</a>";
		infoHtml +="</td>";
		
		infoHtml += "<td class='data' width='10%' valign='center' rowspan='3'>";
		infoHtml += "<a href='http://" + window.location.host + "/"+ g_language+"/Port/"+port.portName+ "/Moored.html' target='_blank'>Moored Vessels ("+port.mooredVesselsCount+")</a>";
		infoHtml +="</td>";

		infoHtml += "<td class='data' width='10%' valign='center' rowspan='3'>";
		infoHtml += "<a href='http://" + window.location.host + "/"+ g_language+"/Port/"+port.portName+ "/Left.html' target='_blank'>Sailed Vessels ("+port.leftVesselsCount+")</a>";
		infoHtml +="</td></tr>";
		
		infoHtml += "<tr><td class='data'>LOCODE:</td><td class='data'>";
		if (port.loCode) { infoHtml += port.loCode} 
		infoHtml +=  "</td></tr>";

		infoHtml += "<tr><td class='data'>Local Time:</td><td class='data'>";
		if (port.localTime)
		{
			var date= new Date();
			date.setTime(port.localTime);
			var hour = date.getUTCHours();
			var min= date.getUTCMinutes();
			var second = date.getUTCSeconds();
			infoHtml += addDigi(hour) + ":" + addDigi(min) +":" +addDigi(second);
		}
		infoHtml += "</td></tr>";

		infoHtml += "</table></div>";
		$("#"+divname_infobox).html(infoHtml);
	}
	
	this.showDialogInfo = function(vessel) 
	{
		var vtUrl = "";
		if (vessel.imo)
		{
			vtUrl = "http://" + window.location.host + "/"+ g_language+"/Ships/"+me.encodeShipnameForUrl(vessel.shipName)+"-" + vessel.imo + ".html";
		}
		else
		{
			vtUrl = "http://" + window.location.host + "/" + g_language+"/Ships/"+me.encodeShipnameForUrl(vessel.shipName)+"-I" + vessel.shipId + ".html";
		}
		var photoTag;
		if (vessel.pic)
		{
			photoTag = '<img  border="0" src="http://images.vesseltracker.com/images/vessels/thumbnails/' + vessel.pic +'.jpg"/>';
		}
		else
		{
			photoTag = '<img  border="1" height="70px" src="http://images.vesseltracker.com/images/no-picture-available_HIRES.gif"/>';
		}
		var iconURL="http://images.vesseltracker.com/images/googlemaps/icon" + vessel.icon + ".png"
		
		var dialogHtml = "<div class='dialogInfo'><table border='0' cellspacing='0' height='95' cellpadding='3'>";
		dialogHtml+="<tr>";
		dialogHtml+="<td >";
		dialogHtml+="<a href='javascript:";
		if (g_vessels[0]["_"+vessel.shipId] == undefined && $.inArray(vessel.shipId, g_openDialog_shipIds)< 0)
		{
			dialogHtml += "sendAjaxRequest(\"position\","+ vessel.shipId+");"+varname+".displayLoadGif(\"block\");'>";
		}
		else
		{
			dialogHtml += varname+".opener("+vessel.shipId+",true);"+varname+".zoomTo(12)'>";
		}
		var status = (vessel.datasource?vessel.datasource:(vessel.status?vessel.status:"UNKNOWN"));
		dialogHtml+= "center View</a>";
		dialogHtml +="</td>"
		dialogHtml +="<td class='showHideTrack' ><a href='javascript:showHideTracking("+ vessel.shipId+")'>"
		dialogHtml +=(g_mytracks[vessel.shipId]==undefined?"show":"hide")+" track</a>";
		dialogHtml +="</td><td><div class='measureDist' onclick='javascript:"+varname+".toggleMeasure("+vessel.shipId+", "+vessel.lon +","+vessel.lat+")'>Distance Meter</div>";
		dialogHtml += '</td>';
		dialogHtml += '</tr>';
		
		
		
		
		dialogHtml += '<tr><td rowspan="3"><a href='+vtUrl+' target="_blank">'+ photoTag +'</a></td>';
		dialogHtml +="<td style='text-align:center'valign='middle' id='statusIcon_"+vessel.shipId+"'><img src="+iconURL+"></img></td>";
		dialogHtml +="<td><div class='measureOutput'><div id='output_KM_"+vessel.shipId+"'></div><div id ='output_NMI_"+vessel.shipId+"'></div></div></td></tr>";
		dialogHtml +="<tr><td>DataSource: </td><td>"+status+"</td></tr><tr><td>Last seen:&nbsp;</td><td>"+vessel.lastSeen+"</td></tr>";
		if (vessel.imo)
		{
			dialogHtml+="<tr><td>Imo: </td><td colspan='2'>"+vessel.imo+"</td></tr>";
		}
		if(vessel.call)
		{
			dialogHtml+="<tr><td>Callsign: </td><td  colspan='2'>"+vessel.call+"</td></tr>";
		}
		dialogHtml += "<tr><td>L x W x Draft:</td><td colspan='2'>";
		dialogHtml +=  (vessel.length == undefined)?" ": vessel.length;
		dialogHtml +=" m x "+ (vessel.width == undefined?" ": vessel.width);
		dialogHtml +=" m x "+ (vessel.draught == undefined?"  ": vessel.draught);
		dialogHtml+= " m&nbsp;</td></tr>";
		if (vessel.type)
		{
			dialogHtml += "<tr><td>Type:</td><td colspan='2'>" + vessel.type +"</td></tr>";
		}
		if (vessel.port)
		{
			dialogHtml += "<tr><td>Port:</td><td colspan='2'>"+ vessel.port+"</td></tr>";
		}
		if (vessel.berth)
		{
			dialogHtml += "<tr><td>Berth:</td><td colspan='2'>"+ vessel.berth+"</td></tr>";
		}
		if (vessel.lastPort)
		{
			dialogHtml += "<tr><td>Last Known Port:</td><td colspan='2'>"+ vessel.lastPort+"</td></tr>";
		}
		if (vessel.speed)
		{
			dialogHtml += "<tr><td>Speed:</td><td colspan='2'>"+ vessel.speed+" kn</td></tr>";
		}
		if (vessel.destination)
		{
			dialogHtml += "<tr><td>Destination:</td><td colspan='2'>" +vessel.destination +"</td></tr>";
		}
		if (vessel.eta)
		{
			dialogHtml += "<tr><td>ETA:</td><td colspan='2'>" +vessel.eta+"</td></tr>";
		}
		
		dialogHtml += "</table></div>";
		
		return dialogHtml;
	}
	
	
	this.showGroupInfo =function (shipId) 
	{
		if(g_vessels[0]["_"+shipId] == undefined)
		{
			groupInfoHtml ="<a href='javascript:sendAjaxRequest(\"myVessels\","+shipId+", $(\"#groupSelection_"+shipId+"\").children(\"option:selected\").val());"+varname+".displayLoadGif(\"block\");'>add to Group:</a>";
			groupInfoHtml += createGroupSelection(shipId);
		}
		else
		{
			groupInfoHtml ="<a href='javascript:sendAjaxRequest(\"myVessels\","+shipId+");"+varname+".displayLoadGif(\"block\");;'>remove from MyVessels-Group<a>";
		}
		if($("#ship_"+shipId +".groupInfo").length == 0)
		{
			groupInfoHtml ='<div class="groupInfo">'+ groupInfoHtml + '</div>';
		}
		return groupInfoHtml;
	}
	
	function getControlByName(c_name) 
	{
		if (c_name == "KeyboardDefaults")			return new OpenLayers.Control.KeyboardDefaults();
		//if (c_name == "MouseDefaults")				return new OpenLayers.Control.MouseDefaults(); deprecated =>Navigation
		if (c_name == "Navigation")					return new OpenLayers.Control.Navigation({ zoomWheelEnabled: false });
		if (c_name == "NavigationPlusMouseWheel")	return new OpenLayers.Control.Navigation();
		if (c_name == "LayerSwitcher")				return new OpenLayers.Control.LayerSwitcher();
		if (c_name == "ZoomBar")					return new OpenLayers.Control.PanZoomBar({zoomWorldIcon:false, panIcons:false});
		if (c_name == "PanZoomBar")					return new OpenLayers.Control.PanZoomBar();
		if (c_name == "ZoomPanel")					return new OpenLayers.Control.ZoomPanel({ trigger: function() {alert('help')}});
		
		if (c_name == "MousePosition")				return new OpenLayers.Control.MousePosition({
			   formatOutput: function(lonLat) {
			       
			       var lon = Math.round(lonLat.lon *100000) / 100000;
			       var lat = Math.round(lonLat.lat *100000) / 100000;
			       
			       var markup = "<span text-align='right'>" +formatLat(lonLat.lat, false);
			       markup += "&nbsp;&nbsp;" + formatLon(lonLat.lon, false) +  "<br>" + lat + "&nbsp;&nbsp;" + lon +"&nbsp;</span>";
			       return markup
			   }
			});

		if (c_name == "ScaleLine")					return new OpenLayers.Control.ScaleLine();
		if (c_name == "Attribution")				return new OpenLayers.Control.Attribution();
		if (c_name == "DragFeatureToIconLayer")		return new OpenLayers.Control.DragFeature(iconLayer);
	    if (c_name =="Multitouch") {
	    	if (OpenLayers.Control.MultitouchNavigation) {
	    		return new OpenLayers.Control.MultitouchNavigation();
	    	}
		}		
	}
	
	 
	this.encodeShipname = function(name,uppercase)
	 {
		 if (name)
		 {
			 var rets = (uppercase?name.toUpperCase():name.toLowerCase());
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
		 		if(i>0) retb += (uppercase?"&nbsp;":" ");
		 		retb += sp[i].charAt(0).toUpperCase() + sp[i].substr(1);
		 	}
		 	return retb;
		 }
		 else return "";
	 }
	// short names of Ship owners the should not be rendered MixedCase
	var ABBREVS = new Array(
	 "MV.","CMA CGM","CMA-CGM","CMACGM","MOL","TK","UBC",
	 "MSC","APL","RMS","CSCL","MV","M/V","M.V.","BCL","RT",
	 "NYK","N.Y.K.","ECL","MF","YM","DT","WS","OOCL",
	 "BRO","MT","M/T","LS","EMS","STX","AB","BBC","BNS","BMS",
	 "HC","CSAV","COSCO","CEC","MS","JRS","IVS","COS",
	 "MT","OPDR","CCNI","UAL","HMS","HS","WMS","VOC","SKS",
	 "II", "III", "IV", "VI", "VII"
	 ); // roemische zahlen
	
	this.getBaseLayer = function()
	{
		return map.baseLayer;
	}
	
	this.toggleDetailsPopup = function (event, list)
	{
		var	detailsDiv = $("#detailsPopup");
		if (list != undefined)
		{
			if (detailsDiv[0]== undefined)
			{
				detailsDiv = $("<div id='detailsPopup'></div>");
				detailsDiv.dialog(
				{
    				autoOpen: false,
    				title: null,
    		        modal:false,
    		        resizable:false,
    		        position: {
    		        	my: "left ",
    		        	at: "right",
    		        	of: event
    		        	}
    				}).bind('dialogclose', function(event, ui) {
    				$(this).dialog('destroy').remove();
    				});
			}
			var detailsArray= list.split(',');
			var detailsString ="";
			for (i in detailsArray)
			{
				detailsString += detailsArray[i] +"<br/>"
			}
			detailsDiv.html(detailsString);
			detailsDiv.dialog("open");
		}
		else if(event.type == "click")
		{
			keepDialogOpen = true;
		}
		else if(event.type == "blur")
		{
			detailsDiv.dialog("close");
			keepDialogOpen = false;
		}
		else if (event.type == "mouseout" && !keepDialogOpen)
		{
			detailsDiv.dialog("close");
		}
	}
	
	//Funktion, die untersucht, ob Array a  ein Objekt obj enthält
	function contains(a, obj) 
	{
		var i = a.length;
		while (i--) 
		{
		    if (a[i].lon == obj.lon && a[i].lat == obj.lat) 
		    {
		    	return true;
			}
		}
		return false;
	}

	function addDigi(curr_min){
		curr_min = curr_min + "";
	    if (curr_min.length == 1)
	    {
	    	curr_min = "0" + curr_min;
		}
	    return curr_min;
	}

	function intersect(a, b) {
		if (a == undefined || b == undefined) return true;
		  return (a.left <= b.right &&
		          b.left <= a.right &&
		          a.top >= b.bottom &&
		          b.top >= a.bottom)
		}
	
	function createRectangle(pixel, x, y, xoffset, yoffset) {
		var rect = new Object();
		rect.left   = pixel.x +xoffset;
		rect.right  = pixel.x +xoffset +x;
		rect.bottom = pixel.y +yoffset;
		rect.top = pixel.y +yoffset +y;
		
		return rect;
		}
	
	function drawRectangle( rect, x, y )
	{
	    var parent= document.getElementById( "myMap" );
	    var rectDiv = document.createElement( "div" );
	    var mystyle = "position:absolute; top:" + rect.top + "; left:" + rect.left + ";width:" + x +"; height:" + y +";border-color: rgb(0,"+(borderColor)+",255);";
	    rectDiv.setAttribute( "class", "rectClass");
	    rectDiv.setAttribute( "style", mystyle );
	    parent.appendChild( rectDiv );
	    borderColor+=3;
	}
	
	function createDrawFeatureControl()
	{
		var sketchSymbolizers = {
				"Point" : {
					pointRadius : 4,
					graphicName : "circle",
					fillColor : "red",
					fillOpacity : 1,
					strokeWidth : 1,
					strokeOpacity : 1,
					strokeColor : "#333333"
				},
				"Line" : {
					strokeWidth : 2,
					strokeOpacity : 1,
					strokeColor : "#FF0000",
					strokeDashstyle : "dashed"
				}
			};
			var style = new OpenLayers.Style();
			style.addRules([ new OpenLayers.Rule({
					symbolizer : sketchSymbolizers
					}) 
				]);
			var styleMap = new OpenLayers.StyleMap({
				"default" : style
				});
             drawFeatureControl =  new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
             	persist : true,
             	geodesic: true, 
             	immediate:true,
             	displaySystem: 'metric',
             	handlerOptions : {layerOptions : {styleMap : styleMap} }
//             	measureComplete: function(event){
//             		this.deactivate();
//             	}
             	
             });
            
			drawFeatureControl.events.on({
					"measure" : handleMeasurements,
					"measurepartial" : handleMeasurements
			});
	return drawFeatureControl;
	}

		
	function handleMeasurements(event) {
		var measure = event.measure;
		var out= (measure).toFixed(2);
		$('#output_KM_'+currentMeasureShipId).html("<span>"+out+"</span><span class='measureUnit'>KM</span>");
		out = (measure * 0.540).toFixed(2);
		$('#output_NMI_'+currentMeasureShipId).html("<span>"+out+"</span><span class='measureUnit'>NMI</span>");
	}	
}