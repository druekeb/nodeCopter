create table service(
service_id serial not null,
name character varying(64),
primary key (service_id)
);

create table rel_service_permission(
service_id integer not null,
permission_id integer not null,
primary key (service_id, permission_id),
foreign key (service_id) references service(service_id),
foreign key (permission_id) references permission(permission_id)
);


create table segment(
segment_id serial not null,
name character varying(64) not null,
primary key (segment_id)
);

create table brand(
brand_id serial not null,
name character varying(64) not null,
primary key (brand_id)
);

create table article(
article_id serial not null,
name character varying(64) not null,
segment_id integer not null,
brand_id integer not null,
service_id integer,
duration integer,--In tagen (keine differenz zwischen februar und März bei monats weise)
currency character varying(3) not null,
price numeric(8,2) not null,
bookable boolean not null default true,
primary key (article_id),
foreign key (service_id) references service(service_id),
foreign key (segment_id) references segment(segment_id),
foreign key (brand_id) references brand(brand_id)
);



create table contract(
contract_id serial not null,
article_id integer not null,
overrice_price numeric(8,2),
overrice_comment character varying(256),
customer_id integer not null,
sales_channel character varying(128),
sales_country_id integer not null,
activation_date timestamp without time zone,
last_renewal_date timestamp without time zone,
cancellation_date timestamp without time zone,
cancellation_reason character varying(256),
termination_date timestamp without time zone,
primary key (contract_id),
foreign key (customer_id) references customer(customer_id),
foreign key (sales_country_id) references country(country_id),
foreign key (article_id) references article(article_id)
);



create table transaction_type(
transaction_type_id serial not null,
name character varying(16),
primary key (transaction_type_id)
);

--EXISTIERT BEREITS
--create table payment_method(
--payment_method_id serial not null,
--name character varying(32) not null,
--primary key (payment_method_id)
--);

create table plimus_transaction_info(
ref_nr integer not null,
plimus_original_transaction_date timestamp without time zone not null,
product_id integer not null,
contract_id integer not null,
discount_rate numeric,
ip character varying(15),
refund_ref_nr integer,
payment_received_date timestamp without time zone,
--weitere felder von plimus (z.B. name account_id usw.)
primary key (ref_nr)--,
--foreign key (refund_ref_nr) references plimus_transaction2(ref_nr)
);

create table transaction(
transaction_id serial not null,
contract_id integer not null,
transaction_date timestamp without time zone not null,
payment_method_id integer not null,
transaction_type_id integer not null,
currency character varying(3) not null,
amount numeric (8,2) not null,
discount numeric (8,2),
commission numeric (8,2),
banking_fee numeric (8,2),
banking_fee_comment character varying(256),
provision numeric (8,2),
plimus_transaction_info_id integer,
primary key (transaction_id),
foreign key (contract_id) references contract(contract_id),
foreign key (plimus_transaction_info_id) references plimus_transaction_info(ref_nr),
foreign key (transaction_type_id) references transaction_type(transaction_type_id),
foreign key (payment_method_id) references payment_method(payment_method_id)
);


drop table transaction;
drop table plimus_transaction_info;
drop table transaction_type;
drop table rel_contract_article;
drop table contract;
drop table article;
drop table brand;
drop table segment;
drop table rel_service_permission;
drop table service;


















create table prio_eins_lexware(
prio_eins_lexware serial not null,
datum date,
anrede character varying(64),
bearb character varying(128),
bearb_status character varying(128),
best_nr character varying(128),
branche character varying(128),
e_rechnung character varying(128),
firma character varying(256),
forderung numeric(8,2),
freifeld_1 character varying(128),
freifeld_2 character varying(128),
freifeld_3 character varying(128),
brutto_h numeric(8,2),
netto_h numeric(8,2),
hausnummer character varying(16),
h character varying(128),
kst character varying(128),
ktr character varying(128),
kd_gr character varying(128),
land character varying(128),
lieferdatum date,
lr character varying(128),
mahndatum date,
name character varying(128),
brutto_n numeric(8,2),
netto_n numeric(8,2),
op_betrag numeric(8,2),
pdf boolean,
plz_ort character varying(256),
projektbez character varying(128),
projektnummer character varying(128),
rabatt numeric(8,2),
z boolean,
s character varying(128),
b character varying(128),
le character varying(128),
lb boolean,
w boolean,
strasse character varying(256),
ust numeric(8,2),
vertr character varying(128),
vorgang integer,
vorname character varying(128),
wv character varying(128),
wv_datum date,
zahldatum date,
zusatz character varying(256),
a boolean,
abschlag_tr numeric(8,2),
art character varying(64),
belegnr integer,
status character varying(32),
d boolean,
v boolean,
kd_nr integer,
matchcode character varying(256),
whrg character varying(16),
gesamt character varying(128),
primary key (prio_eins_lexware)
);





