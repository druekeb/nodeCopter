#!/usr/bin/python
import xml.dom.minidom as dom
import sys
import re
tblName = "prio_eins_lexware"
tblName2 = "prio_eins_lexware_position"

def getDatum(datum):    
    return "'" + datum + "'"

def checkField(element,field):
    if not field in element:
        return "null"
    if element[field] == "NULL":
        return "null"
    return "'" + element[field].replace("\n"," ").replace("'","''") + "'"

def checkFieldCurrency(element,field):
    if not field in element:
        return "null"
    if element[field] == "NULL":
        return "null"
    return re.sub("[^0-9.]+","",element[field].replace(".","").replace(",","."))

def getBelegNr(element,field):
    return re.sub("[^0-9]+","",element[field])

def getSQLLexware(auftrag):
    if not auftrag['Betreff_NR'].startswith('Rechnung'):
        return ""
    
    #fields =  '------, -------, --------, bearb_status, best_nr, branche, e_rechnung, -------, -------, freifeld_1, freifeld_2, '
    #fields += 'freifeld_3, --------, -------, hausnummer, h, kst, ktr, kd_gr, ------, ------, lr, mahndatum, name, brutto_n, '
    #fields += 'netto_n, op_betrag, pdf, ---------, projektbez, projektnummer, rabatt, z, s, b, le, lb, w, -----, -------, vertr,'
    #fields += 'vorgang, vorname, wv, wv_datum, zahldatum, -----------, a, abschlag_tr,art, -----, status, d, v,-------, matchcode,'
    #fields += ' --------, gesamt, customer_id, ansprechpartner, email, no_customer'
    
    fields = 'datum, belegnr, lieferdatum, kd_nr, bearb'
    fields += ', anrede, firma, strasse, plz_ort, land'
    fields += ',forderung, brutto_h, netto_h, ust, whrg'
    fields += ',name, zusatz'

    values = getDatum(auftrag['Infoblock']['Belegdatum']) + ", " + getBelegNr(auftrag,'Betreff_NR') + ", " + getDatum(auftrag['Infoblock']['Lieferdatum'])
    values += ", " + checkFieldCurrency(auftrag['Infoblock'],'Kundennr')+", "+checkField(auftrag['Infoblock'],'Bearbeiter')
    values += ", " + checkField(auftrag['Adresse'],'KundeAnrede') + ", " + checkField(auftrag['Adresse'],'KundeFirma') + "," + checkField(auftrag['Adresse'],'KundeStrasse')
    values += ", " + checkField(auftrag['Adresse'],'KundePLZ_ORT') + "," + checkField(auftrag['Adresse'],'KundeLand')
    values += ", " + checkFieldCurrency(auftrag,'Gesamtbetrag') + ", " + checkFieldCurrency(auftrag,'Gesamtbetrag') + ", " + checkFieldCurrency(auftrag,'GesamtNetto') 
    values += ", " + checkFieldCurrency(auftrag['SteuerAusgabe']['Steuersatz'],'AusgabeSteuerBetrag') + ",'EUR'"
    values += ", " + checkField(auftrag['Adresse'],'KundeNameVorname') + ", " + checkField(auftrag['Adresse'],'KundeZusatz')

    return "INSERT INTO " + tblName + "(" + fields + ") values ("+values+");"

def printPositions(auftrag):
    if not auftrag['Betreff_NR'].startswith('Rechnung'):
        return ""
    
    for p in auftrag['Auftragspos']:
        print getSQLPosition(auftrag, auftrag['Auftragspos'][p])

def getSQLPosition(auftrag,position):
    #bis auf ende und duration alle drin
    fields= "beleg_nr, pos_nr, article_nr, article_text, menge, article_ezp, article_gsp, article_ust_proz, pos_gesamt_ust, article_rabatt, belegdatum, beginn, lieferdatum"
    
    values = getBelegNr(auftrag,'Betreff_NR') + ", " + checkFieldCurrency(position,'PositionNr') + ", " + checkField(position,'Artikel_NR') + ", " + checkField(position,'Artikel_Text')
    values += ", " + checkFieldCurrency(position,'Menge') + ", " + checkFieldCurrency(position,'Artikel_EZP') + ", " + checkFieldCurrency(position,'Artikel_GSP') 
    values += ", " + checkFieldCurrency(position,'Ust-Proz') + ", " + checkFieldCurrency(position,'Pos_Gesamt_UST') + ", " + checkFieldCurrency(position,'Artikel_Rabatt') 
    values += ", " + getDatum(auftrag['Infoblock']['Belegdatum']) + ", " + getDatum(auftrag['Infoblock']['Belegdatum']) + ", " + getDatum(auftrag['Infoblock']['Lieferdatum'])
        
    return "INSERT INTO " + tblName2 + "(" + fields + ") values ("+values+");"

def getDetails(part):
    details = {}
    for i in part.childNodes:
        details[i.nodeName] = "NULL" if not i.firstChild else i.firstChild.data
    return details

def parseAuftrag(eintrag):
    auftrag = {}
    for parts in eintrag.childNodes:
        if (parts.nodeName == 'Adresse'):
            auftrag[parts.nodeName] = getDetails(parts)
        if (parts.nodeName == 'Lieferadresse'):
            auftrag[parts.nodeName] = getDetails(parts)
        if (parts.nodeName == 'Infoblock'):
            auftrag[parts.nodeName] = getDetails(parts)
        if (parts.nodeName in ('Betreff_NR','Bezug','Auftragsbeschreibung','Betreffbezug','Zahlungsbedingung','NBL','GesamtNettoText','GesamtNetto','Gesamtbetragtext','Gesamtbetrag')):
            auftrag[parts.nodeName] = "NULL" if not parts.firstChild else parts.firstChild.data
        if (parts.nodeName == 'Auftragspos'):
            i = 1
            positions = {}
            for pos in parts.childNodes:
                positions[pos.nodeName + str(i)] =  getDetails(pos)
                i = i +1 
            auftrag[parts.nodeName] = positions
        if (parts.nodeName == 'SteuerAusgabe'):
            ausgaben = {}
            for aus in parts.childNodes:
                ausgaben[aus.nodeName] = getDetails(aus)
            auftrag[parts.nodeName] = ausgaben
    
    print getSQLLexware(auftrag)
    printPositions(auftrag)

filename = sys.argv[1]
baum = dom.parse(filename)
for eintrag in baum.firstChild.childNodes: 
    if (eintrag.nodeName == 'Auftrag'):
        parseAuftrag(eintrag)
