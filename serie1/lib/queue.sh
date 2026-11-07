#!/bin/bash
# Cola de render: renderiza en 3 partes, une, comprueba fotogramas, monta (build.sh) y entrega (deliver.sh), proyecto a proyecto.
# Uso: nohup ~/work/lib/queue.sh nombre1 nombre2 ... > ~/work/queue.log 2>&1 &
# Marca cada proyecto terminado en ~/work/queue_done.txt
cd ~/work
for N in "$@"; do
  cd ~/work/$N || continue
  echo "== $N $(date -u +%H:%M)"
  busy() { for p in $(pgrep -f render_all.mjs); do readlink /proc/$p/cwd | grep -q "/$N\$" && return 0; done; return 1; }
  while busy; do sleep 20; done
  END=$(python3 -c "import json;print(json.load(open('audio/tl.json'))['end'])")
  EXP=$(python3 -c "print(round($END*30))")
  HAVE=$( [ -f out/video_noaudio.mp4 ] && ffprobe -v error -count_packets -select_streams v -show_entries stream=nb_read_packets -of csv=p=0 out/video_noaudio.mp4 || echo 0)
  if [ "$HAVE" != "$EXP" ]; then
    if ! ls out/p_*.mp4 >/dev/null 2>&1 || [ "$(grep -l '^done' out/log_*.txt 2>/dev/null | wc -l)" != "3" ]; then
      rm -f out/p_*.mp4 out/log_*.txt
      A=$(python3 -c "print(round($END/3,2))"); B=$(python3 -c "print(round(2*$END/3,2))")
      node ../lib/render_all.mjs out/p_0.mp4 "" 0 $A > out/log_0.txt 2>&1 &
      node ../lib/render_all.mjs out/p_1.mp4 "" $A $B > out/log_1.txt 2>&1 &
      node ../lib/render_all.mjs out/p_2.mp4 "" $B "" > out/log_2.txt 2>&1 &
      wait
    fi
    ls out/p_*.mp4 | sort -V | sed "s#out/#file '#; s#\$#'#" > out/list.txt
    ffmpeg -y -v error -f concat -safe 0 -i out/list.txt -c copy out/video_noaudio.mp4
    HAVE=$(ffprobe -v error -count_packets -select_streams v -show_entries stream=nb_read_packets -of csv=p=0 out/video_noaudio.mp4)
  fi
  echo "$N frames $HAVE / $EXP"
  if [ "$HAVE" != "$EXP" ]; then echo "$N FRAME MISMATCH" >> ~/work/queue_done.txt; continue; fi
  nice -n 5 ../lib/build.sh nolosabias_$N | tail -3
  LU=$(ffmpeg -hide_banner -i out/nolosabias_$N.mp4 -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated" | awk '{print $3}')
  ../lib/deliver.sh $N > /dev/null
  echo "$N OK $LU LUFS $(date -u +%H:%M)" >> ~/work/queue_done.txt
done
echo "== queue end $(date -u +%H:%M)"
