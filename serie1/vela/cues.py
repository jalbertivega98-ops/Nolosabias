# Vela · cómo navega un velero contra el viento — tiempos brutos
K = 1.2
CUES = [
 (0.00, 2.56, "¿Cómo puede un velero avanzar contra el viento?"),
 (2.60, 6.00, "Parece imposible…\npero lo hace cada día."),
 (6.08, 9.92, "El truco: la vela no es una sábana\nque el viento empuja."),
 (10.04, 11.12, "Es un ala."),
 (11.20, 15.28, "El aire que pasa por la cara de fuera va más rápido,\nla presión baja…"),
 (15.32, 19.76, "y la vela es aspirada hacia delante,\nigual que el ala de un avión hacia arriba."),
 (19.80, 23.92, "Esa fuerza también tira de lado,\ny aquí entra la pieza escondida:"),
 (24.00, 28.48, "la orza, una aleta bajo el casco\nque no deja que el barco derrape."),
 (28.60, 31.68, "Entre las dos, el barco sale disparado en diagonal."),
 (31.72, 36.48, "Por eso nunca va recto contra el viento:\nva en zigzag, cambiando de bordo."),
 (36.52, 41.52, "Se llama ceñir, y un buen velero ciñe\na unos 45 grados del viento."),
 (41.56, 46.08, "Y lo más loco: algunos barcos\nvan más rápido que el propio viento."),
 (46.16, 51.36, "Los barcos con hidroalas de la Copa América\nvuelan sobre el agua a casi 100 km/h…"),
 (51.44, 53.28, "con vientos de menos de 40."),
 (54.62, 55.60, "¿NO LO SABÍAS?"),
 (55.84, 58.08, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'imp': 2.6, 'sheet': 6.08, 'wing': 10.04, 'fast': 11.2, 'suck': 15.32, 'side': 19.8, 'keel': 24, 'diag': 28.6, 'zig': 31.72, 'deg': 36.52, 'crazy': 41.56, 'foil': 46.16, 'wind': 51.44, 'brand': 54.34, 'end': 59.11}
MUSIC = dict(seed=91, sections=[('hook','D'),('wing','Bm'),('side','G'),('zig','A'),('crazy','D'),('brand','END')], shimmer=('hook','end'), pulses=[('hook','wing',.45),('crazy','brand',.6)], risers=['wing','side','zig','crazy','brand'], hits=[(0.02,.9),('wing',.6),('keel',.5),('diag',.5),('deg',.5),('foil',.8),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('bc_waves_a', 'hook', 0, .35, dict(dur='crazy', loop=True, fi=.5, fo=1.0)),
 ('pc_wind_a', 'hook', .2, .3, dict(dur='wing', loop=True, fi=.3, fo=.6)),
 ('whoosh_a', 'wing', 0, .45),
 ('pc_wind_b', 'fast', 0, .3),
 ('mw_ding_a', 'keel', .2, .35),
 ('whoosh_b', 'diag', 0, .5),
 ('bc_splash_a', 'zig', .8, .4),
 ('gp_tick_a', 'deg', .6, .35),
 ('sting_a', 'crazy', 0, .35),
 ('bc_splash_b', 'foil', .2, .5),
 ('whoosh_a', 'foil', 1.0, .45),
 ('impact_b', 'brand', 0, .5),
]
