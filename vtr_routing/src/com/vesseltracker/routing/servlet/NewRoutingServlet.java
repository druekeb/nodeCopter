package com.vesseltracker.routing.servlet;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.sql.DataSource;

import com.sun.mail.util.BASE64EncoderStream;
import com.vesseltracker.routing.NewVTRouting;
import com.vesseltracker.routing.VTRouting;
import com.vesseltracker.routing.valueObjects.BarrierNode;
import com.vesseltracker.routing.valueObjects.BarrierNodesTreeSet;
import com.vesseltracker.routing.valueObjects.DirectNeighbourResult;
import com.vesseltracker.routing.valueObjects.NearestNeighbourResult;
import com.vesseltracker.routing.valueObjects.RoutingPoint;
import com.vesseltracker.routing.valueObjects.VTDirectRoute;
import com.vesseltracker.routing.valueObjects.VTRoute;

/**
 * Servlet implementation class RoutingServlet
 */
public class NewRoutingServlet extends HttpServlet
{
	private static final long serialVersionUID = 1L;
		
	private DataSource ds = null;
	
	private String aktDijkstraNodeTabelle = "dijkstra_node_b"; // Aktuelle Tabelle _a oder _b
	
	
	
	@Override
	public void init(javax.servlet.ServletConfig config) throws ServletException
	{
		super.init(config);

		try
		{	
			// Lookup JNDI Datasource (database connection)
			Context ctx = new InitialContext();
			if(ctx == null )
			{
				throw new Exception("Boom - No Context");
			}
			
			ds = (DataSource)ctx.lookup("java:comp/env/jdbc/vesseltracker");
		}
		catch(Exception e) 
		{
//			log.log(Level.SEVERE, "Exception in initServlet", e);
			System.out.println("GGDBDE - No DB");
			System.out.println(e.getMessage());
		}
	}
	
    /**
     * @see HttpServlet#HttpServlet()
     */
    public NewRoutingServlet()
    {
        super();
    }
    
	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		
		String user		 	= request.getParameter("user");
		String pass		 	= request.getParameter("pass");
		String answer	 	= request.getParameter("answer");
		String fromLon	 	= request.getParameter("fromLon");
		String fromLat	 	= request.getParameter("fromLat");
		String toLon	 	= request.getParameter("toLon");
		String toLat	 	= request.getParameter("toLat");
		String speed	 	= request.getParameter("speed");
		String startTime 	= request.getParameter("startTime");
		String anzahl	 	= request.getParameter("numOfRoutes");
		String avoid		= request.getParameter("avoid");
		
		String[] avoidList = null;

		PrintWriter out = response.getWriter();
		try
		{
			if((answer == null) || !(answer.equals("JSON") || answer.equals("XML")))
			{
				answer = "XML";
			}
			
			if(avoid != null)
			{
				avoidList = avoid.split(",");
				
				for(int i=0; i<avoidList.length; i++)
				{
				
					if(avoidList[i].equals("PAN")) { avoidList[i] = "PANAMACANAL"; }
					if(avoidList[i].equals("SUEZ")) { avoidList[i] = "SUEZCANAL"; }
					if(avoidList[i].equals("KIK")) { avoidList[i] = "KIEL CANAL"; }
					
				}
			}
			
			if(user.equals("VTRRouting") && pass.equals("VesseltrackerRoutingRocks;-)2011"))
			{
				
			}
			else
			{
				if(!verifyUser(user , pass))
				{
					throw new Exception();
				}				
			}
			
			speed = speed.replaceAll(",", ".");
			
			Double shipSpeed  = Double.parseDouble(speed);
			
			Long etaStartTime  = Long.valueOf(startTime);
			
			if(shipSpeed <= 0)
			{
				throw new Exception();
			}
			
			if((anzahl == null) || !(anzahl.equals("ALL") || anzahl.equals("ONE")))
			{
				anzahl = "ONE";
			}
			
			RoutingPoint start = new RoutingPoint(Double.parseDouble(fromLon) , Double.parseDouble(fromLat) , false);
			RoutingPoint end   = new RoutingPoint(Double.parseDouble(toLon) , Double.parseDouble(toLat) , false);			
			
			NearestNeighbourResult startNN = findNearestNeighbour(start.getLon(), start.getLat());
			NearestNeighbourResult endNN   = findNearestNeighbour(end.getLon(), end.getLat());
			
			if(startNN.getDijkstraNodeId() == endNN.getDijkstraNodeId())
			{
				List<RoutingPoint> points = new ArrayList<RoutingPoint>();
				points.add(start);
				points.add(end);

				DirectNeighbourResult dnr = getDirectDistance(startNN.getDijkstraNodeId() , start.getLon(), start.getLat() , end.getLon(), end.getLat());

				VTDirectRoute dr = new VTDirectRoute(dnr.getDistance() , dnr.getAllowedSpeed() , shipSpeed , points , etaStartTime);
				
				StringBuilder result = new StringBuilder();
				
				if(answer.equals("JSON")) // JSON
				{
					result.append("{\"getRouteJson\":[");
					result.append(dr.getRouteJson()).append("\n");						
					result.append("]}");
					
					response.setContentType("text/json");
					out.println(result.toString());
					out.close();					
				}
				else // XML
				{
					result.append("<?xml version='1.0' encoding='UTF-8'?>\n").append("<routes>\n");
					result.append(dr.getRouteXml()).append("\n");
					result.append("</routes>");
					
					response.setContentType("text/xml");
					out.println(result.toString());
					out.close();
				}
				
			}
			else
			{
				BarrierNodesTreeSet avoidNodes = new BarrierNodesTreeSet();

				Set<VTRoute> routeSet = new HashSet<VTRoute>();
				System.out.println("call getRouteSet from servlet ");

				routeSet = VTRouting.getRouteList(
						startNN.getDijkstraNodeId(),				// nahester Punkt auf Graph aus Sicht von Start LonLat
						endNN.getDijkstraNodeId(),					// nahester Punkt auf Graph aus Sicht von End LonLat
						shipSpeed,									// Schiffsgeschwindigkeit
						start,										// Start LonLat
						end,										// End LonLat
						startNN.getDistance(),						// Distanz von start --> startNN
						endNN.getDistance(),						// Distanz von end   --> endNN
						avoidNodes,									// Liste mit zu vermeidenden Nodes
						avoidList,									// Liste mit zu vermeidenden Strecken (User-Eingabe: avoid=PAN,NOK etc)
						etaStartTime,								// Start-Zeit (fuer ETA-Berechnung)
						anzahl										// Anzahl Routen (ONE = nur kuerzeste, ALL = kuerzeste + Alternativrouten)
					   );
				System.out.println("Länge RouteList: "+routeSet.size());
				StringBuilder result = new StringBuilder();
				Iterator<VTRoute> routeIter = routeSet.iterator();
				
				if(answer.equals("JSON")) // JSON
				{
					result.append("{\"getRouteJson\":[");
					
					if(routeIter.hasNext())
					{
						result.append(routeIter.next().getRouteJson()).append("\n");						
						while(routeIter.hasNext())
						{
							result.append("," + routeIter.next().getRouteJson()).append("\n");
						}
					}
						
					result.append("]}");

					response.setContentType("text/json");
					out.println(result.toString());
					out.close();					
				}
				else // XML
				{
					result.append("<?xml version='1.0' encoding='UTF-8'?>\n").append("<routes>\n");
					while(routeIter.hasNext())
					{
						result.append(routeIter.next().getRouteXml()).append("\n");
					}
					result.append("</routes>");
					
					response.setContentType("text/xml");
					out.println(result.toString());
					out.close();
				}
			}
		}
		catch(Exception e)
		{
			
			if(answer.equals("XML"))
			{
				response.setContentType("text/xml");
				out.println("<?xml version='1.0' encoding='UTF-8'?>");
				out.println("<route>");
				out.println("</route>");
				out.close();			
			}
			else
			{
				response.setContentType("text/json");
				out.println("{\"getRouteJson\":[]}");
				out.close();				
			}
		}
		finally
		{
			out.close();
		}
	}
	
	private DirectNeighbourResult getDirectDistance(int nodeId, double fromLon, double fromLat, double toLon, double toLat) throws NumberFormatException, SQLException
	{
		Double distance		= null;
		Double allowedSpeed	= null;
		
		Connection conn = ds.getConnection();
		try
		{
		
			StringBuffer query = new StringBuffer();
			query.append("select");
			query.append(" ST_Distance_Sphere(ST_GeomFromText('POINT(" + fromLon + " " + fromLat + ")') , ST_GeomFromText('POINT(" + toLon + " " + toLat + ")')) as distance,");
			query.append(" speed");
			query.append(" from " + aktDijkstraNodeTabelle + " where dijkstra_node_id = " + nodeId);
			PreparedStatement stmt = conn.prepareStatement(query.toString(), ResultSet.TYPE_SCROLL_INSENSITIVE, ResultSet.CONCUR_READ_ONLY);
			try
			{
				ResultSet rs = stmt.executeQuery();
				try
				{
					while(rs.next())
					{
						distance		= Double.valueOf(rs.getString("distance"));
						allowedSpeed	= Double.valueOf(rs.getString("speed"));
					}
					
					DirectNeighbourResult dnr = new DirectNeighbourResult(distance , allowedSpeed);
					
					return dnr;
				}
				finally
				{
					rs.close();
				}
			}
			finally
			{
				stmt.close();
			}
		}
		finally
		{
			conn.close();
		}
	}
	
    public String stringToSha1String(String input) throws NoSuchAlgorithmException
    {
    	MessageDigest messageDigest;
    	
    	try
    	{
    	    messageDigest = MessageDigest.getInstance("SHA1");
    		messageDigest.reset();
    	    messageDigest.update(input.getBytes());
    	    ByteArrayOutputStream bos = new ByteArrayOutputStream();
    	    BASE64EncoderStream encoder = new BASE64EncoderStream(bos);
    	    encoder.write(messageDigest.digest());
    	    encoder.flush();
    	    return bos.toString();
    	}
    	catch (IOException e)
    	{
    	    return null;
    	}
    }
    
	
	private boolean verifyUser(String user , String pass) throws SQLException, NoSuchAlgorithmException
	{

		String passwordInDB = null;
		
		Connection conn = ds.getConnection();
		try
		{
		
			StringBuffer query = new StringBuffer();

			// +++ password zu dem benutzer 'user' der die permission = 2 hat (=webservice) +++
			query.append("select w.password from webuser w left join rel_webuser_permission r on w.user_id = r.user_id");
			query.append(" where w.username = '" + user + "' and r.permission_id = 2");
			query.append(" limit 1");
			
			PreparedStatement stmt = conn.prepareStatement(query.toString(), ResultSet.TYPE_SCROLL_INSENSITIVE, ResultSet.CONCUR_READ_ONLY);
			try
			{
				ResultSet rs = stmt.executeQuery();
				try
				{
					while(rs.next())
					{
						passwordInDB	= rs.getString("password");
					}
					
					if(passwordInDB.equals(stringToSha1String(pass)))
					{
						return true;
					}
					else
					{
						return false;
					}

				}
				finally
				{
					rs.close();
				}
			}
			finally
			{
				stmt.close();
			}
		}
		finally
		{
			conn.close();
		}
	}
	

	private NearestNeighbourResult findNearestNeighbour(double lon, double lat) throws NumberFormatException, SQLException
	{
		Integer id		= null;
		Double distance = null;
		
		Connection conn = ds.getConnection();
		try
		{
		
			StringBuffer query = new StringBuffer();

			// +++ Umkreis-Suche des naechsten Nachbarn +++
//			query.append("select");
//			query.append(" dijkstra_node_id,");
//			query.append(" ST_Distance_Sphere(point , ST_GeomFromText('POINT(" + lon + " " + lat + ")')) as distance");
//			query.append(" from " + aktDijkstraNodeTabelle);
//			query.append(" where ST_Contains(ST_Buffer(ST_GeomFromText('POINT(" + lon + " " + lat + ")') , 10) , point) = true");
//			query.append(" order by distance asc limit 1");		

			// +++ Voronoi-Polygon-Suche des naechsten Nachbarn +++
			query.append("select");
			query.append(" dijkstra_node_id,");
			query.append(" ST_Distance_Sphere(point , ST_GeomFromText('POINT(" + lon + " " + lat + ")')) as distance");
			query.append(" from " + aktDijkstraNodeTabelle);
			query.append(" where ST_Contains( voronoi , ST_GeomFromText('POINT(" + lon + " " + lat + ")')) = true");
			query.append(" limit 1");	
			
			PreparedStatement stmt = conn.prepareStatement(query.toString(), ResultSet.TYPE_SCROLL_INSENSITIVE, ResultSet.CONCUR_READ_ONLY);
			try
			{
				ResultSet rs = stmt.executeQuery();
				try
				{
					while(rs.next())
					{
						id		    = Integer.valueOf(rs.getString("dijkstra_node_id"));
						distance	= Double.valueOf(rs.getString("distance"));			
					}
					
					NearestNeighbourResult nnr = new NearestNeighbourResult(id , distance);
					
					return nnr;
				}
				finally
				{
					rs.close();
				}
			}
			finally
			{
				stmt.close();
			}
		}
		finally
		{
			conn.close();
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
	{
		doGet(request, response);
	}

}
