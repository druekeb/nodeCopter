-- Determines the spheroid distance (air-line) between two ports.
-- In this example: Hamburg and New York
-- author: Thorsten Stehr (2010-09-03)
select
ST_distance_spheroid(
(select lookat from port_testtable where port_id = 2),
(select lookat from port_testtable where port_id = 288),
'SPHEROID["Bessel 1841",6377397.155,299.1528128]'
);



-- Checking if the berth polygon is a valid geometry.
-- Detects invalid berth polygons
-- author: Thorsten Stehr (2010-09-03)
select
b.berth_id,
b.name
from berth b
where
ST_IsValid(b.geodata) = FALSE;



-- Checking if the port polygon is a valid geometry
-- Detects invalid port polygons
-- author: Thorsten Stehr (2010-09-03)
select
p.port_id,
p.name
from port p
where
ST_IsValid(p.geodata) = FALSE;



-- Checking if a berth polygon not is fully positioned in a port polygon
-- Detects berth polygons completely outside or partly outside port polygons 
-- author: Thorsten Stehr (2010-09-03)
select
b.berth_id,
b.name as berth_name,
p.port_id,
p.name as port_name
from berth b , port p
where
b.port_id = p.port_id
and
--overlaps(b.geodata , p.geodata) = TRUE
contains(p.geodata , b.geodata) = FALSE
--isempty(intersection(p.geodata , b.geodata)) = TRUE and p.port_id not in (791) and b.berth_id not in (671,1487,2380,2409)
;



-- Checking if a timeline crosses a berth
-- Detecs berths and timelines that cross eachother 
-- author: Thorsten Stehr (2010-09-03)
select
t.timeline_id,
t.name as timeline_name,
t.shortname as timeline_shortname,
b.berth_id,
b.name as berth_name
from berth b , timeline t
where
crosses(b.geodata , t.theline) = TRUE;



-- Checking if different berths overlap eachother
-- Detects overlapping berths
-- author: Thorsten Stehr (2010-09-03)
select
ba.berth_id as berth_id_A,
ba.name as berth_name_A,
pa.name as port_name_A,
bb.berth_id as berth_id_B,
bb.name as berth_name_B,
pb.name as port_name_B
from berth as ba join port pa on pa.port_id = ba.port_id, berth as bb join port pb on pb.port_id = bb.port_id
where overlaps(ba.geodata,bb.geodata) = TRUE and ba.berth_id <= bb.berth_id;



-- Creating a function vt_geobuffer(lon::numeric, lat::numeric, radius::numeric, unit::text) which
-- returns a circular polygon with a <radius> in unit 'sm', 'km' or 'm' to a given center point <lon>,<lat>
-- ###############################
-- DOESN'T WORK ON DB02, 'cause the table 'spatial_ref_sys' contains no data, but the data are nessesary for PostGIS...
-- ###############################
-- author: Thorsten Stehr (2011-09-08)
CREATE FUNCTION vt_geobuffer_unit(numeric, numeric, numeric, text)
  RETURNS text AS
$BODY$
DECLARE
the_buffer text;
BEGIN
	IF $4 = 'm' THEN
		select st_buffer(ST_GeographyFromText('POINT(' || $1 || ' ' || $2 || ')'),$3) INTO the_buffer;
	ELSIF $4 = 'km' THEN
		select st_buffer(ST_GeographyFromText('POINT(' || $1 || ' ' || $2 || ')'),$3*1000) INTO the_buffer;
	ELSIF $4 = 'sm' THEN
		select st_buffer(ST_GeographyFromText('POINT(' || $1 || ' ' || $2 || ')'),$3*1852) INTO the_buffer;
	ELSE
		select st_buffer(ST_GeographyFromText('POINT(' || $1 || ' ' || $2 || ')'),$3) INTO the_buffer;
	END IF;
	RETURN the_buffer;
END
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
  
  
  
-- function to get the union of two arrays:
-- a = array[1,2,3] , b = array[2,3,4] --> result = array[1,2,3,4]
-- author: Thorsten Stehr (2012-03-21)
CREATE FUNCTION vt_array_union(anyarray, anyarray)
  RETURNS anyarray
  language sql
as $FUNCTION$
    SELECT ARRAY(
        SELECT UNNEST($1)
        UNION
        SELECT UNNEST($2)
    );
$FUNCTION$; 
