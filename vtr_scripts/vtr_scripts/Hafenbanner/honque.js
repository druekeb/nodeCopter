function s() {exit;}
var l= document.getElementById(vesseltracker_linkid);
var b=document.getElementById(vesseltracker_boxid);
if(!l){s();}
if(l.tagName.toLowerCase()!="a"){s();}
var btn=l.firstChild;
if(btn.tagName.toLowerCase()!="img"){s();}

if(l.href!="http://www.vesseltracker.com/"){s();}if(!b){ s
();}if(b.firstChild!=l){s();}if(b.lastChild!=l){s();}
var t = l.style;t.fontWeight='bold';t.textAlign='ce'+
'nter';t.backgroundColor=vesseltracker_bordercolor;t.
color=vesseltracker_bordertextcolor;t.textDecoration=
'none';t.display='block';t = b.style;t.border='1px '+
'solid '+vesseltracker_bordercolor;t.width='128px';;;
t.fontFamily='arial,helvetica,sans-serif';t.fontSize=
'10px';/**/;t.fontWeight='bold';t.overflow='hidden';;
;/**/t.textAlign='center';/**/;var o = b.innerHTML;//
b.innerHTML=/*;*/"<div style=\"background-color:"+///
/**/vesseltracker_bordercolor+/**/";color:"+/**//////
vesseltracker_bordertextcolor+";padding:3px;\">Gro&"+
"szlig;e Schiffe in<br><span style=\"font-size:14px"+
";\">Hamburg</span></div><div style=\"margin:4px;co"+
"lor:"+vesseltracker_textcolor+";\">"+
		
"<a href=\"http://www.vesseltracker.com/de/Ships/Queen-Mary-2-9241061.html\">"
+'<img src="http://www.vesseltracker.com/images/vessels/thumbnails/667.jpg" '
+'alt="Schiffchen" border="0"/></a><br>Queen Mary<br>Passagierschiff<br><br>'
+'<a href="http://www.vesseltracker.com/de/Ships/Queen-Mary-2-9241061.html">'
+'<img src="http://www.vesseltracker.com/images/vessels/thumbnails/668.jpg" '
+'alt="Schiffchen" border="0"/></a><br>Queen Mary<br>Passagierschiff<br><br>'
+'<a href="http://www.vesseltracker.com/de/Ships/Queen-Mary-2-9241061.html">'
+'<img src="http://www.vesseltracker.com/images/vessels/thumbnails/669.jpg" '
+'alt="Schiffchen" border="0"/></a><br>Queen Mary<br>Passagierschiff<br><br>'
+ '</div>'
+ o;

