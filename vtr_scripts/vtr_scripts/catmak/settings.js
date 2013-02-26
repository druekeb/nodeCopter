var ZOOM = 9; //Zoomstufe beim Start
var START_LAT = 53.54;
var START_LON = 9.92;

var TIME_AFTER_REFRESH = 1000;
var TIME_UNTIL_OPEN = 3000;
var TIME_UNTIL_CLOSE = 8000; //8000;
var TIME_UNTIL_NEXT = 0;
var TIME_AFTER_NEW_PORT = 4000;

var VESSELS_PER_PORT = 4;

var INTERACTIVE = true;

var LOGO_CAT_SMALL = "img/cat_small.gif";
var LOGO_CAT_LARGE = "img/cat_large.gif";
var LOGO_MAK_SMALL = "img/mak_small.gif";
var LOGO_MAK_LARGE = "img/mak_large.gif";

var MAP_STYLE = 2; //1 = Hybrid, 2=Road, 3= Arial

var PORTS = new Array();

PORTS[0] = new Object();
PORTS[1] = new Object();
PORTS[2] = new Object();
PORTS[3] = new Object();
PORTS[4] = new Object();
PORTS[5] = new Object();
PORTS[6] = new Object();
PORTS[7] = new Object();
PORTS[8] = new Object();
PORTS[9] = new Object();

PORTS[0]['active'] = true;
PORTS[1]['active'] = true;
PORTS[2]['active'] = true;
PORTS[3]['active'] = true;
PORTS[4]['active'] = true;
PORTS[5]['active'] = true;
PORTS[6]['active'] = true;
PORTS[7]['active'] = true;
PORTS[8]['active'] = true;
PORTS[9]['active'] = true;

PORTS[0]['all_vessels'] = false;
PORTS[1]['all_vessels'] = true;
PORTS[2]['all_vessels'] = false;
PORTS[3]['all_vessels'] = false;
PORTS[4]['all_vessels'] = true;
PORTS[5]['all_vessels'] = false;
PORTS[6]['all_vessels'] = true;
PORTS[7]['all_vessels'] = false;
PORTS[8]['all_vessels'] = true;
PORTS[9]['all_vessels'] = false;

PORTS[0]['zoom'] = 9;
PORTS[1]['zoom'] = 9;
PORTS[2]['zoom'] = 9;
PORTS[3]['zoom'] = 9;
PORTS[4]['zoom'] = 9;
PORTS[5]['zoom'] = 9;
PORTS[6]['zoom'] = 9;
PORTS[7]['zoom'] = 9;
PORTS[8]['zoom'] = 9;
PORTS[9]['zoom'] = 9;


PORTS[0]['vesselzoom'] = 14;
PORTS[1]['vesselzoom'] = 14;
PORTS[2]['vesselzoom'] = 14;
PORTS[3]['vesselzoom'] = 14;
PORTS[4]['vesselzoom'] = 14;
PORTS[5]['vesselzoom'] = 14;
PORTS[6]['vesselzoom'] = 14;
PORTS[7]['vesselzoom'] = 14;
PORTS[8]['vesselzoom'] = 14;
PORTS[9]['vesselzoom'] = 14;

PORTS[0]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_Hamburg.xml";
PORTS[1]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_Rotterdam.xml";
PORTS[2]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_Antwerpen.xml";
PORTS[3]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_LeHavre.xml";
PORTS[4]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_Bremerhaven.xml";
PORTS[5]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_Singapore.xml";
PORTS[6]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_New%20York.xml";
PORTS[7]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_San%20Francisco.xml";
PORTS[8]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_Durban.xml";
PORTS[9]['filename']="http://www.vesseltracker.com/googleMapsServlet/catmak_Genova.xml";

PORTS[0]['name']="Hamburg";
PORTS[1]['name']="Rotterdam";
PORTS[2]['name']="Antwerp";
PORTS[3]['name']="LeHavre";
PORTS[4]['name']="Bremerhaven";
PORTS[5]['name']="Singapore";
PORTS[6]['name']="New York";
PORTS[7]['name']="San Francisco";
PORTS[8]['name']="Durban";
PORTS[9]['name']="Genova";

PORTS[0]['country']="Germany";
PORTS[1]['country']="Netherlands";
PORTS[2]['country']="Belgium";
PORTS[3]['country']="France";
PORTS[4]['country']="Germany";
PORTS[5]['country']="Singapore";
PORTS[6]['country']="USA";
PORTS[7]['country']="USA";
PORTS[8]['country']="South Africa";
PORTS[9]['country']="Italy"; 