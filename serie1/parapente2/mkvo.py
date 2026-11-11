import subprocess, numpy as np, wave
KEYS = ['hook','nomotor','madrid','how','jump','ridge','dyn','therm','climb','faster','bar','nose','sink','choose','wind','plus','line','streets','straight','brazil','you','brand','tag']
SUBS = ["Más de 500 kilómetros.", "En parapente. Sin motor.\nEn un solo día.", "Casi como ir de Madrid\na Barcelona… volando.",
 "¿Cómo, si un parapente\nsiempre baja?", "Saltando de una corriente\nde aire que sube a otra.",
 "Cuando el viento choca contra una ladera,\nno tiene otra salida: sube.", "Es la dinámica. Con ella puedes pasar\nhoras sobre la misma montaña.",
 "Pero para viajar necesitas térmicas: burbujas\nde aire caliente que despegan del suelo.", "Subes girando dentro… y arriba\nsales disparado hacia la siguiente.",
 "¿Y cómo vas más rápido?", "Con el acelerador: una barra\nque empujas con los pies.",
 "Baja el borde de delante, el ala ataca el aire más plana…\ny pasas de 38 a más de 50 km/h.", "Pero cuanto más rápido vas,\nmás deprisa bajas.",
 "Así que en cada tramo decides:\ncorrer, o flotar.", "Y el mejor aliado es el viento a favor.", "Si sopla a 30 km/h,\ncada planeo te regala 30 más.",
 "Y cuando el viento pone las nubes en fila…", "aparecen las calles de nubes: kilómetros\nde aire que sube, en línea recta.", "Ahí se vuela sin girar.",
 "Así se baten los récords en Brasil: más de 10 horas\nen el aire, de la mañana al atardecer.", "¿Y tú? ¿Cuál ha sido tu vuelo más largo?\nCuéntanoslo en comentarios.",
 "¿NO LO SABÍAS?", "El mundo tiene más historias."]
GAP = {'nomotor':.2,'madrid':.2,'how':.4,'jump':.15,'ridge':.4,'dyn':.25,'therm':.4,'climb':.25,'faster':.45,'bar':.15,'nose':.2,'sink':.25,'choose':.25,
       'wind':.45,'plus':.2,'line':.45,'streets':.05,'straight':.2,'brazil':.45,'you':.5,'brand':.9,'tag':.08}
SR=48000; t=.1; parts=[np.zeros(int(SR*.1))]; marks={}; cues=[]
for i,k in enumerate(KEYS):
    if i: g=GAP[k]; parts.append(np.zeros(int(SR*g))); t+=g
    x=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f'edge/r20_{i+1:02d}.wav','-f','f32le','-'],capture_output=True).stdout,np.float32)
    marks[k]=round(t,3); cues.append((round(t,2),round(t+len(x)/SR,2),SUBS[i])); parts.append(x); t+=len(x)/SR
marks['end']=round(t,3); y=np.concatenate(parts)
with wave.open('raw/vo.wav','wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(y,-1,1)*32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg','-v','error','-y','-i','raw/vo.wav','-b:a','256k','raw/vo.mp3'])
open('cues_auto.py','w').write('K = 1.0\nCUES = [\n'+''.join(f' ({a}, {b}, {s!r}),\n' for a,b,s in cues)+']\nMARKS = '+repr(marks)+'\n')
print(marks)
