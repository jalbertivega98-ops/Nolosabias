#!/bin/bash
# Copias ligeras (<100 MB) para Metricool: una pasada con tope de bitrate. Uso desde la carpeta del vídeo: ../lib/ligero.sh NOMBRE
N=$1
for n in $N ${N}_sin_subtitulos; do
  ffmpeg -y -loglevel error -i out/$n.mp4 -c:v libx264 -preset medium -crf 23 -maxrate 2200k -bufsize 4400k -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k out/${n}_ligero.mp4 &
done; wait
ls -la out/*ligero.mp4
