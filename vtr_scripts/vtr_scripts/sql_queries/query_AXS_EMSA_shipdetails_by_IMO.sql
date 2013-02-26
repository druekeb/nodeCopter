-- AXS EMSA Tabellen Queries: (here example Queen Mary 2, IMO 9241061)
-- ==========================
-- vessel details (nach IMO)
select
v.imo,
v.ship_name,
v.ship_name_date_of_effect,
v.mmsi,
v.callsign,
st.shiptype,
c.flag,
v.single_hull_tanker_indication,
v.gross_tonnage,
v.deadweight,
v.build_date,
s.status
from axs_emsa_vessel v left join axs_emsa_shiptype st on v.shiptype_id = st.shiptype_id
left join axs_emsa_country c on v.flag_id = c.flag_id
left join axs_emsa_status s on v.status_id = s.status_id
where
v.imo = 9241061;


-- classification society (nach IMO)
select
v.imo,
cs.classification_society_name
from axs_emsa_vessel v left join axs_emsa_rel_vessel_classification_society rvcs on v.imo = rvcs.imo
left join axs_emsa_classification_society cs on rvcs.classification_society_id = cs.classification_society_id
where
v.imo = 9241061;


-- vessel companies (nach IMO)
select
v.imo,
c.company_type,
c.company_name,
cn.flag
from axs_emsa_vessel v left join axs_emsa_rel_vessel_company rvc on v.imo = rvc.imo
left join axs_emsa_company c on rvc.company_id = c.company_id and rvc.company_type = c.company_type
left join axs_emsa_country cn on c.country_id = cn.flag_id
where
v.imo = 9241061;
