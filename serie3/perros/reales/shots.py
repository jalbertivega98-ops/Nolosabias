# Planos del vídeo real: (marca_inicio, clip, segundo_origen, centro_x (0-1, solo horizontales), velocidad)
import json, subprocess, sys, os
TL = json.load(open('audio/tl.json'))
CL = '/root/nolosabias/serie3/perros/clips/'
SH = [
 ('hook', '01_head_tilt_a', 0.0, .50, 1.0),
 ('intent', '01_head_tilt_c', 1.5, .42, 1.0),
 ('study', '09_toys_b', 0.0, .5, 1.0),
 (7.0 / 1.2 + 4.4, '09_toys_a', 2.0, .5, 1.0),
 ('p43', '01_head_tilt_b', 0.0, .5, 1.0),
 ('rest', '01_head_tilt_a', 8.0, .50, 1.0),
 ('focus', '01_head_tilt_c', 9.0, .48, 1.0),
 ('tail', '02_tail_wag_b', 0.0, .5, 1.0),
 ('right', '03_owner_greeting_a', 5.0, .42, 1.0),
 ('left', '04_dogs_meeting_sniff_b', 2.0, .37, 1.0),
 ('others', '04_dogs_meeting_sniff_a', 3.0, .62, 1.0),
 ('yawn', '05_yawn_a', 0.0, .5, 1.0),
 ('contag', '05_yawn_b', 0.0, .5, 1.0),
 ('kick', '06_digging_ground_a', 0.0, .5, 1.0),
 ('glands', '06_digging_ground_b', 3.0, .42, 1.0),
 ('eyes', '07_puppy_eyes_a', 0.0, .5, 1.0),
 ('wolfm', '08_wolf_face_a', 6.0, .30, 1.0),
 ('select', '07_puppy_eyes_a', 6.5, .5, 1.0),
 ('you', '01_head_tilt_a', 12.0, .50, 1.0),
]
def T(m): return TL[m] if isinstance(m, str) else m
GRADE = "eq=contrast=1.07:saturation=0.9:gamma=0.97,colorbalance=rs=-0.04:bs=0.05:rh=0.05:gh=0.01:bh=-0.05,vignette=angle=0.6,unsharp=5:5:0.5"
starts = [round(T(s[0]) * 30) for s in SH] + [round(TL['end'] * 30)]
files = []
for i, (m, clip, ss, cx, sp) in enumerate(SH):
    n = starts[i + 1] - starts[i]; f = f'seg/s{i:02d}.mp4'; files.append(f)
    if os.path.exists(f) and os.path.getsize(f) > 1000: continue
    w, h = map(int, subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', CL + clip + '.mp4'], capture_output=True, text=True).stdout.strip().split(','))
    dur = n / 30
    if w > h:  # horizontal: escala a 1920+8% de alto y paneo suave
        H = 2074; Wd = round(w * H / h / 2) * 2; x0 = cx * Wd - 540
        x0 = max(0, min(Wd - 1080, x0)); x1 = max(0, min(Wd - 1080, x0 + (30 if i % 2 else -30)))
        vf = f"scale={Wd}:{H},crop=1080:1920:'{x0}+({x1 - x0})*t/{dur}':'77-40*t/{dur}'"
    else:
        vf = f"scale=1168:2076,crop=1080:1920:'44+{(-1) ** i * 30}*t/{dur}':'78-50*t/{dur}'"
    vf = f"setpts=PTS/{sp}," + vf + ",fps=30," + GRADE + ",setsar=1"
    # si el clip es corto, repetirlo en bucle
    cmd = ['ffmpeg', '-y', '-v', 'error', '-stream_loop', '-1', '-ss', str(ss), '-i', CL + clip + '.mp4', '-an', '-vf', vf, '-frames:v', str(n), '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-pix_fmt', 'yuv420p', f]
    subprocess.run(cmd, check=True); print(i, clip, n)
open('seg/list.txt', 'w').write(''.join(f"file '{x.split('/')[1]}'\n" for x in files))
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'seg/list.txt', '-c', 'copy', 'out/base.mp4'], check=True)
print('total', sum(starts[i + 1] - starts[i] for i in range(len(SH))), round(TL['end'] * 30))
