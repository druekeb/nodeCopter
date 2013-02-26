package com.vesseltracker.routing.valueObjects;

public class NearestNeighbourResult {
	
	private int dijkstraNodeId;
	private double distance;
	
	public NearestNeighbourResult(int dijkstraNodeId , double distance) {
		this.dijkstraNodeId = dijkstraNodeId;
		this.distance = distance;
	}

	public int getDijkstraNodeId() {
		return dijkstraNodeId;
	}

	public void setDijkstraNodeId(int dijkstraNodeId) {
		this.dijkstraNodeId = dijkstraNodeId;
	}

	public double getDistance() {
		return distance;
	}

	public void setDistance(double distance) {
		this.distance = distance;
	}
	
	
	
}
