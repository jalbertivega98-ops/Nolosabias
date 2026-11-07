# Genera SRT y ASS sincronizados a partir de los tiempos de palabra de la voz (escalados ×1/K).
import sys, json
sys.path.insert(0,'audio'); from cues import CUES
TL=json.load(open('audio/tl.json')); K=TL['K']
def ts(x,sep):
    ms=int(round(x*1000)); return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{sep}{ms%1000:03}"
def tass(x): cs=int(round(x*100)); return f"{cs//360000}:{cs//6000%60:02}:{cs//100%60:02}.{cs%100:02}"
srt=[];ass=[];burn=[]
for i,(a,b,txt) in enumerate(CUES):
    A,B=a/K,b/K+0.1
    if i+1<len(CUES): B=min(B,CUES[i+1][0]/K-0.02)
    srt.append(f"{i+1}\n{ts(A,',')} --> {ts(B,',')}\n{txt}\n")
    line=f"Dialogue: 0,{tass(A)},{tass(B)},Sub,,0,0,0,,{{\\fad(70,70)}}{txt.replace(chr(10),'\\N')}"
    ass.append(line)
    if 'SABÍAS' not in txt and 'más historias' not in txt: burn.append(line)
head="""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Montserrat,50,&H00FFFFFF,&H00FFFFFF,&H66000000,&H80000000,-1,0,0,0,100,100,0.5,0,1,2.2,1.5,2,90,90,640,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open('out/subtitulos.srt','w').write("\n".join(srt))
open('out/subtitulos.ass','w').write(head+"\n".join(ass)+"\n")
open('out/subtitulos_quemados.ass','w').write(head+"\n".join(burn)+"\n")
print(len(srt),'subtítulos')
