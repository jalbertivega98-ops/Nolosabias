# Alinea marcas de frase con silencios (DP). Uso: python3 align.py vo.mp3 frases.txt  (frases: "clave|texto" por línea)
import sys, subprocess, re
vo, fr = sys.argv[1], sys.argv[2]
out = subprocess.run(['ffmpeg','-hide_banner','-i',vo,'-af','silencedetect=n=-40dB:d=0.15','-f','null','-'],capture_output=True,text=True).stderr
st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',out)]; en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',out)]
dur=float(re.findall(r'Duration: (\d+):(\d+):([\d.]+)',out)[0][2])+60*int(re.findall(r'Duration: (\d+):(\d+)',out)[0][1])
S=[l.rstrip('\n').split('|',1) for l in open(fr) if l.strip()]
gaps=[(a,b) for a,b in zip(st,en) if b<dur-0.05 and a>0.05]
speech0 = en[0] if st and st[0]<0.05 else 0.0
first=speech0; last=st[-1] if en[-1]>=dur-0.1 else dur
L=[len(t) for _,t in S]; tot=sum(L); n=len(S)
# DP: escoger n-1 huecos (monótonos) minimizando error respecto a la proporción de caracteres
import math
cum=[0]
for x in L: cum.append(cum[-1]+x)
exp=[first+(last-first)*cum[i]/tot for i in range(1,n)]
G=len(gaps); INF=1e18
dp=[[INF]*(G+1) for _ in range(n)]; bk=[[None]*(G+1) for _ in range(n)]
for g in range(G): dp[1][g]=(gaps[g][1]-exp[0])**2 - (gaps[g][1]-gaps[g][0])*0.5
for i in range(2,n):
  for g in range(G):
    best=INF;bi=None
    for h in range(g):
      if dp[i-1][h]<best: best=dp[i-1][h];bi=h
    if bi is not None: dp[i][g]=best+(gaps[g][1]-exp[i-1])**2-(gaps[g][1]-gaps[g][0])*0.5; bk[i][g]=bi
g=min(range(G),key=lambda g:dp[n-1][g]); sel=[g]
for i in range(n-1,1,-1): g=bk[i][g]; sel.append(g)
sel=sel[::-1]
marks={S[0][0]:round(first,3)}; ends=[]
for i,g in enumerate(sel): marks[S[i+1][0]]=round(gaps[g][1],3); ends.append(round(gaps[g][0],3))
ends.append(round(last,3))
print('MARKS', marks); print('ENDS', ends); print('DUR', dur)
