package com.vesseltracker.routing.valueObjects;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.TimeZone;

//import org.postgis.LineString;
//import org.postgis.MultiLineString;
//import org.postgis.Point;

public class VTRoute implements Comparable {
	
	private Double distance;
	private double etaDistance;
	private	String etaTime;
	private long etaUnixTime;
	private List<RoutingPoint> points;
	private BarrierNodesTreeSet crossedBarrierNodes;
	private List<String> crossedVisitNodes;
	private Long etaStartTime;
	private Long journeyTime;
	private int routeId;
	
	
	public VTRoute() {
		
	}
	
	public VTRoute( double distance , double etaDistance , List<RoutingPoint> points) {
		this.distance = distance;
		this.etaDistance = etaDistance;
		this.points = points;
	}
	
	@Override
	public int compareTo(Object o)
	{
		return Integer.valueOf(distance.compareTo(((VTRoute)o).distance));
	}
	
	public void setEtaTime(double etaDistance , double shipSpeed)
	{
		SimpleDateFormat sdf = new SimpleDateFormat("dd.MM.yyyy HH:mm"); // ETA-Format "DD.MM.JJJJ hh:mm" (UTC)
		sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
		journeyTime = ((long) ((etaDistance / shipSpeed) * 3600.0 * 1000.0));

		this.etaTime     = sdf.format(getEtaStartTime() + journeyTime);
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
	
	
	public String getEtaTime() {
		return etaTime;
	}
	
	public long getEtaUnixTime() {
		return etaUnixTime;
	}
	
	public Long getEtaStartTime() {
		return etaStartTime;
	}
	
	public void setEtaStartTime(long etaStartTime) {
		this.etaStartTime = etaStartTime;
	}
	
	public void setJourneyTime(Long journeyTime) {
		this.journeyTime = journeyTime;
	}
	
	public Long getJourneyTime() {
		return journeyTime;
	}
	
	public String getJourneyTimeString() {
		String days = String.valueOf((int)Math.floor((journeyTime/3600/1000) / 24));
		String hrs	= String.valueOf((int)Math.floor((journeyTime/3600/1000) % 24));
				
		return days + " days , " + hrs + " hrs";
	}
	
	public double getDistance() {
		return distance;
	}
	
	public int getRoundedDistance() {
		return (int)Math.round(distance);
	}
	
	public double getEtaDistance() {
		return etaDistance;
	}
	
	public List<RoutingPoint> getPoints() {
		return points;
	}

	public void setDistance(double distance) {
		this.distance = distance;
	}
	
	public void setEtaDistance(double etaDistance) {
		this.etaDistance = etaDistance;
	}
	
	public void setPoints(List<RoutingPoint> points) {
		this.points = points;
	}
	
	public void setCrossedBarrierNodes(BarrierNodesTreeSet crossedBarrierNodes) {
		this.crossedBarrierNodes = crossedBarrierNodes;
	}
	
	public BarrierNodesTreeSet getCrossedBarrierNodes() {
		return crossedBarrierNodes;
	}
	
	public void setCrossedVisitNodes(List<String> crossedVisitNodes) {
		this.crossedVisitNodes = crossedVisitNodes;
	}
	
	public List<String> getCrossedVisitNodes() {
		return crossedVisitNodes;
	}
	
	public String getXmlOrthodromePoints(String sStartLon , String sStartLat , String sDestLon , String sDestLat)
	{

		StringBuffer sb = new StringBuffer();
		
		Double interPointLon = null;
		Double interPointLat = null;
		Double distance		 = null;
		Double segment		 = null;
		Double a,b,x,y,z	 = null;
				
		Double dStartLon = (Math.PI/180.0) * Double.valueOf(sStartLon);
		Double dStartLat = (Math.PI/180.0) * Double.valueOf(sStartLat);
		Double dDestLon  = (Math.PI/180.0) * Double.valueOf(sDestLon);
		Double dDestLat  = (Math.PI/180.0) * Double.valueOf(sDestLat);
		
		if(((dStartLat + dDestLat) == 0) && (Math.abs(dStartLon - dDestLon) == 180.0))
		{
			sb.append("<point lon='" + sStartLon + "' lat='" + sStartLat + "' />");
			sb.append("<point lon='" + sDestLon  + "' lat='" + sDestLat  + "' />");
		}
		else
		{
			distance  = Math.acos( Math.sin(dStartLat) * Math.sin(dDestLat) + Math.cos(dStartLat) * Math.cos(dDestLat) * Math.cos(dStartLon - dDestLon));
			
			for (segment = 0.0; segment <= 1.0; segment=segment+0.1)
			{
				a = Math.sin((1.0 - segment) * distance) / Math.sin(distance);
				b = Math.sin(segment * distance) / Math.sin(distance);
				x = a * Math.cos(dStartLat) * Math.cos(dStartLon) + b * Math.cos(dDestLat) * Math.cos(dDestLon);
				y = a * Math.cos(dStartLat) * Math.sin(dStartLon) + b * Math.cos(dDestLat) * Math.sin(dDestLon);
				z = a * Math.sin(dStartLat) + b * Math.sin(dDestLat);
				interPointLon = Math.atan2(y, x);
				interPointLat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
				
				interPointLon = (180.0/Math.PI) * interPointLon;
				interPointLat = (180.0/Math.PI) * interPointLat;
				
				
				sb.append("<point lon='" + interPointLon.toString() + "' lat='" + interPointLat.toString() + "' />");
			}
		}
		
		return sb.toString();
	}
	
	public String getJsonOrthodromePoints(int i,String sStartLon , String sStartLat , String sDestLon , String sDestLat)
	{

		StringBuffer sb = new StringBuffer();
		
		Double interPointLon = null;
		Double interPointLat = null;
		Double distance		 = null;
		Double segment		 = null;
		Double a,b,x,y,z	 = null;
				
		Double dStartLon = (Math.PI/180.0) * Double.valueOf(sStartLon);
		Double dStartLat = (Math.PI/180.0) * Double.valueOf(sStartLat);
		Double dDestLon  = (Math.PI/180.0) * Double.valueOf(sDestLon);
		Double dDestLat  = (Math.PI/180.0) * Double.valueOf(sDestLat);
		
		if(((dStartLat + dDestLat) == 0) && (Math.abs(dStartLon - dDestLon) == 180.0))
		{
			if(i == 0)
			{
				sb.append("{\"lon\":" + sStartLon + ",\"lat\":" + sStartLat + "}");
			}
			else
			{
				sb.append(",{\"lon\":" + sStartLon + ",\"lat\":" + sStartLat + "}");
			}
			sb.append(",{\"lon\":" + sDestLon  + ",\"lat\":" + sDestLat  + "}");
		}
		else
		{
			distance  = Math.acos( Math.sin(dStartLat) * Math.sin(dDestLat) + Math.cos(dStartLat) * Math.cos(dDestLat) * Math.cos(dStartLon - dDestLon));
			
			for (segment = 0.0; segment <= 1.0; segment=segment+0.1)
			{
				a = Math.sin((1.0 - segment) * distance) / Math.sin(distance);
				b = Math.sin(segment * distance) / Math.sin(distance);
				x = a * Math.cos(dStartLat) * Math.cos(dStartLon) + b * Math.cos(dDestLat) * Math.cos(dDestLon);
				y = a * Math.cos(dStartLat) * Math.sin(dStartLon) + b * Math.cos(dDestLat) * Math.sin(dDestLon);
				z = a * Math.sin(dStartLat) + b * Math.sin(dDestLat);
				interPointLon = Math.atan2(y, x);
				interPointLat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
				
				interPointLon = (180.0/Math.PI) * interPointLon;
				interPointLat = (180.0/Math.PI) * interPointLat;

				if(i == 0 && segment == 0.0)
				{
					sb.append("{\"lon\":" + interPointLon.toString()  + ",\"lat\":" + interPointLat.toString()  + "}");
				}
				else
				{
					sb.append(",{\"lon\":" + interPointLon.toString()  + ",\"lat\":" + interPointLat.toString()  + "}");					
				}

			}
		}
		
		return sb.toString();
	}		
	
	public String getRouteJson()
	{
		StringBuffer json = new StringBuffer();
		String orthodromeStartLon = null;
		String orthodromeStartLat = null;
		String orthodromeDestLon = null;
		String orthodromeDestLat = null;			
		
			json.append("{\"distance\":" + getDistance() + ",");
			json.append("\"journeytime\":" + getJourneyTime() + ",");
			json.append("\"eta\":" + getEtaUnixTime() + ",");
			json.append("\"via\":[");		
			if(getCrossedVisitNodes().size() > 0)
			{
				json.append("\"" + getCrossedVisitNodes().get(0).toString() + "\"");
				for(int i=1; i<getCrossedVisitNodes().size(); i++)
				{
					json.append( ",\"" + getCrossedVisitNodes().get(i).toString()  + "\"");
				}
			}
			json.append("],");
			
			json.append("\"routepoints\":[");
			
			if(getPoints().size() > 0)
			{
				int i;
				for(i=0; i<this.getPoints().size()-1; i++)
				{
					// draussen, draussen
					if(!getPoints().get(i).getIsSecondaryNode() && !getPoints().get(i+1).getIsSecondaryNode())
					{
						if(i == 0)
						{
							json.append("{\"lon\":" + getPoints().get(i).getLon() + ",\"lat\":" + getPoints().get(i).getLat() + "}");
						}
						else
						{
							json.append(",{\"lon\":" + getPoints().get(i).getLon() + ",\"lat\":" + getPoints().get(i).getLat() + "}");
						}
					}			
					// draussen, drinnen 
					else if(!getPoints().get(i).getIsSecondaryNode() && getPoints().get(i+1).getIsSecondaryNode())
					{
						orthodromeStartLon = Double.toString(getPoints().get(i).getLon());
						orthodromeStartLat = Double.toString(getPoints().get(i).getLat());
					}
					// drinnen, draussen
					else if(getPoints().get(i).getIsSecondaryNode() && !getPoints().get(i+1).getIsSecondaryNode())
					{
						orthodromeDestLon = Double.toString(getPoints().get(i+1).getLon());
						orthodromeDestLat = Double.toString(getPoints().get(i+1).getLat());
						//i++;
						json.append(getJsonOrthodromePoints(i,orthodromeStartLon,orthodromeStartLat,orthodromeDestLon,orthodromeDestLat));
					}
					else
					{ }
				}
				json.append(",{\"lon\":" + getPoints().get(i).getLon() + ",\"lat\":" + getPoints().get(i).getLat() + "}");
			}
						
			json.append("]");
		json.append("}");
		
		return json.toString();
	}
	
	public String getRouteXml()
	{
		StringBuffer xml = new StringBuffer();
		String orthodromeStartLon = null;
		String orthodromeStartLat = null;
		String orthodromeDestLon = null;
		String orthodromeDestLat = null;	
		
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
		for(int i=0; i<getCrossedVisitNodes().size(); i++)
		{
			xml.append("<name>" + getCrossedVisitNodes().get(i).toString() + "</name>");
		}
		xml.append("</via>");
		xml.append("<routepoints>");
		int i;
		for(i=0; i<this.getPoints().size()-1; i++)
		{
			
			// draussen, draussen
			if(!getPoints().get(i).getIsSecondaryNode() && !getPoints().get(i+1).getIsSecondaryNode())
			{
				xml.append("<point lon='" + getPoints().get(i).getLon() + "' lat='" + getPoints().get(i).getLat() + "' />");
			}			
			// draussen, drinnen 
			else if(!getPoints().get(i).getIsSecondaryNode() && getPoints().get(i+1).getIsSecondaryNode())
			{
				orthodromeStartLon = Double.toString(getPoints().get(i).getLon());
				orthodromeStartLat = Double.toString(getPoints().get(i).getLat());
			}
			// drinnen, draussen
			else if(getPoints().get(i).getIsSecondaryNode() && !getPoints().get(i+1).getIsSecondaryNode())
			{
				orthodromeDestLon = Double.toString(getPoints().get(i+1).getLon());
				orthodromeDestLat = Double.toString(getPoints().get(i+1).getLat());
				//i++;
				xml.append(getXmlOrthodromePoints(orthodromeStartLon,orthodromeStartLat,orthodromeDestLon,orthodromeDestLat));
			}
			else
			{ }
		}
		xml.append("<point lon='" + getPoints().get(i).getLon() + "' lat='" + getPoints().get(i).getLat() + "' />");
		xml.append("</routepoints>");
		xml.append("</route>");
		
		return xml.toString();
	}	
	

}
