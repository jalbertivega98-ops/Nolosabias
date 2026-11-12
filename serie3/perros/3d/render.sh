#!/bin/bash
# Render por trozos de 150 fotogramas, 3 en paralelo; reanudable (out/c_N.done).
cd ~/work/perros3d; pgrep -f "http.server 8778" >/dev/null || (cd ~/work && nohup python3 -m http.server 8778 --bind 127.0.0.1 >/dev/null 2>&1 &); sleep 1
E=$(python3 -c "import json;print(json.load(open('audio/tl.json'))['end'])"); NF=$(python3 -c "print(round($E*30))"); Q=${Q:-sh=7}
seq 0 150 $((NF-1)) | xargs -P 3 -I{} bash -c 'a={}; [ -f out/c_$a.done ] && exit 0; b=$((a+150)); [ $b -gt '$NF' ] && b='$NF'; node ../lib/render_all.mjs out/c_$a.mp4 "'$Q'" $(python3 -c "print($a/30)") $(python3 -c "print($b/30)") > out/clog_$a.txt 2>&1 && grep -q "^done" out/clog_$a.txt && touch out/c_$a.done'
N=$(ls out/c_*.done | wc -l); echo "chunks done $N / $(seq 0 150 $((NF-1)) | wc -l)"
ls out/c_*.mp4 | sort -t_ -k2 -n | sed "s#out/#file '#; s#\$#'#" > out/list.txt; ffmpeg -y -v error -f concat -safe 0 -i out/list.txt -c copy out/video_noaudio.mp4
echo frames $(ffprobe -v error -count_packets -select_streams v -show_entries stream=nb_read_packets -of csv=p=0 out/video_noaudio.mp4) / $NF
