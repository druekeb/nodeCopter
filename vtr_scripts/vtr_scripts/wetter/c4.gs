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
'set background 1'

'!mkdir wetter'
'!mkdir ./wetter/pres'

zoom = 0
while (zoom < 8)
'!mkdir ./wetter/pres/' zoom

count = math_pow(2,zoom)
x=0
xlon=360/count
while(x<count)

'!mkdir ./wetter/pres/'zoom'/'x
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
'set clopts 0 -1 0.2'

if(zoom<2)
'color -gxout contour -kind gray->darkgray  940 1020 10'
endif

if(zoom>=2 & zoom <4)
'color -gxout contour -kind gray->darkgray  940 1060 10'
endif

if(zoom>=4 & zoom<6)
'color -gxout contour -kind gray->darkgray  940 1080 5'
endif

if(zoom>=6)
'color -gxout contour -kind gray->darkgray  940 1080 5'
endif

'set clab masked'
'd PRMSLmsl/100'

* say 'z='zoom ' x=' x ' y='y ' x1='x1 ' x2='x2 ' y1='y1 ' y2='y2

'printim  ./wetter/pres/'zoom'/'x'/'y'.png x256 y256 -t 1'

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

