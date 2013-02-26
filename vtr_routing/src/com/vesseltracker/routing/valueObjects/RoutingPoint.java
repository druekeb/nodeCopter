package com.vesseltracker.routing.valueObjects;

public class RoutingPoint {
	
	private double lon;
	private double lat;
	private String name;
	private boolean isSecondaryNode;
	
	
	public RoutingPoint() {
		
	}
	
	
	public RoutingPoint(double lon , double lat , boolean isSecondaryNode) {
		
		this.lon  = lon;
		this.lat  = lat;
		this.isSecondaryNode = isSecondaryNode;
		
	}
	
	
	public void setLon(double lon) {
		this.lon = lon;
	}
	
	public void setLat(double lat) {
		this.lat = lat;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public void setIsSecondaryNode(boolean b) {
		this.isSecondaryNode = b;
	}
	
	public double getLon() {
		return lon;		
	}
	
	public double getLat() {
		return lat;
	}
	
	public boolean getIsSecondaryNode() {
		return isSecondaryNode;
	}
	
	public String getName() {
		return name;
	}
	
}
