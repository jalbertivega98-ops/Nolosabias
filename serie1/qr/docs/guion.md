# ¿Cómo funciona un código QR? — Guion de narración

**Formato:** Reel/TikTok vertical 9:16 · 1080×1920 · 30 fps · 58,9 s
**Voz:** ElevenLabs eleven_v4, voz «Álvaro». Montaje acelerado ×1,2 sin cambiar el tono. Voz siempre por delante: música y efectos se agachan bajo la voz; máster a −14 LUFS.
**Referencia:** Código QR real (versión 5, nivel de corrección H) generado con la librería segno a partir del texto «NO LO SABIAS - El mundo tiene mas historias»; módulos en 3D sobre una tarjeta. CD y fábrica genéricos.
**Estructura:** curiosidad encadenada. Cada respuesta abre la pregunta siguiente.

## Narración con tiempos

| Tiempo (s) | Narración |
|---|---|
| 0,1–2,7 | A este código le puede faltar casi un tercio… |
| 2,8–3,9 | y aun así funciona. |
| 4,3–5,5 | ¿Cómo lo lee tu móvil? |
| 5,6–7,8 | Primero busca los tres cuadrados de las esquinas. |
| 7,9–11,1 | Siempre son iguales, y sus franjas siguen una proporción única: |
| 11,1–13,7 | 1 : 1 : 3 : 1 : 1 |
| 13,7–15,5 | Casi nunca aparece por casualidad. |
| 15,5–17,6 | Con ellos, el móvil sabe dónde está el código, |
| 17,7–20,1 | cuánto está girado y desde qué ángulo lo miras. |
| 20,1–22,0 | Luego divide el resto en una cuadrícula: |
| 22,0–25,0 | cada cuadradito negro es un 1, y cada blanco, un 0. |
| 25,1–27,1 | Agrupados de ocho en ocho, forman letras: |
| 27,2–29,3 | una web, un menú, un pago. |
| 29,7–31,5 | ¿Y si una parte está rota o manchada? |
| 31,7–34,7 | El código añade información de sobra, calculada con matemáticas: |
| 34,8–37,8 | la corrección de errores Reed-Solomon, la misma que usaban los CD. |
| 38,1–41,5 | Con ella, el móvil puede reconstruir hasta un 30 % que falte. |
| 41,6–44,3 | Por eso hay códigos con un logo en medio… y siguen funcionando. |
| 44,7–47,9 | Y lo más curioso: el QR lo inventó en 1994 |
| 48,1–51,8 | una empresa japonesa de piezas de coche, para seguir los recambios en sus fábricas. |
| 51,8–54,1 | Y decidió no cobrar a nadie por usarlo. |
| 54,5–55,5 | ¿NO LO SABÍAS? |
| 55,5–57,3 | El mundo tiene más historias. |

## Visual por escenas

1. Gancho: se arranca la esquina inferior derecha de un QR (casi un tercio); el visor del móvil lo escanea igual y aparece un ✓.
2. Los tres cuadrados de posición se elevan y se marcan en cobre; zoom a uno con la línea de escaneo y las franjas 1 : 1 : 3 : 1 : 1.
3. El código gira y se inclina; líneas verdes unen los tres patrones y un contador muestra el giro.
4. Cuadrícula sobre el código; zoom con unos y ceros sobre cada módulo; ocho módulos en fila forman un byte → una letra; el texto se escribe.
5. Una mancha borra módulos; los datos de corrección se tiñen de cobre; un CD gira («la misma que usaban los CD»); los módulos que faltaban reaparecen: «HASTA 30 %».
6. Un logo cae en el centro del código y el móvil lo sigue leyendo (✓).
7. Fábrica con cajas de recambios etiquetadas con QR en una cinta: «1994 · JAPÓN» y «GRATIS».
8. Cierre con el logotipo NO LO SABÍAS.

## Fuentes de los datos

- Especificación QR (ISO/IEC 18004): los patrones de posición tienen franjas en proporción 1:1:3:1:1 y permiten localizar el código y corregir giro y perspectiva.
- Niveles de corrección de errores L, M, Q, H: el nivel H permite recuperar alrededor de un 30 % de los datos (Denso Wave, qrcode.com).
- Corrección de errores Reed-Solomon (Reed y Solomon, 1960), usada también en CD, DVD y comunicaciones espaciales.
- Inventado en 1994 por Masahiro Hara en Denso Wave (grupo Toyota) para el seguimiento de piezas; la empresa decidió no ejercer sus derechos de patente (Denso Wave).
