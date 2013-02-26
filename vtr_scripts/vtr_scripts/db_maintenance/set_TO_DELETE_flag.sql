-- 1:
-- ==
-- find master_id (siehe vtr_util/src/com/vesseltracker/convert/maintainace/*)
-- update ship set delete_reason = 1 where master_id is not null and to_delete = true;



-- 2: Noch nie empfangen: ship.last_seen = null && shipaction.time_seen = null
-- ============================================================================
update ship set to_delete = true, delete_reason = 2 where ship_id in
(
select s.ship_id from ship s left join shipaction sa
on s.ship_id = sa.ship_id
where
s.delete_reason is null
and
greatest(s.last_seen,sa.time_seen) is null
);

-- Ups, doch wieder empfangen... --> TO_DELETE auf false setzen
update ship set
to_delete = false,
delete_reason = null
where
to_delete = true
and
delete_reason = 2
and
ship_id in (select ship_id from shipaction);



-- 3: Schiffe, mit gleicher name,mmsi,imo,length,width die keine Fotos haben
-- =========================================================================
update ship set to_delete = true, delete_reason = 3 where delete_reason is null and ship_id in
(
select unnest(ship_ids) from
(
select name,mmsi,imo,length,width,count(*) as anzahl,array_agg(ship_id) as ship_ids from ship
where ship_id in (select ship_id from ship where ship_id not in (select distinct ship_id from ship_photo where ship_id is not null))
group by name,mmsi,imo,length,width
having count(*) > 10
) t
);


-- 4: Schiffe, name != null aber trim(name) = '', mmsi = null, imo = null oder falsch
-- ==================================================================================
update ship set to_delete = true, delete_reason = 4 where delete_reason is null and ship_id in
(
select ship_id from ship where length(trim(name)) = 0 and mmsi is null and (imo is null or checkimo(imo) = false)
);




-- 5: Schiffe deren letzte 'ship.last_seen' bzw. 'shipaction.time_seen' aelter als '20XX-01-01 00:00:00' ist die keine Fotos haben
-- ===============================================================================================================================
update ship set to_delete = true, delete_reason = 5 where delete_reason is null and ship_id in



select count(*) from
(
select s.ship_id from ship s left join shipaction sa
on s.ship_id = sa.ship_id
where
s.delete_reason is null
and
checkimo(s.imo) = false
and
s.imo is not null
and
greatest(s.last_seen,sa.time_seen) < '2010-01-01 00:00:00'
and
s.ship_id in (select ship_id from ship where ship_id not in (select distinct ship_id from ship_photo where ship_id is not null))
and
s.length > 600
) t;
