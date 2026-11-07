#!/bin/bash
# Uso: ../lib/pv.sh nombre t1,t2,...  → preview/nombre.jpg (hoja de contactos)
set -e; N=$1; T=$2; timeout 900 node ../lib/shot.mjs $T "$3" 2>&1 | grep -v "^[0-9.]* [0-9]* ms$" | grep -v favicon || true
python3 ../lib/sheet.py preview/$N.jpg $(echo $T | tr , '\n' | sed 's#^#preview/t#; s#$#.jpg#')
