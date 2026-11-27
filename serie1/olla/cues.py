# Olla a presión — tiempos brutos
K = 1.2
CUES = [
 (0.00, 3.12, "¿Por qué en una olla a presión\nla comida se hace tan rápido?"),
 (3.60, 6.24, "Porque el agua no siempre hierve a 100 grados."),
 (6.48, 11.56, "Hierve cuando sus moléculas tienen fuerza para escapar,\nempujando el aire que tienen encima."),
 (11.84, 15.84, "Si cierras la olla, el vapor no puede salir,\nla presión sube…"),
 (15.88, 18.36, "y el agua necesita más energía para hervir."),
 (18.56, 22.12, "Con casi el doble de presión,\nhierve a unos 120 grados."),
 (22.32, 24.88, "Y esos 20 grados de más lo cambian todo:"),
 (24.96, 27.56, "la comida se hace hasta 3 veces más rápido."),
 (27.76, 31.92, "Por eso la válvula silba:\ndeja escapar el vapor justo a la presión correcta."),
 (32.24, 34.72, "Y por eso nunca hay que abrirla en caliente:"),
 (34.77, 38.68, "toda esa agua por encima de 100 grados\nse convertiría en vapor de golpe."),
 (38.88, 43.84, "Y al revés pasa lo mismo:\nen la cima del Everest el agua hierve a unos 70 grados…"),
 (43.88, 46.00, "y un huevo duro tarda una eternidad."),
 (47.42, 48.40, "¿NO LO SABÍAS?"),
 (48.64, 50.96, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'notal': 3.6, 'escape': 6.48, 'close': 11.84, 'energy': 15.88, 'double': 18.56, 'twenty': 22.32, 'three': 24.96, 'valve': 27.76, 'never': 32.24, 'burst': 34.77, 'everest': 38.88, 'egg': 43.88, 'brand': 47.14, 'end': 51.99}
MUSIC = dict(seed=63, sections=[('hook','G'),('escape','Em'),('double','C'),('valve','D'),('everest','G'),('brand','END')], shimmer=('hook','end'), pulses=[('hook','escape',.45),('valve','everest',.55)], risers=['escape','close','double','valve','burst','everest','brand'], hits=[(0.02,.9),('notal',.5),('close',.6),('double',.6),('three',.6),('burst',.8),('everest',.5),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('mk_gurgle_a', 'hook', .2, .35, dict(dur='close', loop=True, fi=.4, fo=.6)),
 ('whoosh_a', 'escape', .2, .4),
 ('as_snap_a', 'close', .3, .45),
 ('gp_tick_a', 'double', .3, .35),
 ('mw_ding_a', 'three', .5, .35),
 ('pc_wind_a', 'valve', .2, .45, dict(dur='never', loop=True, fi=.2, fo=.4)),
 ('sting_a', 'never', 0, .35),
 ('impact_b', 'burst', .8, .55),
 ('whoosh_b', 'burst', .8, .5),
 ('pu_wind_a', 'everest', 0, .35, dict(dur='egg', loop=True, fi=.4, fo=.8)),
 ('impact_b', 'brand', 0, .5),
]
