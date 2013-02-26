package com.vesseltracker.routing;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;

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
    		//String[] avoidList,
    		long etaStartTime
    		)
   {
		Graph g = readGraph(shipSpeed , avoidNodes);

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
    
      public static Set<VTRoute> getRouteSet (
    		Integer fromNode,
    		Integer toNode,
    		double shipSpeed,
    		RoutingPoint start,
    		RoutingPoint end,
    		double startDistance,
    		double endDistance,
    		SortedSet<BarrierNodesTreeSet> avoidNodesSet,
    		Set<VTRoute> routeSet,
    		long etaStartTime,
    		String anzahl,
    		Integer alternatives
    		)
    	{
			//finde das nächste avoidNodeSet der Liste
			BarrierNodesTreeSet nächstesAvoidSet = null;
			VTRoute  nächsteRoute = null;
			
			System.out.println("avoidNodesSet beim Aufruf= "+printSet(avoidNodesSet));
			if(avoidNodesSet != null)
			{
				Iterator<BarrierNodesTreeSet> avoidIterator = avoidNodesSet.iterator();
				while(avoidIterator.hasNext())
				{
					nächstesAvoidSet = avoidIterator.next();
					if (!nächstesAvoidSet.isTested()) break;
				}
				if (nächstesAvoidSet!=null)
				{
						if(nächstesAvoidSet.isTested()) 
						{
							return routeSet;
						}
						else
						{
							nächstesAvoidSet.setTested(true);
						}
				}
			}
	    	//erstelle die kürzeste Route
			nächsteRoute = getRoute(fromNode , toNode , shipSpeed , start , end , startDistance , endDistance , nächstesAvoidSet, etaStartTime);
			System.out.println("nächste Route mit barrierNodes "+ nächstesAvoidSet + " hat dist "+nächsteRoute.getDistance());
			routeSet.add(nächsteRoute);
			
			//route hinzugefügt, wie geht's weiter?
			if (anzahl.equals("ONE")||alternatives == 1) 
			{
				return routeSet;
			}
			
			try
			{
				BarrierNodesTreeSet crossedBarrierNodes = nächsteRoute.getCrossedBarrierNodes();
				if (nächstesAvoidSet !=null)
				{
					Iterator<BarrierNode> it = nächstesAvoidSet.iterator();
					while( it.hasNext())
					{
						crossedBarrierNodes.add(it.next());
					}
				}
				//erstelle die Potenzmengen der crossedBarrierNodes-Menge
				SortedSet<BarrierNodesTreeSet> resultSet = new TreeSet<BarrierNodesTreeSet>();
				resultSet = createPowerSet(crossedBarrierNodes, resultSet);
				
				System.out.print("resultSet ="+ printSet(resultSet));
//			if(!resultSet.isEmpty())
//			{
//				Boolean hinzugefügt = avoidNodesSet.addAll(resultSet);
//				if (hinzugefügt) System.out.print("avoidNodesSet + resultSet ="+printSet(avoidNodesSet));
//			}
			}
			catch (Exception e)
			{
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			alternatives --;
			System.out.println((alternatives)+ ".letzter Aufruf von getRouteSet");
	    	return getRouteSet(fromNode , toNode , shipSpeed , start , end , startDistance , endDistance , avoidNodesSet , routeSet, etaStartTime, anzahl, alternatives);
    	}
    

      private static String printSet(Set<BarrierNodesTreeSet> a)
      {
    	  StringBuilder setoftreesets = new StringBuilder();
    	  Iterator<BarrierNodesTreeSet> iter = a.iterator();
	    	while(iter.hasNext())
	    	{
	    		setoftreesets.append(iter.next().toString());
	    	}
	    	return setoftreesets.toString();
      }
      
	private static SortedSet<BarrierNodesTreeSet> createPowerSet(BarrierNodesTreeSet crossedNodes, SortedSet<BarrierNodesTreeSet> resultList ){
	    //-> letztets Gruppenbild
	    BarrierNodesTreeSet lastGroupPortrait = new BarrierNodesTreeSet();
	    Iterator<BarrierNode> cNit = crossedNodes.iterator();
	    while(cNit.hasNext())
	    {
	        lastGroupPortrait.add(cNit.next());
	    }
	    if (lastGroupPortrait.size() > 0) resultList.add(lastGroupPortrait);
	    
	  //rekursiver Aufruf der um eins reduzierten Listen
	    if(crossedNodes.size() > 1 )
	    {
	        Iterator<BarrierNode> it2 = crossedNodes.iterator();
	        while(it2.hasNext())
	        {
	            BarrierNodesTreeSet recursionsList = new BarrierNodesTreeSet();
	            recursionsList.addAll(crossedNodes);
	            recursionsList.remove(it2.next());
	            createPowerSet(recursionsList, resultList);
	        }
	    }
	    
	    return resultList;
	}

 // liest Graph aus Datei ein
    private static Graph readGraph(double shipSpeed, BarrierNodesTreeSet avoidNodes)
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
				
				
				if(avoidNodes!= null)
				{
					Iterator<BarrierNode> it = avoidNodes.iterator();
					while (it.hasNext())
					{
						String barrierNodeid = it.next().getBarrierNodeId();
						if(barrierNodeid.equals(fromNodename) || barrierNodeid.equals(toNodename))
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

    public static void dijkstra(Graph g, Vertex start, BarrierNodesTreeSet avoidVertex)
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
		
				if (avoidVertex == null || avoidVertex.isEmpty()) 	// Liste der verbotenen Knoten ist leer
				{
				    kosten = v.dist; 			// Kosten ermitteln
				    eta_kosten = v.etaDist;
				}
				else
				{
				    for (BarrierNode s : avoidVertex)
				    {
						if (v.name.equals(s.getBarrierNodeId())) 		// Pruefe, ob akteller Knoten  verboten ist (Knoten ist in  Liste)
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

    private static void addPathPoint(Vertex dest, List<RoutingPoint> list ,  BarrierNodesTreeSet crossedBarrierNodes , List<String> crossedVisitNodes)
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
    	BarrierNodesTreeSet crossedBarrierNodes = new BarrierNodesTreeSet();
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


/*   	if(ersteRoute.getCrossedBarrierNodes() != null && numberOfRoutes.equals("ALL"))
{
	System.out.println("Anzahl ersteRoute.crossedBarrierNodes "+ersteRoute.getCrossedBarrierNodes());

	for(int i=0; i<ersteRoute.getCrossedBarrierNodes().size(); i++)
	{	
		crossedBarrierNodes.add(ersteRoute.getCrossedBarrierNodes().get(i).getBarrierNodeId());
	}
	
	   		
	for(int i=1; i < Math.pow(2,crossedBarrierNodes.size()); i++)
	{
		mergeNodes.addAll(avoidNodes); // fuege avoidNodes dazu (werden automatisch generiert und der Methode uebergeben)
		
		String indices = Integer.toBinaryString(i);
		System.out.println("1. indices: "+indices);
		
		while(indices.length() < crossedBarrierNodes.size())
		{
			indices = "0" + indices;
			System.out.println("2. indices: "+indices);
		}
		
		for(int j=0; j<indices.length(); j++)
		{
			if(String.valueOf(indices.charAt(j)).equals("1"))
			{
    			mergeNodes.add(crossedBarrierNodes.get(j));
			}
		}
		
		for(String mergeNode: mergeNodes)
		{
			System.out.println("mergeNodes before maxRoutes: "+mergeNode);
		}
		int maxRoutes = 2;
		
		VTRoute neueRoute = getRoute(fromNode , toNode , shipSpeed , start , end , startDistance , endDistance , mergeNodes , avoidList , etaStartTime);
		neueRoute.setRouteId(i);
		routeList.add(neueRoute);

		for(int x = 0; x < maxRoutes; x++)
		{
			String lastListItem = routeList.get(routeList.size()-1).getCrossedBarrierNodes().get(0).getBarrierNodeId();
			System.out.println("lastListItem "+lastListItem);
			mergeNodes.add(lastListItem);
			for(String mergeNode: mergeNodes)
			{
				System.out.println("mergeNodes in Schleife: "+mergeNode);
			}
			VTRoute zusaetzlicheRoute = getRoute(fromNode , toNode , shipSpeed , start , end , startDistance , endDistance , mergeNodes , avoidList , etaStartTime);

			int routeId = i+x+1;
			System.out.println("routeId = " +routeId);
			zusaetzlicheRoute.setRouteId(routeId);
			if (zusaetzlicheRoute != routeList.get(routeList.size()-1))
			{
				routeList.add(zusaetzlicheRoute);
			}
		}
//		mergeNodes.add(zweiteNeueRoute.getCrossedBarrierNodes().get(0).getBarrierNodeId());
//		VTRoute dritteNeueRoute = getRoute(fromNode , toNode , shipSpeed , start , end , startDistance , endDistance , mergeNodes , avoidList , etaStartTime);
//		dritteNeueRoute.setRouteId(i+2);
//		routeList.add(dritteNeueRoute);
		
		mergeNodes.clear();
	}
	


}*/
