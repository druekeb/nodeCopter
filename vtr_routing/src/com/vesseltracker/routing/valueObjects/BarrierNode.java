package com.vesseltracker.routing.valueObjects;


public class BarrierNode implements Comparable<BarrierNode>{

	private String barrierNodeId;
	private String barrierNodeName;
	private String richtung;
	
	public BarrierNode() {
		
	}
	
	public BarrierNode(String barrierNodeId , String barrierNodeName , String richtung) {
		this.barrierNodeId		= barrierNodeId;
		this.barrierNodeName	= barrierNodeName;
		this.richtung			= richtung;
	}
	
	public void setBarrierNodeId(String barrierNodeId) {
		this.barrierNodeId = barrierNodeId;
	}
	
	public String getBarrierNodeId() {
		return barrierNodeId;
	}
	
	public void setBarrierNodeName(String barrierNodeName) {
		this.barrierNodeName = barrierNodeName;
	}
	
	public String getBarrierNodeName() {
		return barrierNodeName;
	}
	
	public void setRichtung(String richtung) {
		this.richtung = richtung;
	}
	
	public String getRichtung() {
		return richtung;
	}

	@Override
	public int compareTo(BarrierNode o)
	{
		final int BEFORE = -1;
        final int EQUAL = 0;
        final int AFTER = 1;
        
        if (this.barrierNodeId.equals(o.barrierNodeId)) return EQUAL;
        if (this.barrierNodeId.charAt(0) < o.barrierNodeId.charAt(0)) return  BEFORE;
		return AFTER;
	}
	
	@Override
	public String toString()
	{
		return this.barrierNodeId;
	}
	
	
}
