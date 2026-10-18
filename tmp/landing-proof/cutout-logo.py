from PIL import Image, ImageFilter
from math import hypot
from pathlib import Path
im=Image.open('public/Lookout_brand_logo.png').convert('RGB')
box=(198,503,1088,728)
w,h=box[2]-box[0],box[3]-box[1]
alpha=Image.new('L',(w,h),0)
a=alpha.load();src=im.load()
for yy in range(h):
 y=yy+box[1]
 for xx in range(w):
  x=xx+box[0];r,g,b=src[x,y];value=0
  if 198<=x<=405 and 503<=y<=724 and (x<=268+max(0,y-641)*.9 or y>=655):
   value=max(0,min(1,(g-60)/90))
  if 286<=x<=333 and 516<=y<=566:
   value=max(value,min(max(0,min(1,(min(r,g,b)-80)/160)),max(0,min(1,22.2-hypot(x-309.3,y-540.6)))))
  if 475<=x<=1088 and 567<=y<=699:
   value=max(value,max(0,min(1,(min(r,g,b)-45)/185)))
  a[xx,yy]=round(value*255)
alpha=alpha.filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(.35))
# Recover foreground edge colours from the dark original matte to avoid a dark fringe.
out=Image.new('RGBA',(w,h));dst=out.load();aa=alpha.load()
for y in range(h):
 for x in range(w):
  opacity=aa[x,y]/255
  if opacity<=0:dst[x,y]=(0,0,0,0);continue
  original=src[x+box[0],y+box[1]]
  colour=tuple(round(max(0,min(255,(v-(1-opacity)*bg)/opacity))) for v,bg in zip(original,(8,20,13)))
  dst[x,y]=(*colour,aa[x,y])
out.save('public/Lookout_brand_logo-transparent.png')
print('Saved public/Lookout_brand_logo-transparent.png',out.size,'RGBA alpha:',out.getextrema()[-1])
