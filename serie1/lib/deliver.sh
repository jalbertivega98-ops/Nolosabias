#!/bin/bash
# Entrega: ../lib/deliver.sh nombre  (desde ~/work/nombre, tras build.sh)
set -e; N=$1; D=/mnt/project-files/nolosabias-$N/; R=/home/claude/nolosabias/serie1/$N
mkdir -p $D $R/docs
cp out/nolosabias_${N}.mp4 out/nolosabias_${N}_sin_subtitulos.mp4 out/nolosabias_${N}_ligero.mp4 out/nolosabias_${N}_sin_subtitulos_ligero.mp4 out/portada.png out/subtitulos.srt docs/guion.md docs/publicacion.md $D
(cd .. && rm -f /tmp/f_$N.zip && zip -qr /tmp/f_$N.zip $N/render/index.html $N/render/main.js $N/audio/cues.py $N/docs lib -x 'lib/__pycache__/*') && cp /tmp/f_$N.zip $D/fuentes_nolosabias_$N.zip
cp audio/cues.py render/main.js out/portada.png out/subtitulos.srt $R/ && cp docs/*.md $R/docs/
ls -la $D
