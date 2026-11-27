# Ajedrez · más partidas que átomos — tiempos brutos
K = 1.2
CUES = [
 (0.00, 3.08, "¿Cuántas partidas de ajedrez distintas\nse pueden jugar?"),
 (3.36, 8.08, "Después de una sola jugada de cada uno,\nya hay 400 posiciones posibles."),
 (8.32, 10.56, "Después de dos, más de 70.000."),
 (10.96, 12.32, "¿Y en una partida entera?"),
 (12.56, 17.20, "El matemático Claude Shannon calculó\nque hay unas 10¹²⁰."),
 (17.32, 19.96, "Un 1 seguido de 120 ceros."),
 (20.16, 25.80, "Para que te hagas una idea: en todo el universo observable\nhay unos 10⁸⁰ átomos."),
 (26.00, 29.44, "Hay muchísimas más partidas de ajedrez\nque átomos en el universo."),
 (29.76, 35.16, "Por eso, en cuanto se sale de la apertura,\ncasi cualquier partida acaba siendo única en la historia."),
 (35.36, 37.84, "Y aun así, las máquinas ya nos ganan:"),
 (37.92, 43.04, "en 1997, Deep Blue\nderrotó al campeón del mundo, Garri Kaspárov."),
 (43.08, 46.72, "Y hoy, un programa en tu móvil\njuega mejor que cualquier humano."),
 (48.38, 49.60, "¿NO LO SABÍAS?"),
 (49.64, 51.76, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'one': 3.36, 'two': 8.32, 'whole': 10.96, 'shannon': 12.56, 'zeros': 17.32, 'atoms': 20.16, 'more': 26, 'unique': 29.76, 'machines': 35.36, 'deep': 37.92, 'phone': 43.08, 'brand': 48.1, 'end': 52.79}
MUSIC = dict(seed=17, sections=[('hook','Am'),('whole','F'),('atoms','C'),('machines','Em'),('phone','Am'),('brand','END')], shimmer=('hook','end'), pulses=[('one','whole',.45),('machines','brand',.55)], risers=['one','whole','atoms','more','machines','brand'], hits=[(0.02,.9),('two',.5),('shannon',.6),('zeros',.5),('more',.8),('deep',.7),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('lv_thud_a', 'hook', 1.2, .35),
 ('gp_tick_a', 'one', .3, .35),
 ('gp_tick_a', 'two', .2, .35),
 ('whoosh_a', 'whole', 0, .45),
 ('mw_ding_a', 'shannon', 1.5, .35),
 ('whoosh_b', 'atoms', 0, .45),
 ('sting_a', 'more', 0, .4),
 ('as_snap_a', 'deep', .3, .4),
 ('lv_thud_a', 'deep', 3.6, .4),
 ('impact_b', 'brand', 0, .5),
]
