# Kitesurf · los secretos del kitesurf — tiempos brutos (alineación por palabra de ElevenLabs)
K = 1.2
CUES = [
 (0.00, 2.88, "¿Cómo puede una cometa arrastrarte sobre el agua?"),
 (3.12, 7.28, "Porque no es una cometa: es un ala,\ncomo la de un avión, pero de lado."),
 (7.68, 10.64, "El viento la empuja… y además la aspira."),
 (10.88, 12.44, "¿Y por qué la mueven sin parar?"),
 (12.64, 16.48, "Porque al cruzar el cielo, la cometa\nva más rápido que el propio viento…"),
 (16.52, 18.00, "y su fuerza se multiplica."),
 (18.48, 20.48, "Lo llaman la ventana de viento:"),
 (20.52, 24.00, "en el centro tira con todo;\nen los bordes, casi nada."),
 (24.24, 26.96, "¿Y cómo vuelven a la playa\nsi el viento sopla hacia fuera?"),
 (27.36, 32.08, "La tabla clava el canto como la quilla de un velero…\ny puede avanzar casi contra el viento."),
 (32.64, 38.64, "Las líneas miden unos 25 metros:\nallí arriba el viento es más limpio y más fuerte que en la orilla."),
 (38.88, 39.68, "¿Y los saltos?"),
 (40.08, 44.48, "Los mejores pasan de 30 metros de altura,\ncomo un edificio de 10 plantas…"),
 (44.52, 45.92, "y bajan planeando."),
 (46.16, 47.00, "¿Y en España?"),
 (47.20, 53.81, "Tarifa: el Estrecho encajona el viento entre dos continentes\ny lo convierte en uno de los sitios con más viento de Europa."),
 (55.28, 56.20, "¿NO LO SABÍAS?"),
 (56.40, 58.64, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'wing': 3.12, 'lift': 7.68, 'why': 10.88, 'fast': 12.64, 'mult': 16.52, 'window': 18.48, 'zones': 20.52, 'back': 24.24, 'edge': 27.36, 'lines': 32.64, 'jump': 38.88, 'high': 40.08, 'glide': 44.52, 'spain': 46.16, 'tarifa': 47.2, 'brand': 55.0, 'end': 58.95}
MUSIC = dict(seed=53, sections=[('hook','D'),('why','Bm'),('back','G'),('jump','A'),('spain','D'),('brand','END')], shimmer=('hook','end'), pulses=[('hook','why',.45),('jump','brand',.6)], risers=['why','window','back','jump','spain','brand'], hits=[(0.02,.9),('lift',.5),('mult',.6),('zones',.5),('edge',.5),('high',.8),('tarifa',.6),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('bc_waves_a', 'hook', 0, .3, dict(dur='why', loop=True, fo=.8)),
 ('pc_wind_a', 'hook', 0, .35, dict(dur='back', loop=True, fi=.2, fo=.8)),
 ('whoosh_a', 'fast', .2, .5),
 ('whoosh_b', 'mult', 0, .45),
 ('bc_splash_a', 'edge', .4, .45),
 ('bc_waves_a', 'back', 0, .3, dict(dur='jump', loop=True, fi=.5, fo=.8)),
 ('whoosh_a', 'high', 0, .55),
 ('bc_splash_b', 'glide', .9, .6),
 ('pc_wind_b', 'tarifa', 0, .4, dict(dur='brand', loop=True, fi=.3, fo=.8)),
 ('impact_b', 'brand', 0, .5),
]
