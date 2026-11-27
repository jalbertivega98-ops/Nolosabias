# Apnea · cuánto aguanta un humano sin respirar — tiempos brutos (alineación por palabra de ElevenLabs)
K = 1.2
CUES = [
 (0.00, 1.84, "¿Cuánto aguanta un humano sin respirar?"),
 (2.32, 4.52, "El récord pasa de 11 minutos."),
 (4.72, 8.16, "¿Cómo es posible? Porque llevas\nun interruptor escondido:"),
 (8.24, 9.60, "el reflejo de inmersión."),
 (10.00, 13.36, "Basta mojarte la cara con agua fría\ny tu corazón frena solo."),
 (13.76, 17.44, "En los mejores apneístas baja a menos\nde 30 latidos por minuto."),
 (17.84, 19.92, "¿Y esas ganas desesperadas de respirar?"),
 (20.32, 24.48, "No avisan de que falta oxígeno:\navisan de que sobra dióxido de carbono."),
 (24.80, 26.36, "Por eso se puede entrenar."),
 (26.56, 28.72, "Al bajar, el agua aprieta:"),
 (28.76, 31.20, "a 10 metros, tus pulmones\nya ocupan la mitad."),
 (31.52, 33.28, "A 100 m, una décima parte."),
 (33.44, 36.96, "Para que no se aplasten,\nla sangre se mueve al pecho y los rellena."),
 (37.12, 40.00, "Y a partir de unos 20 metros\npasa algo mágico:"),
 (40.08, 43.44, "dejas de flotar… y caes solo,\nsin mover un dedo."),
 (43.76, 47.44, "Además, el bazo se encoge\ny suelta glóbulos rojos de reserva,"),
 (47.52, 49.52, "como una botella de oxígeno de repuesto."),
 (49.68, 55.44, "Hay un pueblo del sudeste asiático, los bajau,\nque lo lleva en los genes: su bazo es más grande."),
 (55.60, 59.52, "Los mejores bajan a más de 130 metros\ncon una sola bocanada."),
 (59.68, 62.96, "Pero la regla número uno:\nnunca bucees solo."),
 (64.38, 65.32, "¿NO LO SABÍAS?"),
 (65.52, 67.92, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'record': 2.32, 'how': 4.72, 'reflex': 8.24, 'face': 10, 'bpm': 13.76, 'urge': 17.84, 'co2': 20.32, 'train': 24.8, 'press': 26.56, 'ten': 28.76, 'hund': 31.52, 'shift': 33.44, 'sink': 37.12, 'fall': 40.08, 'spleen': 43.76, 'tank': 47.52, 'bajau': 49.68, 'deep': 55.6, 'rule': 59.68, 'brand': 64.1, 'end': 68.95}
MUSIC = dict(seed=61, sections=[('hook','Em'),('urge','Am'),('press','Em'),('sink','G'),('bajau','Bm'),('rule','Em'),('brand','END')], shimmer=('hook','end'), pulses=[('reflex','urge',.4),('sink','rule',.5)], risers=['how','urge','press','sink','bajau','brand'], hits=[(0.02,.9),('record',.6),('reflex',.6),('co2',.5),('hund',.6),('fall',.6),('deep',.7),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('pr_water_a', 'hook', 0, .3, dict(dur='face', loop=True, fo=.8)),
 ('ab_pulse_a', 'face', 1.6, .55, dict(dur='urge', loop=True, fi=.2, fo=.6)),
 ('bc_splash_a', 'face', .3, .4),
 ('whoosh_a', 'press', 0, .45),
 ('mk_gurgle_a', 'press', .2, .35),
 ('sonar_a', 'hund', 0, .3),
 ('whoosh_b', 'fall', 0, .45),
 ('pr_water_a', 'sink', 0, .25, dict(dur='bajau', loop=True, fi=.5, fo=.8)),
 ('bc_waves_a', 'bajau', 0, .3, dict(dur='deep', loop=True, fi=.5, fo=.8)),
 ('sonar_a', 'deep', .3, .3),
 ('impact_b', 'brand', 0, .5),
]
