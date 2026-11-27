# Maratón · el muro del km 30 — tiempos brutos
K = 1.2
CUES = [
 (0.00, 3.36, "¿Por qué tantos corredores se derrumban\nen el kilómetro 30?"),
 (3.60, 4.96, "Lo llaman el muro."),
 (5.52, 10.32, "Tus músculos guardan glucógeno, el combustible rápido,\npara unos 30 kilómetros."),
 (10.80, 15.60, "Cuando se acaba, el cuerpo tira de grasa,\nque da energía mucho más despacio…"),
 (15.68, 17.60, "y las piernas se vuelven de piedra."),
 (18.08, 20.64, "Por eso los corredores van tomando geles\npor el camino."),
 (21.04, 24.96, "Y no es lo único: en un maratón\ndas unos 40.000 pasos,"),
 (25.00, 28.48, "y en cada uno el suelo te devuelve\nhasta 3 veces tu peso."),
 (28.88, 30.80, "Puedes sudar más de 1 litro por hora."),
 (31.36, 36.88, "¿Y por qué 42 kilómetros y 195 metros,\ncon esos metros tan raros?"),
 (37.12, 42.72, "En los Juegos de Londres de 1908\nalargaron la carrera para que terminara frente al palco real…"),
 (42.76, 44.08, "y se quedó así para siempre."),
 (44.64, 48.64, "El récord: Kelvin Kiptum,\n2 horas y 35 segundos."),
 (49.12, 53.36, "Menos de 3 minutos por kilómetro…\ndurante 42 kilómetros."),
 (53.92, 60.56, "¿Y la leyenda? Un mensajero griego corrió de Maratón a Atenas\npara anunciar la victoria… y cayó muerto."),
 (60.64, 63.52, "Así que si has terminado uno,\nya lo has hecho mejor que él."),
 (65.26, 66.40, "¿NO LO SABÍAS?"),
 (66.48, 68.48, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'wall': 3.6, 'glyco': 5.52, 'fat': 10.8, 'stone': 15.68, 'gels': 18.08, 'steps': 21.04, 'impact': 25, 'sweat': 28.88, 'dist': 31.36, 'london': 37.12, 'stay': 42.76, 'record': 44.64, 'pace': 49.12, 'legend': 53.92, 'you': 60.64, 'brand': 64.98, 'end': 69.5}
MUSIC = dict(seed=71, sections=[('hook','Am'),('fat','F'),('steps','C'),('dist','G'),('record','Am'),('legend','Em'),('brand','END')], shimmer=('hook','end'), pulses=[('hook','fat',.5),('steps','dist',.55),('record','legend',.6)], risers=['wall','fat','steps','dist','record','legend','brand'], hits=[(0.02,.9),('wall',.8),('stone',.6),('impact',.6),('london',.5),('record',.7),('legend',.5),('you',.5),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('lv_thud_a', 'wall', 0, .7),
 ('ab_pulse_a', 'fat', 0, .45, dict(dur='gels', loop=True, fi=.2, fo=.6)),
 ('whoosh_a', 'gels', 0, .4),
 ('gp_tick_a', 'steps', 0, .35, dict(dur='sweat', loop=True, fi=.2, fo=.4)),
 ('impact_b', 'impact', .4, .45),
 ('ac_drip_a', 'sweat', 0, .4),
 ('whoosh_b', 'dist', 0, .4),
 ('crowd', 'london', .2, .35, dict(dur='record', loop=True, fi=.5, fo=.8)),
 ('sting_a', 'record', 0, .4),
 ('pc_wind_a', 'legend', 0, .3, dict(dur='brand', loop=True, fi=.4, fo=.8)),
 ('impact_b', 'brand', 0, .5),
]
