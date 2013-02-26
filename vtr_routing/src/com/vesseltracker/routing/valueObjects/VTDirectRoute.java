package com.vesseltracker.routing.valueObjects;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.TimeZone;


public class VTDirectRoute
{
	private Double distance;
	private Double allowedSpeed;
	private Double shipSpeed;
	private	String etaTime;
	private	long etaUnixTime;
	private List<RoutingPoint> points;
	private Long etaStartTime;
	private Long journeyTime;
	private int routeId;
	
	
	public VTDirectRoute()
	{	
	}
	
	public VTDirectRoute( double distance , double allowedSpeed , double shipSpeed , List<RoutingPoint> points , long etaStartTime)
	{
		this.distance = distance / 1852.0;
		this.allowedSpeed = allowedSpeed;
		this.shipSpeed = (double)shipSpeed;
		this.points = points;
		this.etaStartTime = etaStartTime;
		this.setEtaTime();
	}
	
	public void setEtaTime()
	{
		Double speed = null;
		
		if(shipSpeed <= allowedSpeed)
		{
			speed = shipSpeed;
		}
		else
		{
			speed = allowedSpeed;
		}
		
		SimpleDateFormat sdf = new SimpleDateFormat("dd.MM.yyyy HH:mm"); // ETA-Format "DD.MM.JJJJ hh:mm" (UTC)
		sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
		this.journeyTime = ((long) ((distance / speed) * 3600.0 * 1000.0));
		this.etaTime = sdf.format(getEtaStartTime() + journeyTime);
		this.etaUnixTime = getEtaStartTime() + journeyTime;
	}

	public void setRouteId (int routeId)
	{
		this.routeId = routeId;
	}
	
	public int getRouteId()
	{
		return routeId;
	}
	
	
	public String getEtaTime()
	{
		return etaTime;
	}
	
	public long getEtaUnixTime()
	{
		return etaUnixTime;
	}
	
	public Long getEtaStartTime()
	{
		return etaStartTime;
	}
	
	public void setEtaStartTime(long etaStartTime)
	{
		this.etaStartTime = etaStartTime;
	}
	
	public void setJourneyTime(Long journeyTime)
	{
		this.journeyTime = journeyTime;
	}
	
	public Long getJourneyTime()
	{
		return journeyTime;
	}
	
	public double getAllowedSpeed()
	{
		return allowedSpeed;
	}
	
	public void setAllowedSpeed(Double allowedSpeed)
	{
		this.allowedSpeed = allowedSpeed;
	}
	
	public String getJourneyTimeString()
	{
		String days = String.valueOf((int)Math.floor((journeyTime/3600/1000) / 24));
		String hrs	= String.valueOf((int)Math.floor((journeyTime/3600/1000) % 24));
				
		return days + " days , " + hrs + " hrs";
	}
	
	public double getDistance()
	{
		return distance;
	}
	
	public int getRoundedDistance()
	{
		return (int)Math.round(distance);
	}
	
	public List<RoutingPoint> getPoints()
	{
		return points;
	}

	public void setDistance(double distance)
	{
		this.distance = distance;
	}

	public void setPoints(List<RoutingPoint> points)
	{
		this.points = points;
	}
	
	
	public String getRouteJson()
	{
		StringBuffer json = new StringBuffer();
		
			json.append("{\"distance\":" + getDistance() + ",");
			json.append("\"journeytime\":" + getJourneyTime() + ",");
			json.append("\"eta\":" + getEtaUnixTime() + ",");
			json.append("\"via\":[],");			
			json.append("\"routepoints\":[");
			if(getPoints().size() > 0)
			{
				json.append("{\"lon\":" + getPoints().get(0).getLon() + ",\"lat\":" + getPoints().get(0).getLat() + "}");
				
				for(int i=1; i<getPoints().size(); i++)
				{
					json.append(",{\"lon\":" + getPoints().get(i).getLon() + ",\"lat\":" + getPoints().get(i).getLat() + "}");
				}
			}
			
			json.append("]");
		json.append("}");
		
		return json.toString();
	}	
	
	
	
	public String getRouteXml()
	{
		StringBuffer xml = new StringBuffer();
		
		xml.append("<route>");
		xml.append("<distance>");
		xml.append(getDistance());
		xml.append("</distance>");
		xml.append("<journeytime>");
		xml.append(getJourneyTime());
		xml.append("</journeytime>");
		xml.append("<eta>");
		xml.append(getEtaTime());
		xml.append("</eta>");
		xml.append("<via>");
		xml.append("</via>");
		xml.append("<routepoints>");
		for(int i=0; i<this.getPoints().size(); i++)
		{
			xml.append("<point lon='" + getPoints().get(i).getLon() + "' lat='" + getPoints().get(i).getLat() + "' />");
		}
		xml.append("</routepoints>");
		xml.append("</route>");

		return xml.toString();
	}	
	

}
