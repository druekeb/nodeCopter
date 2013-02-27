package com.vesseltracker.routing.valueObjects;

import java.util.Iterator;
import java.util.TreeSet;

public class BarrierNodesTreeSet extends TreeSet<BarrierNode> implements Comparable<BarrierNodesTreeSet>
{
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private boolean tested;
	
	@Override
	public int compareTo(BarrierNodesTreeSet o)
    {
         final int BEFORE = -1;
         final int EQUAL = 0;
         final int AFTER = 1;
         
         if (this == o) return EQUAL;
         if (this.size() < o.size()) return  BEFORE;
         if (this.size() > o.size()) return AFTER;
 
         Iterator<BarrierNode> iter = this.iterator();
         while (iter.hasNext()) {
        	 if (!(o.contains(iter.next()))) return BEFORE;
         }
         return 0;
    }

	public void setTested(boolean tested)
	{
		this.tested = tested;
	}

	public boolean isTested()
	{
		return tested;
	}
	
	@Override
	public String toString()
	{
		StringBuilder treeset = new StringBuilder("[");
		Iterator<BarrierNode> thisit = this.iterator();
		while (thisit.hasNext())
		{
			BarrierNode bn = thisit.next();
			treeset.append(bn.getBarrierNodeName()+" ");
		}
		treeset.append("] "+ (this.isTested()? "(tested) ":"(untested)"));
		
		return treeset.toString();
	}
}