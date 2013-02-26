package com.vesseltracker.routing.valueObjects;
import java.util.LinkedList;
import java.util.List;

/** Klasse zur Repraesentation eines Knoten                                   */
/* neben den unveraenderlichen Datenfeldern name und edges                    */
/* gibt es Arbeitsvariablen fuer die unterschiedlichen Graph-Algorithmen      */
 
public class Vertex {

  public String       name;          // ID des Knoten               (fix)   
  public List<Edge>   edges ;        // Nachbarn als Kantenliste      (fix)
  public double       speed;         // Speed des Knoten
  public RoutingPoint point;
  public boolean	  isBarrierNode;
  public boolean	  isVisitNode;
  public boolean	  isSecondaryNode;
  public String		  nodeName;		 // Bezeichner des Knoten (Name z.B. SUEZCANAL)  

  public int         nr;            // Knotennummer                  (errechnet)
  public int         indegree;      // Eingangsgrad                  (errechnet)
  public double      dist;          // Kosten fuer diesen Knoten     (errechnet)
  public double      etaDist;      
  public Vertex      prev;          // Vorgaenger fuer diesen Knoten (errechnet) 
  public boolean     seen;          // Besuchs-Status                (errechnet)

  public Vertex ( String s) {       // Konstruktor fuer Knoten
    name = s;                       // initialisiere Name des Knoten
    edges = new LinkedList<Edge>(); // initialisiere Nachbarschaftsliste
  }

  public void setPoint(String lon , String lat , boolean isSecondaryNode) {
	  this.point = new RoutingPoint(Double.parseDouble(lon),Double.parseDouble(lat) , isSecondaryNode);
  }

  public void setSpeed(double d) {
      this.speed = d;
  }
  
  public void setIsBarrierNode(boolean b) {
	  this.isBarrierNode = b;
  }
  
  public void setIsVisitNode(boolean b) {
	  this.isVisitNode = b;
  }
  
  public void setIsSecondaryNode(boolean b) {
	  this.isSecondaryNode = b;
  }
  
  public void setNodename(String s) {
	  this.nodeName = s;
  }
  
  public boolean getIsBarrierNode() {
	  return isBarrierNode;
  }
  
  public boolean getIsVisitNode() {
	  return isVisitNode;
  }
  
  public boolean getIsSecondaryNode() {
	  return isSecondaryNode;
  }
  
  public String getNodename() {
	  return nodeName;
  }

  public boolean hasEdge(Vertex w) {// testet, ob Kante zu w besteht
    for (Edge e : edges)            // fuer jede ausgehende Nachbarkante pruefe
      if (e.dest == w)              // falls Zielknoten mit w uebereinstimmt
        return true;                // melde Erfolg
    return false;                   // ansonsten: melde Misserfolg
  }
}
