# Golf — tiempos brutos
K = 1.2
CUES = [
 (0.00, 2.68, "¿Por qué las pelotas de golf\ntienen agujeros?"),
 (2.96, 5.92, "Porque una pelota lisa\nvolaría más o menos la mitad."),
 (6.40, 10.48, "Al avanzar, el aire se pega a la pelota\nen una capa muy fina…"),
 (10.52, 12.96, "y en una pelota lisa se despega muy pronto,"),
 (13.04, 15.76, "dejando detrás un remolino enorme que la frena."),
 (16.32, 19.84, "Los hoyuelos agitan esa capa,\nla vuelven turbulenta,"),
 (19.88, 22.52, "y así el aire se queda pegado más tiempo."),
 (22.80, 25.12, "La estela se hace mucho más pequeña…"),
 (25.16, 27.44, "y la resistencia cae casi a la mitad."),
 (28.00, 30.80, "Además, el palo le da un giro hacia atrás:"),
 (30.84, 34.64, "la pelota desvía el aire hacia abajo,\ny el aire la empuja hacia arriba."),
 (35.04, 36.64, "Por eso sube y planea."),
 (37.20, 40.28, "Suele tener entre 300\ny 500 hoyuelos."),
 (40.48, 43.20, "Y lo más curioso:\nse descubrió por accidente."),
 (43.68, 48.40, "En el siglo XIX, los golfistas notaron\nque las pelotas viejas, llenas de golpes,"),
 (48.48, 50.27, "volaban más lejos que las nuevas."),
 (52.00, 53.00, "¿NO LO SABÍAS?"),
 (53.20, 55.52, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'half': 2.96, 'layer': 6.4, 'early': 10.52, 'wake': 13.04, 'dimples': 16.32, 'stick': 19.88, 'small': 22.8, 'drag': 25.16, 'spin': 28, 'down': 30.84, 'glide': 35.04, 'count': 37.2, 'accident': 40.48, 'old': 43.68, 'farther': 48.48, 'brand': 51.72, 'end': 56.55}
MUSIC = dict(seed=77, sections=[('hook','C'),('layer','Am'),('dimples','F'),('spin','G'),('accident','C'),('brand','END')], shimmer=('hook','end'), pulses=[('layer','drag',.45),('spin','count',.55)], risers=['half','layer','dimples','small','spin','glide','accident','brand'], hits=[(0.02,.9),('half',.6),('wake',.6),('dimples',.6),('drag',.6),('glide',.6),('farther',.6),('brand',.5)])
SFX = [
 ('cr_snap_a', 'hook', 0, .7),
 ('whoosh_a', 'hook', .05, .5),
 ('whoosh_b', 'half', .3, .45),
 ('pc_wind_a', 'layer', 0, .35, dict(dur='drag', loop=True, fi=.4, fo=.6)),
 ('sting_a', 'early', .8, .35),
 ('impact_b', 'wake', .4, .45),
 ('mw_ding_a', 'stick', .4, .35),
 ('gp_tick_a', 'drag', .8, .35),
 ('whoosh_a', 'spin', .2, .45),
 ('pu_wind_a', 'down', 0, .3, dict(dur='glide', loop=True, fi=.3, fo=.5)),
 ('whoosh_b', 'glide', 0, .45),
 ('gp_tick_a', 'count', 1, .35),
 ('mw_ding_b', 'accident', 1.2, .35),
 ('cr_snap_a', 'old', 3.5, .5),
 ('impact_a', 'farther', .3, .5),
 ('impact_b', 'brand', 0, .5),
]
