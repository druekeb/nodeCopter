package com.vesseltracker.routing;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.PriorityQueue;

import com.vesseltracker.routing.valueObjects.BarrierNode;
import com.vesseltracker.routing.valueObjects.BarrierNodesTreeSet;
import com.vesseltracker.routing.valueObjects.Edge;
import com.vesseltracker.routing.valueObjects.Graph;
import com.vesseltracker.routing.valueObjects.RoutingPoint;
import com.vesseltracker.routing.valueObjects.VTRoute;
import com.vesseltracker.routing.valueObjects.Vertex;

public class VTRouting
{

    private static final String DATEI = "/opt/vesseltracker/templates/routing/graph.dat";

    private static List<String> lines;
    
    private static List<String> getLines(){
    	if (lines==null){
    		try
    		{
				lines = new ArrayList<String>();
				BufferedReader f = new BufferedReader(new FileReader(DATEI));
				String zeile;
				while ((zeile = f.readLine()) != null){
					lines.add(zeile);
				}
    		}
    		catch (FileNotFoundException e)
    		{
    			System.out.println("graph File Not Found");
    			e.printStackTrace();
    		}
    		catch (IOException e)
    		{
    			System.out.println("graph IO Exception");
    			e.printStackTrace();
    		}
    	}
    	return lines;
    }
    
    
    public static VTRoute getRoute(
    		Integer fromNode,
    		Integer toNode,
    		double shipSpeed,
    		RoutingPoint start,
    		RoutingPoint end,
    		double startDistance,
    		double endDistance,
    		BarrierNodesTreeSet avoidNodes,
    		String[] avoidList,
    		long etaStartTime
    		)
   {
	
		Graph g = readGraph(shipSpeed , avoidList);
		

		dijkstra(g, g.getVertex(fromNode.toString()), avoidNodes);
	
		Vertex v = g.getVertex(toNode.toString());
		
		if (v.dist == Double.MAX_VALUE)
		{
		    return null;
		}
		else
		{
			
			VTRoute route = createRoute(v, start, end , startDistance , endDistance , shipSpeed , etaStartTime);			
			return route;
			
		}

    }
    
      public static List<VTRoute> getRouteList(
    		Integer fromNode,
    		Integer toNode,
    		double shipSpeed,
    		RoutingPoint start,
    		RoutingPoint end,
    		double startDistance,
    		double endDistance,
    		BarrierNodesTreeSet avoidNodes,
    		String[] avoidList,
    		long etaStartTime,
    		String numberOfRoutes
    		)
    {
    	
    	List<VTRoute> routeList = new ArrayList<VTRoute>();
    	
    	BarrierNodesTreeSet crossedBarrierNodes	= new BarrierNodesTreeSet(); // Liste mit den zu vermeidenden Nodes (jetzt leer)
    	BarrierNodesTreeSet mergeNodes				= new BarrierNodesTreeSet(); // Liste mit den avoid + barrier Nodes (jetzt leer)
    	
    	VTRoute ersteRoute = getRoute(fromNode , toNode , shipSpeed , start , end , startDistance , endDistance , avoidNodes , avoidList , etaStartTime);
    	
    	if(ersteRoute != null)
    	{
    		ersteRoute.setRouteId(0);
    		routeList.add(ersteRoute);
    	}
    	
    	if(ersteRoute.getCrossedBarrierNodes() != null && numberOfRoutes.equals("ALL"))
    	{
    		Iterator<BarrierNode> bNIter = ersteRoute.getCrossedBarrierNodes().iterator();
    		
    		while (bNIter.hasNext())
    		{
    			crossedBarrierNodes.add(bNIter.next());
    		}
    		   		
    		for(int i=1; i < Math.pow(2,crossedBarrierNodes.size()); i++)
    		{
    			mergeNodes.addAll(avoidNodes); // fuege avoidNodes dazu (werden automatisch generiert und der Methode uebergeben)
    			
    			String indices = Integer.toBinaryString(i);
    			
    			while(indices.length() < crossedBarrierNodes.size())
    			{
    				indices = "0" + indices;
    			}
    			
    			for(int j=0; j<indices.length(); j++)
    			{
    				if(String.valueOf(indices.charAt(j)).equals("1"))
    				{
    	    			mergeNodes.add(crossedBarrierNodes.get(j));
    				}
    			}
    			
				VTRoute neueRoute = getRoute(fromNode , toNode , shipSpeed , start , end , startDistance , endDistance , mergeNodes , avoidList , etaStartTime);
				neueRoute.setRouteId(i);
    			routeList.add(neueRoute);
    			
    			
    		}
      	}
      	Collections.sort(routeList );
    	
    	return routeList;
    }
    
 // liest Graph aus Datei ein
    private static Graph readGraph(double shipSpeed, String[] avoidList)
    { 

		Graph g = new Graph();
		Double etaCost = null;
	
		
		try{
		    for (String zeile : getLines())
		    {
		    	
				String[] za = zeile.split(";", -1);
				
				String source = za[0];
				String dest = za[1];
		
				Double cost;
				cost = Double.parseDouble(za[2]);
		
				String sourcePointLon = za[3];
				String sourcePointLat = za[4];
				String destPointLon = za[5];
				String destPointLat = za[6];
		
				Double sourceSpeed;
				sourceSpeed = Double.parseDouble(za[7]);
		
				Double destSpeed;
				destSpeed = Double.parseDouble(za[8]);
		
				if (shipSpeed > sourceSpeed)
				{
				    etaCost = (cost / sourceSpeed) * shipSpeed;
				}
				else
				{
				    etaCost = cost;
				}
				
				boolean fromIsBarrierNode	= Boolean.parseBoolean(za[9]);
				boolean fromIsVisitNode		= Boolean.parseBoolean(za[10]);
				boolean fromIsSecondaryNode	= Boolean.parseBoolean(za[11]);
				String fromNodename	= za[12];
				boolean toIsBarrierNode = Boolean.parseBoolean(za[13]);
				boolean toIsVisitNode = Boolean.parseBoolean(za[14]);
				boolean toIsSecondaryNode	= Boolean.parseBoolean(za[15]);
				String toNodename	= za[16];
				
				
				if(avoidList != null)
				{
					for(int i=0; i<avoidList.length; i++)
					{
						if(avoidList[i].equals(fromNodename) || avoidList[i].equals(toNodename))
						{
							cost    = Double.MAX_VALUE;
							etaCost = Double.MAX_VALUE;
						}
					}
				}
				
				g.addEdge(
						source,
						dest,
						cost,
						sourcePointLon,
						sourcePointLat,
						destPointLon,
						destPointLat,
						sourceSpeed,
						destSpeed,
						fromIsBarrierNode,
						fromIsVisitNode,
						fromIsSecondaryNode,
						fromNodename,
						toIsBarrierNode,
						toIsVisitNode,
						toIsSecondaryNode,
						toNodename,
						etaCost);
		    }
		}
		catch (NumberFormatException e)
		{
			System.out.println("graph Number Format Exception");
			e.printStackTrace();
		}
    	
		return g;
    }

    public static void dijkstra(Graph g, Vertex start, BarrierNodesTreeSet avoidVertexId)
    {

		Double kosten = null;
		Double eta_kosten = null;
	
		PriorityQueue<Edge> p = 			// Priority-Queue zum Verwalten
		new PriorityQueue<Edge>(); 			// der vorlaeufig kuerzesten Wege
	
		for (Vertex v : g.vertices())
		{ 	// fuer jeden Knoten
		    v.dist = Double.MAX_VALUE; 		// Entfernung ist unendlich
		    v.etaDist = Double.MAX_VALUE;
		    v.seen = false; 				// Knoten noch nicht gesehen
		    v.prev = null; 					// Vorgaenger noch nicht ermittelt
		}
	
		start.dist = 0; 					// endgueltige Kosten zum Startknoten
		start.etaDist = 0;
		p.add(new Edge(start, 0, 0)); 		// erster Eintrag in PriorityQueue
	
		while (!p.isEmpty())
		{ 				// solange noch Eintraege in Priority-Queue
	
		    Edge best = p.remove(); 		// billigster Eintrag in PriorityQueue
		    Vertex v = best.dest; 			// Zielknoten dieses Eintrags
		    if (v.seen)
			continue; 						// falls schon bearbeitet: ignorieren
		    v.seen = true; 					// als bearbeitet markieren
	
		    for (Edge e : v.edges) 			// fuer jede Nachbarkante e von v tue
		    { 		
				Vertex w = e.dest; 				// besorge Zielknoten w
				double c = e.cost; 				// besorge Kosten c zum Zielknoten w
				double f = e.etaCost;
				if (c < 0)
				    throw new 					// falls Kantenkosten negativ melde Fehler
				    RuntimeException("Negativ"); 
		
				if (avoidVertexId == null || avoidVertexId.isEmpty()) 	// Liste der verbotenen Knoten ist leer
				{
				    kosten = v.dist; 			// Kosten ermitteln
				    eta_kosten = v.etaDist;
				}
				else
				{
					Iterator<BarrierNode> aVIter = avoidVertexId.iterator();
					while(aVIter.hasNext())
					{
						String id = aVIter.next().getBarrierNodeId();
						if (v.name.equals(s)) 		// Pruefe, ob akteller Knoten  verboten ist (Knoten ist in  Liste)
						{
						    kosten = Double.MAX_VALUE; // Kosten auf oo setzen
						    eta_kosten = Double.MAX_VALUE;
						    break;
						}
						else
						{
						    kosten = v.dist; 		// Kosten ermitteln
						    eta_kosten = v.etaDist;
						}
				    }
				}
		
				if (w.dist > kosten + c)
				{ 		// falls Verkuerzung moeglich
				    w.dist = kosten + c; 		// berechne Verkuerzung
				    w.etaDist = eta_kosten + f;
				    w.prev = v; 				// notiere verursachenden Vorgaenger
				    p.add(new Edge(w, w.dist, w.etaDist)); // neuer Eintrag in PriorityQueue
				}
		    }
		}
    }

    private static void addPathPoint(Vertex dest, List<RoutingPoint> list ,  List<BarrierNode> crossedBarrierNodes , List<String> crossedVisitNodes)
    {
    	
		if (dest.prev != null)
		{
			
		    addPathPoint(dest.prev, list , crossedBarrierNodes , crossedVisitNodes);
		}
		
		list.add(dest.point);
		
		// Pruefen, ob Node = BarrierNode ist
		if (dest.getIsBarrierNode() == true)
		{
			BarrierNode b = new BarrierNode();
			b.setBarrierNodeId(dest.name);
			b.setBarrierNodeName(dest.getNodename());
			crossedBarrierNodes.add(b);
		}
		
		// Pruefen, ob Node = BarrierNode bzw. VisitNode ist
		if (dest.getIsVisitNode() == true )
		{
			crossedVisitNodes.add(dest.getNodename());
		}
		
    }
    
    private static VTRoute createRoute(
    		Vertex endNode,
    		RoutingPoint start,
    		RoutingPoint end,
    		double startDistance,
    		double endDistance,
    		double shipSpeed,
    		long etaStartTime)
    {

    	VTRoute vtr	= new VTRoute();
    	List<BarrierNode> crossedBarrierNodes = new ArrayList<BarrierNode>();
    	List<RoutingPoint> points = new ArrayList<RoutingPoint>();
    	List<String> crossedVisitNodes = new ArrayList<String>();

	    points.add(start);
	    addPathPoint(endNode, points , crossedBarrierNodes , crossedVisitNodes); // Routing-Graph
	    points.add(end);
	    
	    vtr.setPoints(points);
	    vtr.setCrossedBarrierNodes(crossedBarrierNodes);
	    vtr.setCrossedVisitNodes(crossedVisitNodes);
	    
	    vtr.setDistance((endNode.dist + startDistance + endDistance)/1852.0);
		vtr.setEtaDistance((endNode.etaDist + startDistance + endDistance)/1852.0);

		vtr.setEtaStartTime(etaStartTime);
		
		vtr.setEtaTime(vtr.getEtaDistance(), shipSpeed);
		
//		System.out.println(vtr.getXml());
		
	    return vtr;
    	
    }
}
