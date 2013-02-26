
-- -d inserts
-- -f outputfilename
-- -t nur diese tabelle
-- -a data-only
pg_dump -d -t tracking -a -f tracking_old.sql --username=ais --password=fortuna vesseltracker

-- postgres-option anschalten (irgendwas mit constraints.,,=on)


ALTER TABLE tracking rename to tracking_old:


CREATE TABLE tracking 
(
  tracking_id serial NOT NULL, 
  ship_id integer, 
  "timestamp" timestamp without time zone, 
  course_over_ground numeric (6,2), 
  "position" geometry, 
  CONSTRAINT enforce_dims_position CHECK ((ndims("position") = 2)),
  CONSTRAINT enforce_geotype_position CHECK (((geometrytype("position") = 'POINT'::text) OR ("position" IS NULL))),
  CONSTRAINT enforce_srid_position CHECK ((srid("position") = -1))
);

ALTER TABLE ONLY tracking  ADD CONSTRAINT tracking_pkey PRIMARY KEY (tracking_id);

CREATE INDEX tracking_time_idx ON tracking USING btree ("timestamp");
ALTER TABLE ONLY tracking ADD CONSTRAINT tracking_ship_id_fkey FOREIGN KEY (ship_id) REFERENCES ship(ship_id);

-- create_old_tracking_tables.pl laufen lassen

create trigger tracking_partition before insert on tracking for each row execute procedure tracking_insert_trigger();

\i tracking_old.sql

-- eine woche trackingtables.pl laufen lassen


