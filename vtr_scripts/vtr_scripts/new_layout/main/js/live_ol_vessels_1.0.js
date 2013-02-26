//**************************
//***    Application     ***
//**************************
App = Em.Application.create({
	language:null,
	projwgs84 : new OpenLayers.Projection("EPSG:4326"),
	projmerc : new OpenLayers.Projection("EPSG:900913"),
	ready : function() {
		this.language = $('body').attr('language');
		
		$("[id^=map_]").each(function(e){
			App.mapsController.initMap($(this).attr('id'));
		});
		
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
		    $(data.data).each(function(index,value){
		    	var t = App.Position.create({
		            lon: value.lon,
		            lat: value.lat,
		            ts:value.timestamp,
		            timeStr: value.timeStr,
		            icon:"http://images.vesseltracker.com/images/googlemaps/icon"+ value.icon+".png",
		            shipId:value.shipId,
		            source:value.source,
		            status:value.status
		        });
		    	
		    	App.mapsController.updatePositionOnMap(t);
		    })
		});
		
		window.clearTimeout(this.timerId);
		this.set("timerId", setTimeout("App.positionsController.askNewPositions()", 1000*30));
	}
	
});


App.mapsController = Em.ArrayController.create({
	content: [],
	handleClick:function (event){
		App.positionsController.askNewPositions();
	},
	initMap : function(map_id){
		var me = this;
		var m = new OpenLayers.Map({
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
	        zoom: 3
	    });
		
		var t = App.Map.create({
			map:m,
			mapId:map_id,
			shipId:parseInt(map_id.substr(4))
		});
		this.pushObject(t);
		
	},
	updatePositionOnMap : function(p){
		var m = this.get('content').findProperty('shipId', p.shipId);

		$('#status_icon_'+p.shipId).attr("src", p.icon);
		$('#status_'+p.shipId).text(p.status);
		$('#lastseen_'+p.shipId).text(p.timeStr);
		$('#lastseen_source_'+p.shipId).text(p.source);
		
		var shipIcon = new OpenLayers.Icon(p.icon, new OpenLayers.Size(22, 22));
		m.shipMarker = new OpenLayers.Marker((new OpenLayers.LonLat(p.lon,p.lat)).transform(App.projwgs84,App.projmerc),shipIcon);
		var markerLayer = m.map.getLayersByName('MarkerLayer')[0];
		markerLayer.clearMarkers();
		markerLayer.addMarker(m.shipMarker);
		m.map.panTo((new OpenLayers.LonLat(p.lon,p.lat)).transform(App.projwgs84,App.projmerc));
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
    status:null
});

App.Map = Ember.Object.extend({
    map:null,
    mapId:null,
    shipId:null,
    shipMarker:null
});

// **************************
// *** Views ***
// **************************



