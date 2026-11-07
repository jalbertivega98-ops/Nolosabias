#!/bin/bash
# Mezcla de audio y montaje final (ejecutar desde la raíz del proyecto)
set -e
python3 audio/music.py "$(cat audio/tl.json)" audio/build/music.wav
python3 audio/mix.py
ffmpeg -y -loglevel error -i audio/build/premix.wav -af "loudnorm=I=-14:TP=-1:LRA=11,afade=t=out:st=$(python3 -c "import json;print(json.load(open('audio/tl.json'))['end']-0.8)"):d=0.8" -ar 48000 audio/build/mix.wav
python3 audio/subs.py
ffmpeg -y -loglevel error -i out/video_noaudio.mp4 -i audio/build/mix.wav -vf "subtitles=out/subtitulos_quemados.ass:fontsdir=assets/fonts" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 256k -shortest out/nolosabias_submarino.mp4
ffmpeg -y -loglevel error -i out/video_noaudio.mp4 -i audio/build/mix.wav -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 256k -shortest out/nolosabias_submarino_sin_subtitulos.mp4
