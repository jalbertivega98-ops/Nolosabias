# Everest · la zona de la muerte — tiempos brutos
K = 1.2
CUES = [
 (0.00, 4.00, "¿Por qué a más de 8.000 metros\nlo llaman la zona de la muerte?"),
 (4.40, 8.24, "En la cima del Everest el aire tiene\nel mismo oxígeno que aquí abajo:"),
 (8.32, 9.60, "un 21 %."),
 (10.08, 14.00, "El problema es la presión: es 3 veces más baja,"),
 (14.04, 17.52, "y en cada respiración\nte entra solo un tercio del oxígeno."),
 (17.84, 22.16, "Allí arriba tu cuerpo se va apagando poco a poco,\naunque estés quieto."),
 (22.20, 23.52, "La sangre se espesa,"),
 (23.60, 26.56, "los pulmones y el cerebro\npueden llenarse de líquido…"),
 (26.60, 29.04, "y pensar cuesta\ncomo si estuvieras borracho."),
 (29.60, 32.00, "Por eso los alpinistas suben despacio:"),
 (32.08, 36.88, "semanas subiendo y bajando entre campamentos\npara que el cuerpo fabrique más glóbulos rojos."),
 (37.28, 39.52, "Y casi todos usan oxígeno embotellado."),
 (40.00, 40.68, "Casi."),
 (40.96, 46.32, "En 1978, Reinhold Messner\ny Peter Habeler llegaron a la cima sin él…"),
 (46.36, 49.28, "cuando muchos médicos decían que era imposible."),
 (49.32, 55.20, "Y lo más curioso: los sherpas tienen adaptaciones genéticas\npara aprovechar mejor el poco oxígeno."),
 (55.25, 57.33, "Llevan miles de años viviendo allí arriba."),
 (58.84, 60.08, "¿NO LO SABÍAS?"),
 (60.16, 62.16, "El mundo tiene más historias."),
]
MARKS = {'hook': 0, 'same': 4.4, 'pct': 8.32, 'press': 10.08, 'third': 14.04, 'die': 17.84, 'blood': 22.2, 'fluid': 23.6, 'drunk': 26.6, 'slow': 29.6, 'camps': 32.08, 'tank': 37.28, 'almost': 40, 'messner': 40.96, 'doctors': 46.36, 'sherpa': 49.32, 'live': 55.25, 'brand': 58.56, 'end': 63.19}
MUSIC = dict(seed=37, sections=[('hook','Em'),('press','C'),('die','Am'),('slow','G'),('almost','Em'),('sherpa','C'),('brand','END')], shimmer=('hook','end'), pulses=[('die','slow',.45),('messner','sherpa',.5)], risers=['press','die','slow','messner','sherpa','brand'], hits=[(0.02,.9),('pct',.5),('third',.6),('blood',.5),('almost',.7),('messner',.6),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .6),
 ('pu_wind_a', 'hook', 0, .4, dict(dur='press', loop=True, fi=.4, fo=.8)),
 ('mw_ding_a', 'pct', 0, .35),
 ('whoosh_a', 'press', 0, .45),
 ('gp_tick_a', 'third', .4, .35),
 ('lv_thud_a', 'die', .2, .45),
 ('lv_thud_a', 'die', 1.0, .4),
 ('rs_creak_a', 'blood', 0, .3),
 ('whoosh_b', 'slow', 0, .4),
 ('pc_wind_a', 'camps', 0, .3, dict(dur='tank', loop=True, fi=.3, fo=.6)),
 ('sting_a', 'almost', 0, .4),
 ('impact_b', 'messner', 0, .45),
 ('pu_wind_a', 'messner', .3, .3, dict(dur='sherpa', loop=True, fi=.4, fo=.8)),
 ('mw_ding_a', 'sherpa', .4, .3),
 ('impact_b', 'brand', 0, .5),
]
