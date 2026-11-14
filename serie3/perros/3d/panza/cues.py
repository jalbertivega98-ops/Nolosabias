# Vídeo perros 3D · «Cuando tu perro se pone panza arriba» — voz ElevenLabs eleven_v4 «Álvaro» (1 toma, ×1,2)
from cues_base import *
MUSIC = dict(seed=73, sections=[('hook', 'Dsus'), ('myth', 'Gm'), ('study', 'Bb'), ('moves', 'D'), ('human', 'F'), ('signs', 'C'), ('sleep', 'Bb'), ('you', 'D'), ('brand', 'END')],
             shimmer=('myth', 'end'), pulses=[('study', 'human', .6)],
             risers=['myth', 'study', 'human', 'sleep', 'you', 'brand'],
             hits=[(0.12, .7), ('study', .5), ('moves', .45), ('signs', .45), ('sleep', .4), ('brand', .5)])
SFX = [('impact_a', 'hook', 0, .8), ('impact_a', 'myth', 0, .4), ('whoosh_a', 'study', -.3, .5), ('whoosh_a', 'human', -.3, .45), ('whoosh_a', 'brand', -.3, .6)]
