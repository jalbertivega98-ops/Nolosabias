# Mezcla "voz primero" (serie NO LO SABÍAS, v2): ducking de música+efectos, limitador y control tipo altavoz de móvil.
import numpy as np, subprocess, wave
from scipy.signal import butter, sosfilt
SR=48000
def db(x): return 20*np.log10(np.maximum(x,1e-9))
def env_follow(x, att=.015, rel=.35):
    """Seguidor de envolvente con ataque/relajación (x mono, >=0)."""
    a=np.exp(-1/(att*SR)); r=np.exp(-1/(rel*SR)); y=np.empty_like(x); s=0.
    # versión vectorizada por bloques de 1 ms para velocidad
    hop=48; xm=x[:len(x)//hop*hop].reshape(-1,hop).max(1); ym=np.empty_like(xm)
    a=np.exp(-1/(att*1000)); r=np.exp(-1/(rel*1000))
    for i,v in enumerate(xm):
        s = a*s+(1-a)*v if v>s else r*s+(1-r)*v
        ym[i]=s
    return np.interp(np.arange(len(x)), np.arange(len(ym))*hop+hop/2, ym)
def bus_comp(x, thr_db=-18, ratio=4, att=.005, rel=.12):
    e=env_follow(np.abs(x).max(1),att,rel); over=np.maximum(db(e)-thr_db,0)
    g=10**(-(over*(1-1/ratio))/20); return x*g[:,None]
def voice_chain(v):
    sos=butter(2,90,'hp',fs=SR,output='sos'); v=sosfilt(sos,v,axis=0)
    # presencia +3 dB en 2–5 kHz (inteligibilidad en altavoz pequeño)
    sos=butter(2,[2000,5000],'bp',fs=SR,output='sos'); v=v+sosfilt(sos,v,axis=0)*.41
    return bus_comp(v,-22,3,.004,.15)
def finalize(v, m, s, dur, path, music_gain=.16, sfx_gain=.30, duck_db=-11, sfx_duck_db=-9):
    """v,m,s: buses (N,2). Devuelve dict con métricas."""
    v=voice_chain(v)
    s=bus_comp(s,-20,6,.002,.10)               # los golpes de efectos nunca saltan por encima
    ve=env_follow(np.abs(v).mean(1),.02,.30)
    act=np.clip((db(ve)+45)/12,0,1)              # 0 = silencio, 1 = hablando (umbral ~-45..-33 dBFS)
    gm=10**(duck_db*act/20); gs=10**(sfx_duck_db*act/20)
    mix=v+m*music_gain*gm[:,None]+s*sfx_gain*gs[:,None]
    mix=mix[:int(SR*dur)]
    # limitador suave con anticipación
    pk=env_follow(np.abs(mix).max(1),.001,.08); g=np.minimum(1,.89/np.maximum(pk,1e-9))
    g=np.convolve(g,np.ones(96)/96,'same'); mix=mix*g[:,None]
    st=(np.clip(mix,-1,1)*32767).astype(np.int16)
    with wave.open(path,'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(st.tobytes())
    return check(v[:len(mix)], mix-v[:len(mix)]*g[:,None], act[:len(mix)])
def check(v, bg, act):
    """Relación voz/fondo vista a través de un altavoz de móvil (300 Hz–7 kHz), en ventanas de 400 ms con voz."""
    sos=butter(4,[300,7000],'bp',fs=SR,output='sos')
    vp=sosfilt(sos,v.mean(1)); bp=sosfilt(sos,bg.mean(1)); w=int(.4*SR); n=len(vp)//w
    rv=np.sqrt((vp[:n*w]**2).reshape(n,w).mean(1)); rb=np.sqrt((bp[:n*w]**2).reshape(n,w).mean(1))
    a=(act[:n*w].reshape(n,w).mean(1)>.8)&(db(rv)>np.median(db(rv[rv>1e-4]))-15); snr=db(rv[a])-db(rb[a])
    worst=np.argsort(snr)[:5]; t=np.where(a)[0][worst]*.4
    return {'snr_med':float(np.median(snr)),'snr_p5':float(np.percentile(snr,5)),'snr_min':float(snr.min()),'worst_t':[round(float(x),1) for x in t]}
