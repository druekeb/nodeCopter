-- NOT FOR USE !!! BECAUSE OF THE ANGLE COMPARISON SOME VESSELS MIGHT NOT BE DETECTED. TRY NEXT QUERY
-- Detecting incoming moving ships within a defined radius (in km) to a chosen port (destination port).
-- The ship's current course_over_ground is compared to the calculated course of the current
-- position of the ship to the "lookat"-position of the port. If the angle between these two
-- courses differs more than 90 degrees it is expected, that the ship's destination port is
-- not the given destination port.  
-- author: Thorsten Stehr (2010-09-06)
select
t2.ship_id,
t2.ship_name,
t2.distanz_km,
t2.kart_winkel_ship_port,
t2.naut_winkel_ship_port,
t2.cog,
acos( cos(t2.naut_winkel_ship_port *pi()/180) * cos(t2.cog *pi()/180) + sin(t2.naut_winkel_ship_port *pi()/180) * sin(t2.cog *pi()/180)) *180/pi() as winkelabweichung -- angle between ship's course_over_ground and air-line-course curr. ship pos. to dest. port. (cross product)
from
(
select
t1.ship_id,
t1.ship_name,
t1.distanz_km,
t1.kart_winkel_ship_port,
case -- check if the cartesian angle is pos oder neg
when (t1.kart_winkel_ship_port < 0) then t1.kart_winkel_ship_port + 180 -- if neg --> nautical angle = cartesian angle + 180 degrees
else t1.kart_winkel_ship_port + 90 -- if pos --> nautical angle = cartesian angle + 90 degrees
end as naut_winkel_ship_port,
t1.cog
from
(
select
sa.ship_id,
s.name as ship_name,
ST_distance_spheroid(sa.current_pos , p.lookat , 'SPHEROID["Bessel 1841",6377397.155,299.1528128]')/1000 as distanz_km, -- distance (air-line) between current ship pos. and dest. port (lookat)
atan2( (y(p.lookat)-y(sa.current_pos)) , (x(p.lookat)-x(sa.current_pos)) ) * 180 / pi() as kart_winkel_ship_port, -- cartesian angle between current ship pos. and dest. port (lookat)
sa.course_over_ground as cog
from
shipaction sa , port p , ship s
where
sa.dest_port_id = 2 -- port_id 2: Hamburg
and
sa.dest_port_id = p.port_id
and
sa.ship_id = s.ship_id
and
sa.actiontype_id = 2 -- type 2: moving ship
order by distanz_km desc
) as t1
where t1.distanz_km < 112 -- 112 km ~ 60 sm
) as t2
;



-- Detecting incoming moving ships within a defined radius (in km) to a chosen port (destination port).
-- Furthermore the ship's current_port_id is compared to the ship's dest_port_id: has to be unequal.
-- author: Thorsten Stehr (2010-09-07)
select
t1.ship_id,
t1.ship_name,
t1.distanz_km,
t1.cog
from
(
select
sa.ship_id,
s.name as ship_name,
ST_distance_spheroid(sa.current_pos , p.lookat , 'SPHEROID["Bessel 1841",6377397.155,299.1528128]')/1000 as distanz_km, -- Distanz (Luftlinie) zwischen ship und port
sa.course_over_ground as cog
from
shipaction sa , port p , ship s
where
sa.dest_port_id = 2 -- port_id 2: Hamburg
and
sa.dest_port_id = p.port_id
and
sa.ship_id = s.ship_id
and
sa.actiontype_id = 2 -- type 2: ship moving
and
((sa.current_port_id is null and sa.dest_port_id is not null) or (sa.current_port_id <> sa.dest_port_id))
order by distanz_km desc
) as t1
where
t1.distanz_km < 112 -- Distanz = 112 km ~ 60 sm




-- Detects ships that visits two or more ports per day in accordance with the schedule 
-- author: Thorsten Stehr (2010-09-03)
select
imo,
name as vessel_name,
array_to_string(array_agg(port), ' ; ') as ports,
date(date_start) as arrival,
count(*) as number_diff_ports_per_day
from schedule
group by imo,name,date_start
having count(*) > 1
order by number_diff_ports_per_day desc, arrival asc, imo asc;



-- For future ZOOM-function to reduce load costs (just an idea)
-- This query determines the geo-position and the amount of vessels within the same 
-- lat and long (interger value of the ships current position  
-- ...to be continued
-- author: Thorsten Stehr (2010-09-06)
select
avg(x(current_pos)) as avg_x,
avg(y(current_pos)) as avg_y,
count(*) as number_of_ships
from shipaction
group by
round(cast( x(current_pos) as numeric) , 0),
round(cast( y(current_pos) as numeric) , 0)
order by number_of_ships desc
;
