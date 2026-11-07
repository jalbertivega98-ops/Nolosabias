import sys
from PIL import Image
ts=sys.argv[1].split(','); out=sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 4
w,h=270,480; rows=(len(ts)+cols-1)//cols
o=Image.new('RGB',(w*cols,h*rows))
for i,t in enumerate(ts):
    im=Image.open(f'preview/t{t}.jpg').resize((w,h)); o.paste(im,((i%cols)*w,(i//cols)*h))
o.save(out,quality=85)
