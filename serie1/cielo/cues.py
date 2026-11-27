# Cielo · por qué el cielo es azul — tiempos brutos (alineación por palabra de ElevenLabs)
K = 1.2
CUES = [
 (0.00, 1.44, "¿Por qué el cielo es azul?"),
 (2.00, 6.08, "La luz del sol parece blanca,\npero lleva todos los colores mezclados."),
 (6.48, 11.12, "Al chocar con las moléculas del aire,\nla luz azul rebota mucho más que la roja:"),
 (11.28, 12.48, "unas cinco veces más."),
 (12.96, 16.80, "Así que, mires donde mires,\nte llega azul desde todas partes."),
 (17.20, 20.56, "¿Y por qué no es violeta,\nsi el violeta rebota todavía más?"),
 (20.80, 23.12, "Porque el sol emite menos violeta…"),
 (23.16, 25.76, "y tus ojos son mucho más sensibles al azul."),
 (26.00, 26.88, "¿Y el atardecer?"),
 (27.28, 31.12, "Cuando el sol está bajo,\nsu luz cruza hasta 40 veces más aire."),
 (31.52, 34.08, "Por el camino pierde casi todo el azul…"),
 (34.12, 36.68, "y solo te llegan los naranjas y los rojos."),
 (36.88, 39.08, "¿Y las nubes, por qué son blancas?"),
 (39.28, 43.12, "Sus gotas son miles de veces más grandes\nque las moléculas del aire,"),
 (43.16, 45.28, "y rebotan todos los colores por igual."),
 (45.68, 47.28, "Todos juntos: blanco."),
 (47.68, 51.84, "Y cuando son tan gruesas que la luz\nno las atraviesa, se vuelven grises."),
 (52.08, 52.92, "¿Y en Marte?"),
 (53.12, 57.68, "Allí es al revés: de día, el cielo es\nde color caramelo por el polvo…"),
 (57.72, 59.63, "y los atardeceres son azules."),
 (61.36, 62.36, "¿NO LO SABÍAS?"),
 (62.56, 64.80, "El mundo tiene más historias."),
]
MARKS = {'hook': 0.0, 'white': 2.0, 'hit': 6.48, 'five': 11.28, 'every': 12.96, 'violet': 17.2, 'sunv': 20.8, 'eyes': 23.16, 'sunset': 26.0, 'low': 27.28, 'lose': 31.52, 'red': 34.12, 'clouds': 36.88, 'drops': 39.28, 'all': 43.16, 'whiteall': 45.68, 'grey': 47.68, 'mars': 52.08, 'reverse': 53.12, 'blue': 57.72, 'brand': 61.2, 'end': 65.2}
MUSIC = dict(seed=57, sections=[('hook','D'),('violet','Bm'),('sunset','G'),('clouds','Em'),('mars','F#m'),('brand','END')], shimmer=('hook','end'), pulses=[('sunset','clouds',.4)], risers=['violet','sunset','clouds','mars','brand'], hits=[(0.02,.8),('hit',.5),('five',.5),('eyes',.5),('red',.6),('whiteall',.6),('grey',.4),('blue',.7),('brand',.5)])
SFX = [
 ('impact_a', 'hook', 0, .7),
 ('pu_wind_a', 'hook', 0, .2, dict(dur='sunset', loop=True, fo=.6)),
 ('whoosh_a', 'white', .2, .45),
 ('lz_beam_a', 'hit', 0, .3),
 ('as_snap_a', 'five', 0, .35),
 ('whoosh_b', 'every', 0, .4),
 ('oj_zap_a', 'eyes', .2, .3),
 ('whoosh_a', 'low', .3, .4),
 ('impact_b', 'red', 0, .45),
 ('pc_wind_b', 'clouds', 0, .3, dict(dur='mars', loop=True, fi=.4, fo=.6)),
 ('lv_thud_a', 'grey', .4, .4),
 ('rs_quake_a', 'mars', 0, .25, dict(dur=2.0, fo=.8)),
 ('impact_b', 'blue', .2, .5),
 ('whoosh_a', 'brand', -.3, .6),
]
