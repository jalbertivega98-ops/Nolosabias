# Ciclismo · secretos del ciclismo — tiempos brutos (alineación por palabra de ElevenLabs)
K = 1.2
CUES = [
 (0.00, 2.24, "¿Por qué los ciclistas van siempre pegados?"),
 (2.72, 6.72, "Porque a más de 30 km/h,\ncasi el 90 % de su esfuerzo"),
 (6.80, 8.00, "se va en apartar el aire."),
 (8.48, 11.52, "A rueda de otro ahorras hasta un 30 %…"),
 (11.56, 15.24, "y en mitad del pelotón, hasta un 90 %:\ncasi van de paseo."),
 (15.52, 18.96, "Por eso los de delante se relevan cada poco:\nson los que más sufren."),
 (19.52, 21.28, "¿Y por qué se depilan las piernas?"),
 (21.44, 24.88, "Por las caídas: las heridas\nse limpian y se curan mejor."),
 (25.12, 30.24, "Aunque en el túnel de viento, unas piernas depiladas\nahorran más de un minuto en 40 km."),
 (30.48, 32.00, "¿Cuánto comen en el Tour?"),
 (32.08, 35.52, "Hasta 8.000 calorías al día: lo de tres personas…"),
 (35.56, 37.12, "y buena parte, pedaleando."),
 (37.52, 38.24, "¿Y su corazón?"),
 (38.64, 43.04, "Miguel Induráin tenía 28 pulsaciones en reposo;\ntú, unas 70."),
 (43.44, 48.08, "En un esprint, un profesional suelta casi 2.000 vatios,\ncomo un secador a tope."),
 (48.32, 51.20, "Y en las bajadas pasan de 100 km/h…"),
 (51.24, 53.44, "sobre neumáticos del ancho de un pulgar."),
 (55.23, 56.00, "¿NO LO SABÍAS?"),
 (56.40, 58.56, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'aero': 2.72, 'air': 6.8, 'wheel': 8.48, 'pelo': 11.56, 'relay': 15.52, 'shave': 19.52, 'crash': 21.44, 'tunnel': 25.12, 'food': 30.48, 'kcal': 32.08, 'ride': 35.56, 'heart': 37.52, 'indu': 38.64, 'sprint': 43.44, 'descent': 48.32, 'tyre': 51.24, 'brand': 55.0, 'end': 58.9}
MUSIC = dict(seed=43, sections=[('hook','Em'),('wheel','C'),('shave','G'),('food','D'),('heart','Am'),('sprint','Em'),('brand','END')], shimmer=('hook','end'), pulses=[('hook','shave',.45),('sprint','brand',.6)], risers=['wheel','shave','food','heart','sprint','brand'], hits=[(0.02,.9),('pelo',.6),('tunnel',.5),('kcal',.5),('indu',.6),('sprint',.8),('descent',.5),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .7),
 ('pc_wind_a', 'aero', 0, .45, dict(dur='pelo', loop=True, fi=.3, fo=.6)),
 ('whoosh_a', 'wheel', 0, .45),
 ('whoosh_b', 'relay', .2, .4),
 ('lv_thud_a', 'crash', 0, .5),
 ('pc_wind_b', 'tunnel', 0, .35, dict(dur='food', loop=True, fi=.3, fo=.5)),
 ('gp_tick_a', 'kcal', .2, .25),
 ('ab_pulse_a', 'indu', 0, .45),
 ('oj_zap_a', 'sprint', .4, .35),
 ('whoosh_a', 'descent', 0, .55),
 ('pu_wind_a', 'descent', .2, .35, dict(dur='brand', loop=True, fi=.2, fo=.6)),
 ('impact_b', 'brand', 0, .5),
]
