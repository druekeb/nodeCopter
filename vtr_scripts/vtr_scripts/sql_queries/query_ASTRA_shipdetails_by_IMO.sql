-- ASTRA Tabellen Queries: (here example Queen Mary 2, IMO 9241061)
-- ==========================
-- vessel details (nach IMO)
select
v.imo,am.name,m.name as datakey,v.datavalue || ' ' || coalesce(m.units,'') as datavalue,s.name as source
from astra_vessels v
left join astra_sources s
on v.source_id = s.source_id
left join astra_metaschema m
on v.metaschema_id = m.metaschema_id
left join astra_metaschema am
on m.parent_id = am.metaschema_id
where v.imo = 9241061
order by v.imo asc,am.sorder asc,m.parent_id asc, m.sorder asc;
