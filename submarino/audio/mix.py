# Mezcla final: voz (acelerada ×K), música original y efectos ElevenLabs colocados según tl.json.
import numpy as np, json, subprocess, wave, sys
SR=48000; TL=json.load(open('audio/tl.json')); K=TL['K']; DUR=TL['end']
def load(path, tempo=None, extra=''):
    af=f'aresample={SR}' + (f',atempo={tempo}' if tempo else '') + (','+extra if extra else '')
    raw=subprocess.run(['ffmpeg','-v','error','-i',path,'-af',af,'-ac','2','-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2).copy()
N=int(SR*(DUR+.5)); out={'v':np.zeros((N,2),np.float32),'m':np.zeros((N,2),np.float32),'s':np.zeros((N,2),np.float32)}
def put(bus,x,at,gain=1.,dur=None,fi=.02,fo=.15,loop=False):
    if dur is not None and loop:
        reps=int(np.ceil(dur*SR/len(x)))+1
        # bucle con fundido cruzado corto entre repeticiones
        xf=int(.08*SR); seg=x.copy(); y=seg
        for _ in range(reps-1):
            r=np.linspace(0,1,xf)[:,None]; y=np.concatenate([y[:-xf], y[-xf:]*(1-r)+seg[:xf]*r, seg[xf:]])
        x=y
    if dur is not None: x=x[:int(dur*SR)]
    x=x.copy(); n=len(x); a=int(fi*SR); b=int(fo*SR)
    if a>0: x[:a]*=np.linspace(0,1,a)[:,None]
    if b>0 and b<n: x[-b:]*=np.linspace(1,0,b)[:,None]
    i=int(at*SR); j=min(N,i+n); out[bus][i:j]+=x[:j-i]*gain
R='audio/raw/'
# --- voz
vo=load(R+'vo_a.mp3',K,'highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=120')
put('v',vo,0.0,1.0,fi=0,fo=.05)
# --- música
m=load('audio/build/music.wav'); put('m',m,0,1.0,fi=0,fo=1.0)
# --- efectos
S=lambda n: load(R+n)
T=TL
put('s',S('amb_b.mp3'),0.0,.9,dur=T['onboard'],loop=True,fi=.01,fo=.3)
put('s',S('hull_b.mp3'),0.3,1.0)
put('s',S('hull_a.mp3'),2.6,.8)
put('s',S('klaxon_a.mp3'),T['onboard']-.05,.75,fo=.3)
put('s',S('whoosh_a.mp3'),T['question']-.35,.6)
put('s',S('vents_a.mp3'),T['vents']+.2,1.0,dur=3.2,loop=True,fo=.6)
put('s',S('vents_b.mp3'),T['flood'],1.0,dur=3.0,loop=True,fo=.8)
put('s',S('amb_a.mp3'),T['flood'],.6,dur=T['food']-T['flood'],loop=True,fi=.5,fo=.8)
put('s',S('whoosh_b.mp3'),T['planes']-.3,.5)
put('s',S('whoosh_a.mp3'),T['m100']-.3,.7)
put('s',S('hull_a.mp3'),T['hatch']+.6,1.0)
put('s',S('hull_b.mp3'),T['shrink']+.3,1.0,dur=3.5,loop=True,fo=.8)
put('s',S('vents_b.mp3'),T['shrink']+2.2,.6,fo=.5)
put('s',S('engine_b.mp3'),T['motor'],.9,dur=T['conv']-T['motor']+.3,loop=True,fi=.3,fo=.5)
put('s',S('engine_a.mp3'),T['snorkel']+.8,.6,dur=T['air']-T['snorkel']-.6,loop=True,fi=.3,fo=.4)
put('s',S('whoosh_b.mp3'),T['air']-.3,.5)
put('s',S('vents_a.mp3'),T['electro'],.35,dur=2.0,loop=True,fi=.3,fo=.6)
put('s',S('whoosh_a.mp3'),T['m300']-.35,.7)
put('s',S('hull_b.mp3'),T['m300']+.4,.7)
put('s',S('sonar_b.mp3'),T['ping'],1.1,fo=.5)
put('s',S('sonar_a.mp3'),T['ping']+1.7,.35,fo=.5)
put('s',S('blow_a.mp3'),T['blow']+.3,1.0,dur=2.4,loop=True,fo=.6)
put('s',S('blow_b.mp3'),T['rise']-.05,1.2,dur=1.8,loop=True,fo=.6)
put('s',S('whoosh_b.mp3'),T['brand']-.3,.6)
# --- ducking de la música bajo la voz
env=np.abs(out['v']).mean(1); w=int(.25*SR); env=np.convolve(env,np.ones(w)/w,'same'); g=1-.55*np.clip(env/0.05,0,1)
mix=out['v']+out['m']*.30*g[:,None]+out['s']*.55
mix=mix[:int(SR*DUR)]
pk=np.abs(mix).max(); mix=mix/pk*.9
st=(np.clip(mix,-1,1)*32767).astype(np.int16)
with wave.open('audio/build/premix.wav','wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(st.tobytes())
print('premix', DUR)
