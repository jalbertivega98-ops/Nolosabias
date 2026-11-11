# Genera la narración del vídeo "parapente 2" con la voz gratuita de Microsoft Edge (es-ES-AlvaroNeural).
# Uso:  pip install edge-tts   y luego   python edge_voz.py
# Crea una carpeta edge_parapente2 con un mp3 por frase, a dos velocidades (+10 % y +20 %).
import asyncio, os, edge_tts
LINEAS = [
 "Más de quinientos kilómetros.",
 "En parapente. Sin motor. En un solo día.",
 "Casi como ir de Madrid a Barcelona… volando.",
 "¿Cómo, si un parapente siempre baja?",
 "Saltando de una corriente de aire que sube a otra.",
 "Cuando el viento choca contra una ladera, no tiene otra salida: sube.",
 "Es la dinámica. Con ella puedes pasar horas sobre la misma montaña.",
 "Pero para viajar necesitas térmicas: burbujas de aire caliente que despegan del suelo.",
 "Subes girando dentro… y arriba sales disparado hacia la siguiente.",
 "¿Y cómo vas más rápido?",
 "Con el acelerador: una barra que empujas con los pies.",
 "Baja el borde de delante, el ala ataca el aire más plana… y pasas de treinta y ocho a más de cincuenta kilómetros por hora.",
 "Pero cuanto más rápido vas, más deprisa bajas.",
 "Así que en cada tramo decides: correr, o flotar.",
 "Y el mejor aliado es el viento a favor.",
 "Si sopla a treinta kilómetros por hora, cada planeo te regala treinta más.",
 "Y cuando el viento pone las nubes en fila…",
 "aparecen las calles de nubes: kilómetros de aire que sube, en línea recta.",
 "Ahí se vuela sin girar.",
 "Así se baten los récords en Brasil: más de diez horas en el aire, de la mañana al atardecer.",
 "¿Y tú? ¿Cuál ha sido tu vuelo más largo? Cuéntanoslo en comentarios.",
 "¿No lo sabías?",
 "El mundo tiene más historias.",
]
VOZ = "es-ES-AlvaroNeural"
async def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "edge_parapente2")
    os.makedirs(out, exist_ok=True)
    for rate in ["+10%", "+20%"]:
        tag = rate.strip("+%")
        for i, t in enumerate(LINEAS, 1):
            f = os.path.join(out, f"r{tag}_{i:02d}.mp3")
            await edge_tts.Communicate(t, VOZ, rate=rate).save(f)
            print("ok", f)
asyncio.run(main())
