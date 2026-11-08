# Vídeo 19 · Airbag — tiempos brutos de la toma A (alineación por palabra de Scribe)
K = 1.2
CUES = [
 (0.21, 3.52, "Un airbag se infla en menos tiempo\ndel que tardas en parpadear."),
 (3.75, 5.24, "¿Cómo lo hace tan rápido?"),
 (5.52, 8.80, "Cuando el coche choca,\nun sensor nota el frenazo brusco:"),
 (8.88, 11.68, "una pieza diminuta dentro\nde un chip se desplaza,"),
 (11.76, 14.72, "y la electrónica decide en\nunas milésimas de segundo."),
 (14.96, 17.32, "Entonces enciende\nun pequeño detonador."),
 (17.60, 20.00, "Dentro hay una pastilla química\nque arde de golpe"),
 (20.08, 23.36, "y suelta muchísimo gas,\nsobre todo nitrógeno…"),
 (23.40, 25.08, "el mismo que respiras en el aire."),
 (25.36, 27.84, "La bolsa se llena en unos\ntreinta milisegundos,"),
 (27.88, 29.92, "a más de doscientos\nkilómetros por hora."),
 (30.40, 33.76, "Pero lo importante no es inflarse:\nes desinflarse."),
 (34.16, 37.52, "La bolsa tiene agujeros, y cuando\ntu cuerpo choca contra ella,"),
 (37.60, 40.96, "el gas escapa y te frena poco a poco,\nen vez de de golpe."),
 (41.34, 45.72, "Y lo más curioso: un parpadeo dura\nunos ciento cincuenta milisegundos."),
 (45.92, 47.84, "Cuando terminas de cerrar los ojos…"),
 (47.92, 51.04, "el airbag ya se ha inflado\ny ha empezado a desinflarse."),
 (51.58, 52.56, "¿NO LO SABÍAS?"),
 (52.80, 54.80, "El mundo tiene más historias."),
]
MARKS = dict(hook=0.0, how=3.75, crash=5.52, sensor=6.68, mass=8.88, decide=11.76, det=14.96, pellet=17.6, gas=20.08, n2=21.92, air=23.4,
             fill=25.36, speed=27.88, but=30.4, deflate=32.4, holes=34.16, body=35.68, escape=37.6, curious=41.34, blink=43.0,
             close=45.92, done=47.92, brand=51.58, end=54.8)
MUSIC = dict(seed=193, sections=[('hook', 'D'), ('how', 'Bb'), ('crash', 'D'), ('decide', 'Gm'), ('det', 'A'), ('gas', 'D'), ('fill', 'Bb'),
             ('but', 'F'), ('holes', 'Gm'), ('curious', 'D'), ('done', 'Bb'), ('brand', 'END')],
             shimmer=('how', 'end'), pulses=[('crash', 'det', .5)],
             risers=['how', 'det', 'but', 'curious', 'brand'],
             hits=[(0.02, .9), ('crash', .7), ('det', .6), ('fill', .7), ('deflate', .5), ('blink', .5), ('done', .6), ('brand', .5)])
SFX = [
 ('impact_a', 'hook', 0, .8),
 ('ab_crash_a', 'crash', 0, .8),
 ('impact_b', 'mass', .1, .35),
 ('ab_pop_a', 'det', .9, .7),
 ('ab_pop_a', 'fill', 0, .5),
 ('ab_hiss_a', 'escape', .2, .55),
 ('ab_hiss_a', 'escape', 1.1, .4),
 ('whoosh_a', 'curious', -.2, .45),
 ('ab_pop_a', 'done', 0, .5),
 ('whoosh_a', 'brand', -.3, .6),
]
