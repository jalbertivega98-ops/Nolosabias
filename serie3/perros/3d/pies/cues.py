# Vídeo perros 3D · «Cuando tu perro se sienta encima de tus pies» — voz ElevenLabs eleven_v4 «Álvaro» (1 toma, ×1,2)
from cues_base import *
MUSIC = dict(seed=77, sections=[('hook', 'Dsus'), ('contact', 'D'), ('base', 'Bb'), ('study', 'F'), ('child', 'Bb'), ('oxy', 'D'), ('fear', 'Gm'), ('you', 'Bb'), ('brand', 'END')],
             shimmer=('contact', 'end'), pulses=[('study', 'child', .55)],
             risers=['contact', 'study', 'oxy', 'fear', 'you', 'brand'],
             hits=[(0.12, .7), ('base', .5), ('study', .45), ('oxy', .5), ('fear', .55), ('brand', .5)])
SFX = [('impact_a', 'hook', 0, .8), ('whoosh_a', 'contact', -.3, .45), ('impact_a', 'base', 0, .45), ('whoosh_a', 'oxy', -.3, .45), ('impact_a', 'fear', 0, .55), ('whoosh_a', 'brand', -.3, .6)]
