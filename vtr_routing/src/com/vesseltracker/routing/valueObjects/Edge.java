package com.vesseltracker.routing.valueObjects;
/** Klasse zur Repraesentation einer Kante                                    */
/*  compareTo-Methode noetig zum Abspeichern von Kanten in Priority-Queue     */

public class Edge implements Comparable<Edge>{

  public Vertex dest;                 // Zielknoten, zu dem die Kante fuehrt
  public double cost;                 // Kosten dieser Kante
  public double etaCost;
  
  public Edge (Vertex d, double c , double e) {  // Konstruktor fuer Kante
    dest        = d;    // initialisiere Zielknoten
    cost        = c;    // initialisiere Kantenkosten
    etaCost    = e;    // initialisiere Kantenkosten
  }

  public int compareTo (Edge other) { // vergleiche mit anderer Kante
    return (int)(cost - other.cost);  // liefert Ergebnis des Vergleichs
  }

}
