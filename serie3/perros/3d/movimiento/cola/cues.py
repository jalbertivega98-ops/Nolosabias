# Vídeo perros 3D · «Cuando tu perro mueve la cola» — voz ElevenLabs eleven_v4 «Álvaro» (1 toma, ×1,2)
from cues_base import *
MUSIC = dict(seed=37, sections=[('hook', 'Dsus'), ('study', 'Bb'), ('owner', 'D'), ('stranger', 'Gm'), ('brain', 'F'), ('others', 'C'), ('heart', 'Gm'),
             ('height', 'Bb'), ('robot', 'F'), ('long', 'D'), ('short', 'Gm'), ('you', 'Bb'), ('brand', 'END')],
             shimmer=('side', 'end'), pulses=[('heart', 'height', .6)],
             risers=['study', 'owner', 'brain', 'others', 'robot', 'you', 'brand'],
             hits=[(0.12, .7), ('side', .5), ('owner', .45), ('stranger', .5), ('others', .5), ('height', .5), ('short', .45), ('brand', .5)])
SFX = [('impact_a', 'hook', 0, .8), ('whoosh_a', 'study', -.3, .45), ('impact_a', 'stranger', 0, .45), ('whoosh_a', 'others', -.3, .4),
       ('impact_a', 'height', 0, .45), ('whoosh_a', 'robot', -.3, .4), ('whoosh_a', 'brand', -.3, .6)]
