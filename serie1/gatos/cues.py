# Gatos · por qué caen de pie — tiempos brutos
K = 1.2
CUES = [
 (0.00, 2.32, "¿Por qué los gatos siempre caen de pie?"),
 (2.64, 6.16, "Durante siglos fue un misterio…\nincluso para los físicos."),
 (6.64, 11.28, "Porque un cuerpo que cae sin nada a lo que agarrarse,\nen teoría, no puede girar solo."),
 (11.84, 13.56, "Pero el gato hace trampa."),
 (13.84, 18.28, "Primero, su oído interno le dice dónde está el suelo\nen una fracción de segundo."),
 (18.56, 23.12, "Luego se dobla por la mitad: gira la parte de delante\ncon las patas recogidas…"),
 (23.15, 24.48, "y después la de atrás."),
 (24.88, 26.88, "Como dos cuerpos que se compensan."),
 (27.20, 33.76, "Su columna es tan flexible que puede retorcerse casi media vuelta,\ny sus clavículas no están unidas a los hombros."),
 (34.00, 36.48, "Todo esto en menos de un tercio de segundo."),
 (37.04, 40.48, "Por eso necesita algo de altura:\ndesde muy bajo no le da tiempo."),
 (40.88, 47.76, "Y lo más loco: un famoso estudio de 1987\nvio que los gatos que caían desde más de 7 pisos"),
 (47.92, 50.48, "se hacían menos daño que los que caían desde 5."),
 (50.96, 54.96, "Al alcanzar su velocidad máxima, se relajan,\nabren las patas…"),
 (55.00, 57.16, "y planean como una ardilla voladora."),
 (57.44, 59.68, "Aun así, poned redes en las ventanas."),
 (61.18, 62.12, "¿NO LO SABÍAS?"),
 (62.32, 64.32, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'myst': 2.64, 'phys': 6.64, 'cheat': 11.84, 'ear': 13.84, 'front': 18.56, 'back': 23.15, 'comp': 24.88, 'spine': 27.2, 'fast': 34.0, 'low': 37.04, 'study': 40.88, 'less': 47.92, 'relax': 50.96, 'glide': 55.0, 'nets': 57.44, 'brand': 60.9, 'end': 65.35}
MUSIC = dict(seed=79, sections=[('hook','Em'),('cheat','C'),('spine','Am'),('study','G'),('relax','Em'),('nets','C'),('brand','END')], shimmer=('hook','end'), pulses=[('cheat','spine',.45),('study','nets',.5)], risers=['myst','cheat','front','spine','study','relax','brand'], hits=[(0.02,.9),('cheat',.6),('front',.5),('back',.6),('fast',.5),('less',.6),('glide',.5),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('whoosh_a', 'hook', .3, .45),
 ('lv_thud_a', 'hook', 1.7, .45),
 ('rs_creak_a', 'myst', 0, .3),
 ('mw_ding_a', 'ear', .3, .35),
 ('whoosh_b', 'front', .8, .45),
 ('whoosh_a', 'back', 0, .45),
 ('as_snap_a', 'spine', .5, .35),
 ('gp_tick_a', 'fast', 0, .4),
 ('pc_wind_a', 'relax', 0, .4, dict(dur='nets', loop=True, fi=.3, fo=.8)),
 ('sting_a', 'less', 0, .35),
 ('impact_b', 'brand', 0, .5),
]
