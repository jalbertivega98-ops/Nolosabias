#!/bin/bash
# Montaje final de un vídeo de la serie (desde su carpeta): audio voz-primero, máster -14 LUFS, subtítulos y MP4s.
set -e
L=$(dirname "$0"); NAME=$1
python3 $L/audio.py all
END=$(python3 -c "import json;print(json.load(open('audio/tl.json'))['end']-0.8)")
$L/master.sh audio/build/premix.wav audio/build/mix.wav $END
ffmpeg -y -loglevel error -i out/video_noaudio.mp4 -i audio/build/mix.wav -vf "subtitles=out/subtitulos_quemados.ass:fontsdir=assets/fonts" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 256k -shortest out/$NAME.mp4 &
ffmpeg -y -loglevel error -i out/video_noaudio.mp4 -i audio/build/mix.wav -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 256k -shortest out/${NAME}_sin_subtitulos.mp4
wait
for n in $NAME ${NAME}_sin_subtitulos; do
  ffmpeg -y -loglevel error -i out/$n.mp4 -c:v libx264 -b:v 1800k -preset slow -pass 1 -passlogfile /tmp/p_$n -an -f mp4 /dev/null && ffmpeg -y -loglevel error -i out/$n.mp4 -c:v libx264 -b:v 1800k -preset slow -pass 2 -passlogfile /tmp/p_$n -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k out/${n}_ligero.mp4 &
done; wait
ls -la out/*.mp4
