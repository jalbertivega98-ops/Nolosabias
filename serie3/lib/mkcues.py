# Genera CUES a partir de frases.txt + marcas/finales (tiempos de la toma original). Uso: import y llamada.
import re, textwrap
def make(frases, marks, ends, maxc=58):
    out = []
    for i, (k, s) in enumerate(frases):
        a, b = marks[k], ends[i]
        parts = [p.strip() for p in re.split(r'(?<=[,:;.])\s+', s) if p.strip()]
        chunks = []; cur = ''
        for p in parts:
            if cur and len(cur) + 1 + len(p) > maxc: chunks.append(cur); cur = p
            else: cur = (cur + ' ' + p).strip()
        if cur: chunks.append(cur)
        tot = sum(len(c) for c in chunks); t = a
        for c in chunks:
            d = (b - a) * len(c) / tot
            out.append((round(t, 2), round(t + d - .05, 2), '\n'.join(textwrap.wrap(c, 32))))
            t += d
    return out
