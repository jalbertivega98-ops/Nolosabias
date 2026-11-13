# Vídeo perros 3D · «Cuando tu perro jadea» (jadeo, almohadillas, nieve, nariz térmica, patas a maíz) — voz ElevenLabs eleven_v4 «Álvaro» (1 toma, ×1,2)
from cues_base import *
MUSIC = dict(seed=61, sections=[('hook', 'Dsus'), ('sweat', 'D'), ('pant', 'Bb'), ('paws', 'Gm'), ('counter', 'Bb'), ('nose', 'F'), ('cold', 'Gm'), ('heat', 'Bb'),
             ('prey', 'Gm'), ('corn', 'C'), ('you', 'Bb'), ('brand', 'END')],
             shimmer=('sweat', 'end'), pulses=[('pant', 'paws', .6), ('heat', 'corn', .5)],
             risers=['sweat', 'paws', 'nose', 'heat', 'corn', 'you', 'brand'],
             hits=[(0.12, .7), ('sweat', .45), ('paws', .5), ('nose', .5), ('cold', .45), ('heat', .5), ('corn', .5), ('brand', .5)])
SFX = [('impact_a', 'hook', 0, .8), ('whoosh_a', 'sweat', -.3, .45), ('whoosh_a', 'paws', -.3, .45), ('impact_a', 'nose', 0, .45),
       ('whoosh_a', 'heat', -.3, .5), ('impact_a', 'corn', 0, .45), ('whoosh_a', 'brand', -.3, .6)]
