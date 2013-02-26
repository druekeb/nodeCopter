//**************************
//***    Application     ***
//**************************
App = Em.Application.create({
	language:null,
	projwgs84 : new OpenLayers.Projection("EPSG:4326"),
	projmerc : new OpenLayers.Projection("EPSG:900913"),
	ready : function() {
		this.language = $('body').attr('language');
		$("#map_cockpit").height($(window).height()-80);
		App.mapsController.initMap("map_cockpit");
		App.positionsController.startTimer();
	}
});


//**************************
//*** Controllers ****
//**************************

App.positionsController = Em.Object.create({
	timerId : null,
	startTimer: function(){
		App.positionsController.askNewPositions();
	},
	
	askNewPositions : function(){
		var me = this;
		var url = "/app?service=baseService&type=liveVesselPosition&language="+App.language;
		
		$.getJSON(url,function(data){
			App.mapsController.clearMarkers();
		    $(data.data).each(function(index,value){
		    	var t = App.Position.create({
		            lon: value.lon,
		            lat: value.lat,
		            ts:value.timestamp,
		            timeStr: value.timeStr,
		            icon:"http://images.vesseltracker.com/images/googlemaps/icon"+ value.icon+".png",
		            shipId:value.shipId,
		            source:value.source,
		            status:value.status,
		            name:value.name
		        });
		    	
		    	App.mapsController.updatePositionOnMap(t);
		    });
		    $('.namePopup').parents().css("background-color","transparent");
			$('.namePopup').parents('.olPopup').css("pointer-events","none");
		});
		
		window.clearTimeout(this.timerId);
		this.set("timerId", setTimeout("App.positionsController.askNewPositions()", 1000*30));
	}
	
});


App.mapsController = Em.ArrayController.create({
	map:null,
	handleClick:function (event){
		App.positionsController.askNewPositions();
	},
	initMap : function(map_id){
		var me = this;
		map = new OpenLayers.Map({
	        div: map_id,
	        theme: null,
	        maxExtent : new OpenLayers.Bounds(-20037508.34, -20037508.34,20037508.34, 20037508.34),
			numZoomLevels : 18,
	        controls: [
	            new OpenLayers.Control.Attribution(),
	            new OpenLayers.Control.TouchNavigation({
	                dragPanOptions: {
	                    enableKinetic: true
	                }
	            }),
	            new OpenLayers.Control.Zoom()
	        ],
	        layers: [
	            new OpenLayers.Layer.OSM("OpenStreetMap"),
	            new OpenLayers.Layer.Markers("MarkerLayer")
	        ],
	        center: new OpenLayers.LonLat(742000, 5861000),
	        zoom: 1
	    });
	},
	updatePositionOnMap : function(p){
		var shipIcon = new OpenLayers.Icon(p.icon, new OpenLayers.Size(22, 22));
		var shipMarker = new OpenLayers.Marker((new OpenLayers.LonLat(p.lon,p.lat)).transform(App.projwgs84,App.projmerc),shipIcon);
		var markerLayer = map.getLayersByName('MarkerLayer')[0];
		markerLayer.addMarker(shipMarker);
		var namePopup = new OpenLayers.Popup("popup_"+ p.shipId, (new OpenLayers.LonLat(p.lon,p.lat)).transform(App.projwgs84,App.projmerc),
		new OpenLayers.Size(100, 30), "<div class='namePopup' ><span style='font-size:10px; position:absolute;' class='shipname_black'>"+p.name+"</span></div>");
		map.addPopup(namePopup, false);
	},
	
	zoomToExtend : function(){
		var markerLayer = map.getLayersByName('MarkerLayer')[0];
		map.zoomToExtent(markerLayer.getDataExtent());
	},
	
	clearMarkers : function(){
		var markerLayer = map.getLayersByName('MarkerLayer')[0];
		markerLayer.clearMarkers();
		
		while (map.popups.length > 0) {
			map.popups[0].destroy();
		}
	}
});




// **************************
// *** Models ***
// **************************
App.Position = Ember.Object.extend({
    lon: null,
    lat: null,
    ts: null,
    timeStr:null,
    icon:null,
    shipId:null,
    source:null,
    status:null,
    name:null
});


// **************************
// *** Views ***
// **************************



