"""Original procedural test audio, no external samples. Not a NOISOME release.
Run from project root: python tools/generate-audio.py
"""
import math,wave,struct,random
from pathlib import Path
random.seed(7)
sr=22050;duration=24;out=[]
for i in range(sr*duration):
 t=i/sr;beat=t%(60/88);bar=int(t/(60/88*4));freq=[110,130.813,98,146.832][bar%4]
 kick=math.sin(2*math.pi*(48*beat+10*(1-math.exp(-beat*25))))*math.exp(-beat*18)*.26
 pad=sum(math.sin(2*math.pi*f*t) for f in [freq,freq*1.5,freq*2])/3*.13*(.6+.4*math.sin(t*.8)**2)
 hat=(random.random()*2-1)*math.exp(-(t%(60/176))*90)*.035
 lead=math.sin(2*math.pi*[440,523.25,659.25,587.33,392,523.25,440,329.63][int(t*88/60)%8]*t)*math.exp(-beat*5)*.07
 fade=min(1,t/1.5,(duration-t)/2);out.append(struct.pack('<h',int(max(-1,min(1,(kick+pad+hat+lead)*fade))*32767)))
with wave.open(str(Path('assets/estudio-senal.wav')),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(b''.join(out))
