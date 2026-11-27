# Arcoíris — tiempos brutos
K = 1.2
CUES = [
 (0.00, 2.08, "¿Por qué el arcoíris\nsiempre es curvo?"),
 (2.64, 4.80, "Porque en realidad es un círculo."),
 (5.04, 7.68, "Cada gota de lluvia funciona como un prisma:"),
 (7.76, 11.60, "la luz del sol entra, se dobla,\nrebota en el fondo de la gota"),
 (11.76, 13.36, "y sale separada en colores."),
 (13.84, 17.84, "Pero solo sale con un ángulo concreto:\nunos 42 grados para el rojo"),
 (18.08, 19.72, "y 40 para el violeta."),
 (20.00, 24.72, "Así que solo ves color en las gotas que están\njusto a ese ángulo de la sombra de tu cabeza."),
 (25.20, 27.60, "Y todos esos puntos forman un círculo."),
 (28.16, 30.32, "El suelo corta la mitad de abajo…"),
 (30.36, 32.52, "pero desde un avión se puede ver entero."),
 (32.80, 36.00, "Por eso el sol tiene que estar detrás de ti,\ny bajo:"),
 (36.08, 39.00, "a mediodía en verano\ncasi nunca hay arcoíris."),
 (39.28, 41.84, "Si la luz rebota dos veces dentro de la gota,"),
 (41.92, 45.84, "aparece un segundo arco,\nmás grande y con los colores al revés."),
 (46.08, 51.40, "Y lo más curioso: cada persona ve\nsu propio arcoíris, hecho con gotas distintas."),
 (51.60, 53.07, "Nunca hay dos iguales."),
 (54.24, 55.24, "¿NO LO SABÍAS?"),
 (55.44, 57.68, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'circle': 2.64, 'prism': 5.04, 'enter': 7.76, 'split': 11.76, 'angle': 13.84, 'violet': 18.08, 'shadow': 20, 'ring': 25.2, 'ground': 28.16, 'plane': 30.36, 'behind': 32.8, 'noon': 36.08, 'double': 39.28, 'second': 41.92, 'own': 46.08, 'never': 51.6, 'brand': 53.96, 'end': 58.71}
MUSIC = dict(seed=71, sections=[('hook','G'),('prism','Em'),('shadow','C'),('behind','Am'),('own','G'),('brand','END')], shimmer=('hook','end'), pulses=[('prism','ring',.45),('double','own',.55)], risers=['circle','prism','angle','ring','plane','double','own','brand'], hits=[(0.02,.9),('circle',.6),('split',.5),('ring',.7),('plane',.6),('second',.6),('never',.5),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('ac_drip_a', 'hook', .3, .3),
 ('whoosh_a', 'circle', 0, .45),
 ('ac_drip_a', 'prism', .2, .35),
 ('lz_beam_a', 'enter', .1, .3),
 ('mw_ding_a', 'split', .2, .35),
 ('gp_tick_a', 'angle', 2.6, .35),
 ('gp_tick_a', 'violet', .2, .35),
 ('whoosh_b', 'ring', .1, .45),
 ('impact_b', 'ring', 1.6, .5),
 ('pc_wind_a', 'plane', 0, .3, dict(dur='behind', loop=True, fi=.3, fo=.5)),
 ('sting_a', 'noon', .4, .3),
 ('whoosh_a', 'second', .1, .45),
 ('mw_ding_b', 'own', 1.2, .35),
 ('impact_b', 'brand', 0, .5),
]
