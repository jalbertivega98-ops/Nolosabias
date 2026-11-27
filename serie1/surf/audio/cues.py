# Surf · secretos de las olas — tiempos brutos (alineación por palabra de ElevenLabs)
K = 1.2
CUES = [
 (0.00, 1.60, "¿Sabes de dónde viene una ola?"),
 (2.16, 5.28, "Muchas nacen en tormentas\na miles de kilómetros:"),
 (5.36, 10.20, "el viento empuja el agua, y esa energía\nviaja durante días por el océano."),
 (10.48, 12.48, "Pero el agua no viaja con ella:"),
 (12.52, 14.96, "cada gota solo da vueltas en círculo…"),
 (15.04, 16.56, "y la ola pasa de largo."),
 (17.04, 17.92, "¿Y por qué rompe?"),
 (18.32, 21.12, "Cuando el fondo sube,\nla base de la ola frena…"),
 (21.16, 24.04, "pero la cresta sigue,\nse adelanta y se cae."),
 (24.32, 27.36, "Rompe cuando la profundidad\nes poco más que su altura."),
 (27.60, 29.36, "¿Y por qué llegan por series?"),
 (29.40, 33.20, "Porque viajan mezcladas olas\nde ritmos ligeramente distintos:"),
 (33.24, 35.76, "cuando coinciden, se suman y crecen;"),
 (35.80, 37.20, "cuando no, se anulan."),
 (37.60, 39.28, "¿Y cómo vuelve el agua al mar?"),
 (39.32, 42.60, "Por corrientes de retorno,\ncanales que tiran mar adentro."),
 (42.80, 44.96, "Los surfistas las usan para salir…"),
 (45.00, 48.88, "y si te atrapa una, no luches:\nnada en paralelo a la orilla."),
 (49.12, 53.68, "Por cierto, la cera de la tabla\nno es para deslizar: es para no resbalarte."),
 (53.92, 55.72, "¿Y la ola más grande surfeada?"),
 (55.92, 58.64, "26 metros, en Nazaré, Portugal,"),
 (58.72, 63.87, "donde un cañón submarino de casi 5 km\nde profundidad las convierte en gigantes."),
 (65.44, 66.44, "¿NO LO SABÍAS?"),
 (66.64, 68.88, "El mundo tiene más historias."),
]
MARKS = {'hook': 0.0, 'storm': 2.16, 'wind': 5.36, 'water': 10.48, 'circle': 12.52, 'pass': 15.04, 'why': 17.04, 'floor': 18.32, 'crest': 21.16, 'depth': 24.32, 'sets': 27.6, 'mix': 29.4, 'sum': 33.24, 'cancel': 35.8, 'back': 37.6, 'rip': 39.32, 'use': 42.8, 'swim': 45.0, 'wax': 49.12, 'big': 53.92, 'naz': 55.92, 'canyon': 58.72, 'brand': 65.3, 'end': 69.2}
MUSIC = dict(seed=37, sections=[('hook','D'),('why','G'),('sets','Bm'),('back','Em'),('big','A'),('brand','END')], shimmer=('hook','end'), pulses=[('big','brand',.5)], risers=['why','sets','back','big','brand'], hits=[(0.02,.9),('circle',.5),('crest',.6),('sum',.6),('rip',.5),('wax',.4),('naz',.8),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .7),
 ('bc_waves_a', 'hook', 0, .35, dict(dur='sets', loop=True, fo=.8)),
 ('pc_wind_b', 'storm', 0, .4, dict(dur='water', loop=True, fi=.3, fo=.6)),
 ('whoosh_a', 'pass', 0, .45),
 ('bc_splash_b', 'crest', 1.5, .6),
 ('whoosh_b', 'sum', 0, .45),
 ('bc_waves_a', 'back', 0, .3, dict(dur='big', loop=True, fi=.5, fo=.8)),
 ('mk_gurgle_a', 'rip', .2, .35),
 ('gp_tick_a', 'wax', .3, .25),
 ('rs_quake_a', 'naz', 0, .45, dict(dur=3.0, fo=1.0)),
 ('bc_splash_a', 'naz', .8, .7),
 ('whoosh_a', 'brand', -.3, .6),
]
