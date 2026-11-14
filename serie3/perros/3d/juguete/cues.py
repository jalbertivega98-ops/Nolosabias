# Vídeo perros 3D · «Cuando tu perro te trae un juguete» — voz ElevenLabs eleven_v4 «Álvaro» (1 toma, ×1,2)
from cues_base import *
MUSIC = dict(seed=71, sections=[('hook', 'Dsus'), ('invite', 'D'), ('alone', 'Bb'), ('study', 'Gm'), ('novel', 'D'), ('trick', 'F'), ('tug', 'C'), ('win', 'F'), ('you', 'Bb'), ('brand', 'END')],
             shimmer=('invite', 'end'), pulses=[('invite', 'alone', .6), ('tug', 'you', .65)],
             risers=['invite', 'study', 'novel', 'tug', 'you', 'brand'],
             hits=[(0.12, .7), ('invite', .5), ('novel', .55), ('tug', .5), ('win', .45), ('brand', .5)])
SFX = [('impact_a', 'hook', 0, .8), ('whoosh_a', 'invite', -.3, .45), ('impact_a', 'novel', 0, .5), ('whoosh_a', 'tug', -.3, .5), ('whoosh_a', 'brand', -.3, .6)]
