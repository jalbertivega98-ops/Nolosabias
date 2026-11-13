# Vídeo perros 3D · «Cuando tu perro se sacude» (sacudida, norte, carreras, reverencia) — voz ElevenLabs eleven_v4 «Álvaro» (1 toma, ×1,2)
from cues_base import *
MUSIC = dict(seed=58, sections=[('hook', 'Dsus'), ('fast', 'D'), ('skin', 'Bb'), ('size', 'F'), ('north', 'Gm'), ('study', 'Bb'), ('axis', 'D'), ('compass', 'Gm'),
             ('zoom', 'C'), ('frap', 'F'), ('bow', 'Bb'), ('bowmean', 'D'), ('you', 'Bb'), ('brand', 'END')],
             shimmer=('fast', 'end'), pulses=[('zoom', 'bow', .7)],
             risers=['fast', 'north', 'axis', 'zoom', 'bow', 'you', 'brand'],
             hits=[(0.12, .7), ('fast', .5), ('size', .45), ('north', .5), ('axis', .5), ('zoom', .55), ('bow', .5), ('brand', .5)])
SFX = [('impact_a', 'hook', 0, .8), ('whoosh_a', 'fast', -.3, .45), ('whoosh_a', 'north', -.3, .45), ('impact_a', 'axis', 0, .45),
       ('whoosh_a', 'zoom', -.3, .5), ('impact_a', 'bow', 0, .45), ('whoosh_a', 'brand', -.3, .6)]
