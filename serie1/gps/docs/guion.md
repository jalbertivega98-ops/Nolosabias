# ¿Cómo sabe el GPS dónde estás? — Guion de narración

**Formato:** Reel/TikTok vertical 9:16 · 1080×1920 · 30 fps · 86,1 s
**Voz:** ElevenLabs eleven_v4, voz «Álvaro». Montaje acelerado ×1,2 sin cambiar el tono. Voz siempre por delante: música y efectos se agachan bajo la voz; máster a −14 LUFS.
**Referencia:** Constelación GPS (31 satélites operativos en 6 planos orbitales a 55°, órbita a ~20.200 km de altura). Satélite y móvil genéricos, sin marcas. Escena en kilómetros reales.
**Estructura:** curiosidad encadenada. Cada respuesta abre la pregunta siguiente.

## Narración con tiempos

| Tiempo (s) | Narración |
|---|---|
| 0,1–3,1 | Ahora mismo, más de treinta satélites están emitiendo la hora. |
| 3,5–5,3 | Y con eso, tu móvil sabe dónde estás. |
| 5,7–6,2 | ¿Cómo? |
| 6,4–9,3 | Cada satélite GPS da una vuelta a la Tierra cada doce horas, |
| 9,4–11,0 | a 20.000 kilómetros de altura. |
| 11,2–15,1 | Y lleva dentro relojes atómicos, precisos hasta la milmillonésima de segundo. |
| 15,3–17,1 | Cada uno emite sin parar un mensaje: |
| 17,3–20,6 | «soy este satélite, estoy aquí y son exactamente las tal». |
| 20,9–23,9 | Ese mensaje viaja a la velocidad de la luz, pero aun así tarda: |
| 24,0–26,1 | unas siete centésimas de segundo en llegar. |
| 26,1–28,3 | Tu móvil compara la hora del mensaje con la suya… |
| 28,4–30,9 | y ese retraso le dice a qué distancia está el satélite. |
| 31,1–34,2 | Con un satélite, sabes que estás en algún punto de una esfera gigante. |
| 34,3–35,6 | Con dos, en un círculo. |
| 35,8–37,5 | Con tres, en un solo punto. |
| 37,7–38,5 | ¿Y para qué el cuarto? |
| 38,8–40,3 | Porque el reloj de tu móvil es malo. |
| 40,7–43,7 | Un error de una millonésima de segundo son 300 metros. |
| 43,9–47,2 | El cuarto satélite permite calcular también la hora exacta… y corregirla. |
| 47,6–50,2 | Pero hay un problema que nadie esperaba: Einstein. |
| 50,6–52,9 | Los satélites van a 14.000 km/h, |
| 53,0–55,4 | y la relatividad dice que, al moverse tan rápido, |
| 55,4–58,7 | su tiempo pasa más despacio: 7 microsegundos menos al día. |
| 59,0–60,8 | Pero allí arriba la gravedad es más débil, |
| 60,8–63,0 | y eso hace que su tiempo corra más deprisa: |
| 63,0–64,8 | 45 microsegundos más. |
| 65,0–68,5 | Resultado: sus relojes adelantan 38 microsegundos cada día. |
| 68,8–72,7 | Por eso, antes del lanzamiento, los ajustan para que en tierra vayan un poco lentos. |
| 73,0–76,9 | Sin esa corrección, el GPS se equivocaría unos 10 kilómetros más cada día. |
| 77,1–78,7 | Cada vez que usas el mapa del móvil… |
| 78,7–80,7 | estás comprobando que Einstein tenía razón. |
| 81,7–82,5 | ¿NO LO SABÍAS? |
| 82,7–84,5 | El mundo tiene más historias. |

## Visual por escenas

1. Gancho: la Tierra rodeada de más de 30 satélites que emiten pulsos; zoom al punto «TÚ» y líneas a cuatro satélites.
2. La órbita de un satélite: «12 HORAS», «20.200 km» con la regla hasta la superficie.
3. Rayos X del satélite: los relojes atómicos; «ERROR 0,000000001 s».
4. El mensaje que emite sin parar, escrito en pantalla: satélite, posición y hora exacta.
5. El pulso de luz viaja hasta la Tierra: contador «0,067 s»; dos relojes comparan la hora del mensaje y la del móvil → «20.200 km».
6. Trilateración: una esfera, la intersección de dos (un círculo) y tres esferas que se cruzan en un solo punto.
7. El reloj malo del móvil: el punto azul del mapa se desplaza «1 µs = 300 m»; el cuarto satélite lo corrige.
8. Einstein: el satélite a 14.000 km/h (−7 µs/día) y la gravedad más débil (+45 µs/día) en dos barras.
9. Resultado +38 µs/día; ajuste de fábrica de 10,23 MHz a 10,22999999543 MHz.
10. Sin corrección, el punto del mapa se va 10 km más lejos cada día; «EINSTEIN TENÍA RAZÓN».
11. Cierre con el logotipo.

## Fuentes de los datos

- GPS.gov (US Space Force): 31 satélites operativos (2024–2026), 6 planos orbitales, inclinación 55°, altura ≈ 20.200 km, periodo ≈ 11 h 58 min.
- Relojes atómicos de rubidio y cesio a bordo; estabilidad del orden de 10⁻¹³–10⁻¹⁴ (nanosegundos por día).
- Distancia = velocidad de la luz × retraso; 20.200 km / 299.792 km/s ≈ 0,067 s. 1 µs × c ≈ 300 m.
- Se necesitan cuatro satélites: tres coordenadas de posición más el error del reloj del receptor.
- N. Ashby, «Relativity in the Global Positioning System», Living Reviews in Relativity (2003): −7,2 µs/día por velocidad, +45,7 µs/día por gravedad, neto ≈ +38 µs/día; oscilador ajustado a 10,22999999543 MHz.
- Sin corrección, 38 µs/día × c ≈ 11 km de error acumulado por día.
