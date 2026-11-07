# Hoja de contactos: python3 ../lib/sheet.py out.png preview/t1.jpg ...
import sys, subprocess
out=sys.argv[1]; ims=sys.argv[2:]; n=len(ims); cols=min(4,n)
args=[]; 
for i in ims: args+=['-i',i]
rows=(n+cols-1)//cols; f=''
for i in range(n): f+=f'[{i}]scale=270:480[s{i}];'
pad=rows*cols-n
for i in range(pad): f+=f'color=black:s=270x480:d=1[p{i}];'
lab=[f'[s{i}]' for i in range(n)]+[f'[p{i}]' for i in range(pad)]
for r in range(rows): f+=''.join(lab[r*cols:(r+1)*cols])+(f'hstack={cols}[r{r}];' if cols>1 else f'null[r{r}];')
f+=''.join(f'[r{r}]' for r in range(rows))+(f'vstack={rows}' if rows>1 else 'null')
subprocess.run(['ffmpeg','-y','-loglevel','error']+args+['-filter_complex',f,'-frames:v','1',out],check=True)
