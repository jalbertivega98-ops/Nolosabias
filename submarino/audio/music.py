# Banda sonora original sintetizada (sin licencias de terceros), misma paleta que el piloto:
# drone grave en Re menor, pads de sierra filtrada, pulsos y subidas sincronizadas con tl.json.
import numpy as np, json, sys, wave
from scipy.signal import butter, sosfilt
SR=48000
TL=json.loads(sys.argv[1]); DUR=TL['end']+1.0
n=int(SR*DUR); t=np.arange(n)/SR
rng=np.random.default_rng(2)
def env(a,b,c,d): return np.clip((t-a)/max(b-a,1e-3),0,1)*np.clip((d-t)/max(d-c,1e-3),0,1)
def lpf(x,fc,o=2): return sosfilt(butter(o,fc,'low',fs=SR,output='sos'),x)
def bpf(x,lo,hi): return sosfilt(butter(2,[lo,hi],'band',fs=SR,output='sos'),x)
def saw(f,ph=0): return 2*((f*t+ph)%1)-1
L=np.zeros(n); R=np.zeros(n)
# 1) drone grave, más oscuro a medida que se baja
d=0.0
for f,a in [(36.71,.5),(73.42,.33),(110.0,.1)]:
    d+=a*np.sin(2*np.pi*f*t+0.3*np.sin(2*np.pi*.06*t))
d*=env(0,.4,DUR-2.5,DUR); L+=d*.34; R+=d*.34
# 2) pads por secciones
D=[146.83,174.61,220.0]; Bb=[116.54,146.83,174.61]; C=[130.81,164.81,196.0]; Gm=[98.0,116.54,146.83]; F=[87.31,130.81,174.61,220.0]; A=[110.0,138.59,164.81]
secs=[('hook',D),('vents',Bb),('archi',F),('m100',Gm),('hatch',A),('motor',D),('conv',Bb),('air',C),('m300',Gm),('blow',A),('rise',F),('food',Bb),('brand',[146.83,220.0,293.66,349.23])]
for i,(k,fr) in enumerate(secs):
    st=TL[k]; en=TL[secs[i+1][0]] if i+1<len(secs) else DUR
    e=env(st-.5,st+.7,en-.2,en+.7)
    for f in fr:
        for det,pan in [(-.12,-1),(.11,1)]:
            s=saw(f*(1+det/100*7),rng.random())*e
            if pan<0: L+=s*.03
            else: R+=s*.03
L=lpf(L,850); R=lpf(R,850)
# 3) textura aguda (brillo de cuerdas) en los planos de sistemas
nz=rng.standard_normal(n); sh=bpf(nz,3000,7000)*(0.5+0.5*np.sin(2*np.pi*.25*t))
sh*=env(TL['m100']-1,TL['m100']+2,TL['end']-1,TL['end']+1)*.011
L+=sh; R+=np.roll(sh,900)
# 4) pulso rítmico (motor/tensión) durante propulsión y a 300 m
for a,b,per in [(TL['motor'],TL['air'],.5),(TL['m300'],TL['blow'],.75),(TL['blow'],TL['rise'],.375)]:
    for k in np.arange(a,b,per):
        tt=t-k; m=(tt>0)&(tt<.5); p=np.zeros(n); p[m]=np.sin(2*np.pi*50*tt[m]*(1-tt[m]*.6))*np.exp(-tt[m]*8)
        L+=p*.3; R+=p*.3
# 5) subidas antes de los cortes clave
def riser(at,length=1.5,amp=.11):
    m=(t>at-length)&(t<at); tt=(t[m]-(at-length))/length
    r=np.zeros(n); x=bpf(rng.standard_normal(n),400,9000); r[m]=x[m]*tt**2.5*amp; return r
for at in [TL['m100'],TL['m300'],TL['rise'],TL['brand']]:
    r=riser(at); L+=r; R+=r
# 6) golpes graves
for at,a in [(0.02,.9),(TL['onboard'],.4),(TL['m100'],.6),(TL['hatch'],.5),(TL['m300'],.7),(TL['ping'],.45),(TL['rise'],.8),(TL['brand'],.5)]:
    tt=t-at; m=(tt>0)&(tt<3); s=np.zeros(n); s[m]=np.sin(2*np.pi*(55*np.exp(-tt[m]*1.2)+28)*tt[m])*np.exp(-tt[m]*1.6)
    L+=s*a; R+=s*a
mx=max(np.abs(L).max(),np.abs(R).max()); L/=mx/0.8; R/=mx/0.8
st=(np.stack([L,R],1)*32767).astype(np.int16)
with wave.open(sys.argv[2],'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('ok',DUR)
