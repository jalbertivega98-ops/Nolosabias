# Volcán · qué hay debajo de un volcán — tiempos brutos (alineación por palabra de ElevenLabs)
K = 1.2
CUES = [
 (0.00, 1.44, "¿Qué hay debajo de un volcán?"),
 (2.00, 5.52, "Roca fundida a más de 1.000 °C: el magma."),
 (5.84, 10.16, "Sube porque pesa menos que la roca que lo rodea,\ncomo una gota de aceite en el agua."),
 (10.64, 14.16, "Y dentro lleva gas disuelto,\ncomo una botella de refresco."),
 (14.40, 15.36, "¿Y por qué explota?"),
 (15.84, 19.52, "Al subir, la presión baja…\ny el gas se escapa de golpe."),
 (20.08, 24.48, "Si el magma es líquido, el gas sale fácil:\nríos de lava, como en La Palma."),
 (24.96, 28.32, "Si es espeso, el gas queda atrapado…\ny revienta."),
 (28.88, 34.16, "La lava suele avanzar despacio, a pocos km/h:\ncasi siempre se puede escapar andando."),
 (34.72, 41.84, "Lo peligroso es la nube ardiente: gas y ceniza\na cientos de grados, bajando a más de 100 km/h."),
 (42.08, 44.32, "¿Y la ceniza? No es ceniza:"),
 (44.44, 47.76, "es roca y cristal triturados,\nque cortan como vidrio."),
 (48.00, 52.68, "Por eso, en 2010, un volcán de Islandia\nparó los aviones de media Europa."),
 (52.96, 57.68, "Y lo más curioso: en la Tierra\nhay unos 1.300 volcanes activos…"),
 (57.72, 61.20, "pero la mayor parte de la actividad volcánica\nocurre bajo el mar."),
 (62.78, 63.60, "¿NO LO SABÍAS?"),
 (64.00, 66.08, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'magma': 2, 'rise': 5.84, 'gas': 10.64, 'why': 14.4, 'press': 15.84, 'fluid': 20.08, 'thick': 24.96, 'slow': 28.88, 'pyro': 34.72, 'ash': 42.08, 'glass': 44.44, 'planes': 48, 'count': 52.96, 'sea': 57.72, 'brand': 62.5, 'end': 66.4}
MUSIC = dict(seed=47, sections=[('hook','Am'),('why','F'),('slow','C'),('ash','G'),('count','Em'),('brand','END')], shimmer=('hook','end'), pulses=[('why','slow',.5),('pyro','ash',.6)], risers=['why','thick','pyro','ash','count','brand'], hits=[(0.02,.9),('magma',.5),('press',.6),('thick',.8),('pyro',.7),('planes',.5),('sea',.5),('brand',.5)])
SFX = [
 ('rs_quake_a', 'hook', 0, .6, dict(dur=2.5, fo=1.0)),
 ('impact_a', 'hook', 0, .6),
 ('nv_boil_a', 'magma', 0, .35, dict(dur='gas', loop=True, fi=.4, fo=.8)),
 ('ab_hiss_a', 'gas', .3, .35),
 ('bt_fizz_a', 'press', .8, .5),
 ('lv_thud_a', 'fluid', .3, .45),
 ('impact_b', 'thick', 1.6, .8),
 ('rs_quake_a', 'thick', 1.6, .5, dict(dur=2.0, fo=1.0)),
 ('pc_wind_b', 'pyro', 0, .45, dict(dur='ash', loop=True, fi=.3, fo=.6)),
 ('mg_pass_a', 'planes', .4, .35),
 ('sonar_a', 'sea', .2, .3),
 ('impact_b', 'brand', 0, .5),
]
