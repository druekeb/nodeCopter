package com.vesseltracker.routing.valueObjects;

public class DirectNeighbourResult
{
	
	private double distance;
	private double allowedSpeed;

	public DirectNeighbourResult(double distance , Double allowedSpeed)
	{
		this.allowedSpeed = allowedSpeed;
		this.distance = distance;
	}

	public Double getAllowedSpeed()
	{
		return allowedSpeed;
	}

	public void setAllowedSpeed(int speed)
	{
		this.allowedSpeed = allowedSpeed;
	}

	public double getDistance()
	{
		return distance;
	}

	public void setDistance(double distance)
	{
		this.distance = distance;
	}
}
