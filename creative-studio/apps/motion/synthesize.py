"""Original deterministic additive score; standard library only."""
import math, wave, struct
from pathlib import Path
rate=48000; duration=10
out=Path(__file__).parent/'public/aura-score.wav'
with wave.open(str(out),'wb') as w:
 w.setnchannels(2); w.setsampwidth(2); w.setframerate(rate)
 data=bytearray()
 for i in range(rate*duration):
  t=i/rate; fade=max(0,min(1,t/1.4,(duration-t)/1.8))
  pad=sum(math.sin(2*math.pi*hz*t+.12*math.sin(t*.8))/(j+2) for j,hz in enumerate([110,164.8138,220,277.1826,329.6276]))*.115
  tone=0
  for onset,hz in [(.3,440),(2.7,554.365),(5.7,659.255),(7.2,440)]:
   dt=t-onset
   if dt>0: tone+=.105*math.exp(-dt*1.8)*math.sin(2*math.pi*hz*dt)*(1-math.exp(-dt*35))
  val=max(-1,min(1,(pad+tone)*fade))
  data.extend(struct.pack('<hh',int(val*32767),int(val*.96*32767)))
 w.writeframes(data)
print(out)
