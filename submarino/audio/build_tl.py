# Convierte las marcas en tiempos brutos de la voz a segundos del vídeo final (voz acelerada ×K)
import json,sys
sys.path.insert(0,'audio'); from cues import MARKS
K=1.2; LEAD=0.0
tl={k:round(v/K+LEAD,3) for k,v in MARKS.items()}
tl['end']=round(MARKS['end']/K+LEAD+1.6,3); tl['K']=K
json.dump(tl,open('audio/tl.json','w')); print(tl)
