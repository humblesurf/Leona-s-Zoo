"""Import specifically reviewed field recordings, keeping provenance and original pitch."""
import json, urllib.request, subprocess, time, sys
from pathlib import Path
import numpy as np
import imageio_ffmpeg
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'geo/assets/calls';RAW=ROOT/'.upgrade-work/audio-v3';RAW.mkdir(exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe()
chosen=json.loads((OUT/'selected-v3.json').read_text(encoding='utf-8'))
manifest=json.loads((OUT/'recordings.json').read_text(encoding='utf-8'))
for id,row in chosen.items():
 if id in manifest:continue
 try:
  raw=RAW/(id+'.audio')
  if not raw.exists():
   req=urllib.request.Request(row['url'],headers={'User-Agent':'Mozilla/5.0 Educational animal project'})
   raw.write_bytes(urllib.request.urlopen(req,timeout=60).read())
  pcm=subprocess.check_output([FF,'-v','error','-i',str(raw),'-t','120','-ac','1','-ar','16000','-f','f32le','pipe:1'])
  a=np.frombuffer(pcm,dtype=np.float32);duration=len(a)/16000;length=min(2.6,duration)
  win=int(length*16000);cs=np.r_[0,np.cumsum(a.astype(np.float64)**2)];points=np.arange(0,max(1,len(a)-win),1600)
  energy=(cs[np.minimum(points+win,len(a))]-cs[points])/win
  start=float(points[np.argmax(energy)]/16000)
  # A reviewed, short excerpt; never speed up, pitch-shift or substitute a different species.
  if 'start' in row:start=row['start']
  subprocess.run([FF,'-y','-v','error','-ss',str(start),'-i',str(raw),'-t',str(length),'-ac','1','-ar','44100','-af',f'loudnorm=I=-23:TP=-5:LRA=7,afade=t=in:d=0.04,afade=t=out:st={max(.05,length-.12)}:d=0.12','-b:a','96k',str(OUT/(id+'.mp3'))],check=True)
  manifest[id]={**row,'path':f'assets/calls/{id}.mp3','duration':round(length,3),'start':round(start,3),'changes':'Short excerpt, mono, gentle loudness normalization and fades; original pitch.'}
  (OUT/'recordings.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
  print('OK',id,round(duration,2),row['license'],flush=True)
 except Exception as e:print('FAILED',id,e,flush=True)
 time.sleep(.5)
print('Total recordings:',len(manifest))
