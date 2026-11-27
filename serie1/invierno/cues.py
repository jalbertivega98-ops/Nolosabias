# Invierno · ¿por qué hace frío si estamos más cerca del Sol? — tiempos brutos
K = 1.2
CUES = [
 (0.00, 3.76, "En invierno, la Tierra está más cerca del Sol\nque en verano."),
 (3.88, 6.16, "Entonces, ¿por qué hace frío?"),
 (6.20, 11.12, "A principios de enero estamos a unos 5 millones\nde kilómetros menos que en julio…"),
 (11.20, 13.12, "pero eso apenas cambia nada."),
 (13.16, 18.96, "Lo que manda es la inclinación:\nla Tierra va torcida, unos 23,5 grados."),
 (19.00, 21.76, "En invierno, nuestro hemisferio mira hacia fuera:"),
 (21.84, 26.96, "los rayos llegan tumbados, y la misma luz\nse reparte en un suelo mucho más grande."),
 (27.04, 28.72, "Haz la prueba con una linterna:"),
 (28.76, 30.88, "de frente, un círculo brillante;"),
 (30.96, 33.56, "inclinada, una mancha larga y floja."),
 (33.84, 35.92, "Además, el día es más corto:"),
 (36.00, 39.68, "en Madrid, el 21 de diciembre\nhay unas 9 horas de luz;"),
 (39.76, 41.68, "en junio, más de 15."),
 (41.76, 44.32, "Menos horas, y cada rayo calienta menos."),
 (44.56, 48.64, "Mientras tanto, en Australia es verano:\ncelebran la Navidad en la playa."),
 (49.04, 53.04, "Y lo más curioso:\nel día más frío no es el más corto."),
 (53.08, 58.56, "El suelo y el mar tardan semanas en enfriarse,\npor eso el frío de verdad llega en enero."),
 (60.05, 61.08, "¿NO LO SABÍAS?"),
 (61.28, 63.52, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'why': 3.88, 'dist': 6.2, 'nothing': 11.2, 'tilt': 13.16, 'away': 19, 'rays': 21.84, 'torch': 27.04, 'front': 28.76, 'tilted': 30.96, 'short': 33.84, 'madrid': 36, 'june': 39.76, 'less': 41.76, 'aus': 44.56, 'lag': 49.04, 'weeks': 53.08, 'brand': 59.77, 'end': 64.55}
MUSIC = dict(seed=67, sections=[('hook','Am'),('tilt','F'),('torch','C'),('short','Am'),('aus','G'),('lag','Em'),('brand','END')], shimmer=('hook','end'), pulses=[('hook','tilt',.4),('short','lag',.5)], risers=['why','tilt','torch','short','aus','lag','brand'], hits=[(0.02,.9),('nothing',.5),('tilt',.6),('rays',.5),('tilted',.5),('madrid',.5),('aus',.6),('weeks',.6),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('pc_wind_a', 'hook', 0, .3, dict(dur='tilt', loop=True, fo=.8)),
 ('whoosh_a', 'dist', 0, .45),
 ('whoosh_b', 'tilt', .2, .45),
 ('lz_beam_a', 'rays', 0, .35),
 ('gp_tick_a', 'torch', 0, .4),
 ('lz_beam_a', 'front', 0, .35),
 ('whoosh_a', 'short', 0, .4),
 ('bc_waves_a', 'aus', 0, .35, dict(dur='lag', loop=True, fi=.3, fo=.8)),
 ('pc_wind_b', 'lag', 0, .35, dict(dur='brand', loop=True, fi=.3, fo=.8)),
 ('impact_b', 'brand', 0, .5),
]
