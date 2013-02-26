//**************************
//***    Application     ***
//**************************
App = Em.Application.create({
	language:null,
	projwgs84 : new OpenLayers.Projection("EPSG:4326"),
	projmerc : new OpenLayers.Projection("EPSG:900913"),
	ready : function() {
		this.language = $('body').attr('language');
		
		App.mapController.initMap();
		App.positionsController.findShip();
		App.positionsController.startTimer();
	}
});


//**************************
//*** Controllers ****
//**************************

App.positionsController = Em.Object.create({
	timerId : null,
	ship : null,
	lastPosition: null,
	startTimer: function(){
		App.positionsController.askNewPositions(true);
	},
	
	findShip: function(){
		this.ship = App.Ship.create({
			shipId:$('#map').attr("value")
		});
	},
	
	askNewPositions : function(withTrack){
		var me = this;
		
		var url = null;
		if(withTrack != undefined){
			url="/app?service=baseService&type=vesselPosition&language="+App.language+"&shipId="+this.ship.shipId +"&withTrack=true";
		}else{
			if (this.lastPosition != undefined){
				url="/app?service=baseService&type=vesselPosition&language="+App.language+"&shipId="+this.ship.shipId + "&from="+this.lastPosition.ts;
			}else{
				url="/app?service=baseService&type=vesselPosition&language="+App.language+"&shipId="+this.ship.shipId;
			}
		}
		
		$.getJSON(url,function(data){
		    $(data.data).each(function(index,value){
		    	var t = App.Position.create({
		            lon: value.lon,
		            lat: value.lat,
		            ts:value.timestamp,
		            timeStr: value.timeStr,
		            icon:"http://images.vesseltracker.com/images/googlemaps/icon"+ value.icon+".png"
		        });
		    	
		    	if(me.lastPosition == undefined || me.lastPosition.ts < t.ts){
		    		me.lastPosition = t;
		    	}
		    	
		    	App.mapController.addTrackingPoint(t);
		    });
		    
		    if ( $(data.data).length > 0){
		    	App.mapController.drawTracking();
		    	App.mapController.drawShipMarker(me.lastPosition);
		    }
		});
		
		window.clearTimeout(this.timerId);
		this.set("timerId", setTimeout("App.positionsController.askNewPositions()", 1000*30));
	}
	
});


App.mapController = Em.Object.create({
	map : null,
	shipTrack:[],
	lastTrackPoint:null,
	handleClick:function (event){
		App.positionsController.askNewPositions();
	},
	initMap : function(){
		var me = this;
		map = new OpenLayers.Map({
	        div: 'map',
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
	            new OpenLayers.Layer.Markers("ShipIconLayer"),
	            new OpenLayers.Layer.Vector("TrackLineLayer"),
	            new OpenLayers.Layer.Markers("TrackPointsLayer")
	        ],
	        center: new OpenLayers.LonLat(742000, 5861000),
	        zoom: 3
	    });
	},
	
	drawShipMarker : function(p){
		var shipIcon = new OpenLayers.Icon(p.icon, new OpenLayers.Size(22, 22));
		var shipMarker = new OpenLayers.Marker((new OpenLayers.LonLat(p.lon,p.lat)).transform(App.projwgs84,App.projmerc),shipIcon);
		var markerLayer = map.getLayersByName('ShipIconLayer')[0];
		markerLayer.clearMarkers();
		markerLayer.addMarker(shipMarker);
		map.panTo((new OpenLayers.LonLat(p.lon,p.lat)).transform(App.projwgs84,App.projmerc));
	},
	
	addTrackingPoint : function(m){
		this.shipTrack.push(m);
	},
	
	drawTracking : function(){
		var trackingPoints = [];
		var length = this.shipTrack.length;
		
		var trackPointLayer = map.getLayersByName('TrackPointsLayer')[0];
		trackPointLayer.clearMarkers();
		
		for (var i = 0; i < length; i++) {
		  	var trackPoint = new OpenLayers.Geometry.Point(this.shipTrack[i].lon,this.shipTrack[i].lat);
		  	trackingPoints.push(trackPoint.transform(App.projwgs84,App.projmerc));
			
		  	if(i !== (length-1)){
		  		var ll = new OpenLayers.LonLat(this.shipTrack[i].lon,this.shipTrack[i].lat).transform(App.projwgs84,App.projmerc);
				var trackPointIcon = new OpenLayers.Icon("http://images.vesseltracker.com/images/new_layout/main/img/timedot.png", new OpenLayers.Size(5, 5));
				var trackPointFeature = new OpenLayers.Feature(trackPointLayer, ll,{icon:trackPointIcon});
		        trackPointFeature.data.popupContentHTML = this.shipTrack[i].timeStr;

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
		
		var trackingAndClusteringLayer = map.getLayersByName('TrackLineLayer')[0];
		trackingAndClusteringLayer.removeAllFeatures();
		var trackingLine = new OpenLayers.Geometry.LineString(trackingPoints);
		var trackingLineFeature = new OpenLayers.Feature.Vector(trackingLine, null, {
										strokeColor : '#FF9933',
										strokeWidth : 2,
										strokeLinecap : 'round'
									});
		trackingAndClusteringLayer.addFeatures([trackingLineFeature]);
		if(trackingPoints.length > 1){
			map.zoomToExtent(trackingAndClusteringLayer.getDataExtent());
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
    icon:null
});

App.Ship = Ember.Object.extend({
    shipId:null,
    lastSeen:null
});


// **************************
// *** Views ***
// **************************



