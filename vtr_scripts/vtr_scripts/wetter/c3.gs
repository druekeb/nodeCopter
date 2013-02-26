'reinit'
'set grads off'
'open tmp.ctl'
'set grid off'
'set poli off'
'set frame off'
'set mproj off'
'set xlab off'
'set ylab off'
'set x -1 8'
'set y 0 8'
'set parea 0 11 0 8.5'
'set clopts -1 -1 0.4'
'set csmooth on'
'set cterp on'


'!mkdir wetter'
'!mkdir ./wetter/wind'

zoom = 0
while (zoom < 10)
'!mkdir ./wetter/wind/' zoom

count = math_pow(2,zoom)
x=0
xlon=360/count
while(x<count)

'!mkdir ./wetter/wind/'zoom'/'x
y=0
ylat=180/count
while(y<count)

y2=numToDeg(y, count)
y1=numToDeg(y+1, count)

'set lat ' y1' 'y2


x1=-180+x*xlon
x2=-180+(x+1)*xlon
'set lon 'x1' 'x2

'clear'
'set grads off'
'set ccolor 4'
'set gxout barb'
'set digsiz 0.1'

if (zoom <2) 
'd skip(ugrd10m/0.514,20); skip(vgrd10m/0.514,20)'
endif

if (zoom >=2 & zoom<4) 
'd skip(ugrd10m/0.514,10); skip(vgrd10m/0.514,10)'
endif

if (zoom >=4 & zoom<6 ) 
'd skip(ugrd10m/0.514,2); skip(vgrd10m/0.514,2)'
endif

if (zoom >=6 )
'd skip(ugrd10m/0.514,1); skip(vgrd10m/0.514,1)'
endif
* say 'z='zoom ' x=' x ' y='y ' x1='x1 ' x2='x2 ' y1='y1 ' y2='y2

'printim  ./wetter/wind/'zoom'/'x'/'y'.png x256 y256 -t 0'

y=y+1
endwhile
x=x+1
endwhile
zoom=zoom+1
endwhile
quit

function numToDeg(ytile,counter)
pii=3.1415926
lat_rad = math_atan(math_sinh(pii * (1 - 2 * ytile / counter)))
lat_deg = lat_rad*180.0/pii
*say 'ytile='ytile ' counter='counter ' lat_deg='lat_deg ' lat_rad='lat_rad
return lat_deg


