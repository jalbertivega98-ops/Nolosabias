# Vídeo perros 3D · «Cuando tu perro corre» (galope, doble suspensión, espalda muelle, olfateo) — voz ElevenLabs eleven_v4 «Álvaro» (1 toma, ×1,2)
from cues_base import *
MUSIC = dict(seed=64, sections=[('hook', 'Dsus'), ('gallop', 'D'), ('double', 'Bb'), ('spine', 'F'), ('speed', 'C'), ('sniff', 'Gm'), ('rate', 'Bb'), ('slits', 'D'),
             ('pull', 'F'), ('you', 'Bb'), ('brand', 'END')],
             shimmer=('gallop', 'end'), pulses=[('gallop', 'sniff', .75), ('rate', 'you', .55)],
             risers=['gallop', 'spine', 'speed', 'sniff', 'slits', 'you', 'brand'],
             hits=[(0.12, .7), ('gallop', .5), ('double', .45), ('speed', .6), ('sniff', .5), ('slits', .45), ('you', .45), ('brand', .5)])
SFX = [('impact_a', 'hook', 0, .8), ('whoosh_a', 'gallop', -.3, .5), ('whoosh_a', 'spine', -.3, .45), ('impact_a', 'speed', 0, .55),
       ('whoosh_a', 'sniff', -.3, .45), ('impact_a', 'slits', 0, .4), ('whoosh_a', 'brand', -.3, .6)]
