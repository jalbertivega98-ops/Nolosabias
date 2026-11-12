#!/bin/bash
# ../lib/pvq.sh out.jpg "t1,t2,..." [query]  → hoja 5 columnas con shot2 (rápido, un navegador)
OUT=$1; T=$2; Q=$3
node ../lib/shot.mjs $T "$Q" 2>&1 | grep -E "err" ; python3 -c "
from PIL import Image; import os,sys
T='$T'.split(','); ims=[Image.open(f'preview/t{t}.jpg').resize((270,480)) for t in T]
rows=(len(ims)+4)//5; o=Image.new('RGB',(1350,480*rows))
for i,im in enumerate(ims): o.paste(im,((i%5)*270,(i//5)*480))
o.save('$OUT')"
