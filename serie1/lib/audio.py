# Audio de la serie NO LO SABÍAS: línea de tiempo, música original, mezcla voz-primero y subtítulos.
# Uso (desde la carpeta del vídeo):  python3 ../lib/audio.py tl|music|mix|subs|all
# Cada vídeo define audio/cues.py con: K, CUES, MARKS, MUSIC, SFX
import sys, json, wave, subprocess, os
import numpy as np
from scipy.signal import butter, sosfilt
sys.path.insert(0, 'audio'); sys.path.insert(0, os.path.dirname(__file__))
import cues as C
from mixbus import finalize
SR = 48000

def build_tl():
    K = C.K
    tl = {k: round(v / K, 3) for k, v in C.MARKS.items()}
    tl['end'] = round(C.MARKS['end'] / K + 1.6, 3); tl['K'] = K
    json.dump(tl, open('audio/tl.json', 'w')); print(tl); return tl

def music(TL):
    """Banda sonora sintetizada (misma paleta que el submarino): drone, pads por secciones, textura, pulsos, subidas y golpes."""
    M = C.MUSIC; DUR = TL['end'] + 1.0; n = int(SR * DUR); t = np.arange(n) / SR
    rng = np.random.default_rng(M.get('seed', 2))
    def env(a, b, c, d): return np.clip((t - a) / max(b - a, 1e-3), 0, 1) * np.clip((d - t) / max(d - c, 1e-3), 0, 1)
    def lpf(x, fc, o=2): return sosfilt(butter(o, fc, 'low', fs=SR, output='sos'), x)
    def bpf(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
    def saw(f, ph=0): return 2 * ((f * t + ph) % 1) - 1
    CH = {'D': [146.83, 174.61, 220.0], 'Bb': [116.54, 146.83, 174.61], 'C': [130.81, 164.81, 196.0], 'Gm': [98.0, 116.54, 146.83],
          'F': [87.31, 130.81, 174.61, 220.0], 'A': [110.0, 138.59, 164.81], 'Dsus': [146.83, 196.0, 220.0], 'END': [146.83, 220.0, 293.66, 349.23]}
    L = np.zeros(n); R = np.zeros(n)
    root = M.get('root', 36.71)
    d = 0.0
    for f, a in [(root, .5), (root * 2, .33), (root * 3, .1)]: d += a * np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * .06 * t))
    d *= env(0, .4, DUR - 2.5, DUR); L += d * .34; R += d * .34
    secs = M['sections']
    for i, (k, ch) in enumerate(secs):
        st = TL[k]; en = TL[secs[i + 1][0]] if i + 1 < len(secs) else DUR
        e = env(st - .5, st + .7, en - .2, en + .7)
        for f in CH[ch]:
            for det, pan in [(-.12, -1), (.11, 1)]:
                s = saw(f * (1 + det / 100 * 7), rng.random()) * e
                if pan < 0: L += s * .03
                else: R += s * .03
    L = lpf(L, 850); R = lpf(R, 850)
    a0, a1 = M.get('shimmer', ('hook', 'end'))
    nz = rng.standard_normal(n); sh = bpf(nz, 3000, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * .25 * t))
    sh *= env(TL[a0] - 1, TL[a0] + 2, TL['end'] - 1, TL['end'] + 1) * .011; L += sh; R += np.roll(sh, 900)
    for a, b, per in M.get('pulses', []):
        for k in np.arange(TL[a], TL[b], per):
            tt = t - k; m = (tt > 0) & (tt < .5); p = np.zeros(n); p[m] = np.sin(2 * np.pi * 50 * tt[m] * (1 - tt[m] * .6)) * np.exp(-tt[m] * 8); L += p * .3; R += p * .3
    def riser(at, length=1.5, amp=.11):
        m = (t > at - length) & (t < at); tt = (t[m] - (at - length)) / length
        r = np.zeros(n); x = bpf(rng.standard_normal(n), 400, 9000); r[m] = x[m] * tt ** 2.5 * amp; return r
    for k in M.get('risers', []): r = riser(TL[k]); L += r; R += r
    for k, a in M.get('hits', []):
        at = TL[k] if isinstance(k, str) else k
        tt = t - at; m = (tt > 0) & (tt < 3); s = np.zeros(n); s[m] = np.sin(2 * np.pi * (55 * np.exp(-tt[m] * 1.2) + 28) * tt[m]) * np.exp(-tt[m] * 1.6); L += s * a; R += s * a
    mx = max(np.abs(L).max(), np.abs(R).max()); L /= mx / 0.8; R /= mx / 0.8
    st = (np.stack([L, R], 1) * 32767).astype(np.int16)
    os.makedirs('audio/build', exist_ok=True)
    with wave.open('audio/build/music.wav', 'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(st.tobytes())
    print('music', DUR)

def load(path, tempo=None):
    af = f'aresample={SR}' + (f',atempo={tempo}' if tempo else '')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-af', af, '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

def mix(TL):
    K = TL['K']; DUR = TL['end']; N = int(SR * (DUR + .5))
    out = {'v': np.zeros((N, 2), np.float32), 'm': np.zeros((N, 2), np.float32), 's': np.zeros((N, 2), np.float32)}
    def put(bus, x, at, gain=1., dur=None, fi=.02, fo=.15, loop=False):
        if dur is not None and loop:
            reps = int(np.ceil(dur * SR / max(len(x), 1))) + 1; xf = min(int(.08 * SR), len(x) // 3); seg = x.copy(); y = seg
            for _ in range(reps - 1):
                r = np.linspace(0, 1, xf)[:, None]; y = np.concatenate([y[:-xf], y[-xf:] * (1 - r) + seg[:xf] * r, seg[xf:]])
            x = y
        if dur is not None: x = x[:int(dur * SR)]
        x = x.copy(); n = len(x); a = int(fi * SR); b = int(fo * SR)
        if 0 < a < n: x[:a] *= np.linspace(0, 1, a)[:, None]
        if 0 < b < n: x[-b:] *= np.linspace(1, 0, b)[:, None]
        i = int(at * SR); j = min(N, i + n)
        if i < N: out[bus][i:j] += x[:j - i] * gain
    put('v', load('audio/raw/vo.mp3', K), 0.0, 1.0, fi=0, fo=.05)
    put('m', load('audio/build/music.wav'), 0, 1.0, fi=0, fo=1.0)
    cache = {}
    for s in C.SFX:
        name, mark, off, gain = s[:4]; kw = s[4] if len(s) > 4 else {}
        if name not in cache: cache[name] = load('audio/raw/' + name + '.mp3')
        at = (TL[mark] if isinstance(mark, str) else mark) + off
        dur = kw.get('dur'); 
        if isinstance(dur, str): dur = TL[dur] - at
        put('s', cache[name], at, gain, dur=dur, loop=kw.get('loop', False), fi=kw.get('fi', .02), fo=kw.get('fo', .15))
    print(finalize(out['v'], out['m'], out['s'], DUR, 'audio/build/premix.wav', duck_db=-14, sfx_duck_db=-12))

def subs(TL):
    K = TL['K']
    def ts(x, sep): ms = int(round(x * 1000)); return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{sep}{ms%1000:03}"
    def tass(x): cs = int(round(x * 100)); return f"{cs//360000}:{cs//6000%60:02}:{cs//100%60:02}.{cs%100:02}"
    srt = []; ass = []; burn = []
    for i, (a, b, tx) in enumerate(C.CUES):
        A, B = a / K, b / K + 0.1
        if i + 1 < len(C.CUES): B = min(B, C.CUES[i + 1][0] / K - 0.02)
        srt.append(f"{i+1}\n{ts(A, ',')} --> {ts(B, ',')}\n{tx}\n")
        line = f"Dialogue: 0,{tass(A)},{tass(B)},Sub,,0,0,0,,{{\\fad(70,70)}}{tx.replace(chr(10), '\\N')}"
        ass.append(line)
        if 'SABÍAS' not in tx and 'más historias' not in tx: burn.append(line)
    head = open(os.path.join(os.path.dirname(__file__), 'ass_head.txt')).read()
    os.makedirs('out', exist_ok=True)
    open('out/subtitulos.srt', 'w').write("\n".join(srt))
    open('out/subtitulos.ass', 'w').write(head + "\n".join(ass) + "\n")
    open('out/subtitulos_quemados.ass', 'w').write(head + "\n".join(burn) + "\n")
    print(len(srt), 'subtítulos')

if __name__ == '__main__':
    what = sys.argv[1]
    if what in ('tl', 'all'): TL = build_tl()
    else: TL = json.load(open('audio/tl.json'))
    if what in ('music', 'all'): music(TL)
    if what in ('mix', 'all'): mix(TL)
    if what in ('subs', 'all'): subs(TL)
