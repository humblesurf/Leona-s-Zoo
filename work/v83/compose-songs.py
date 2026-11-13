"""Three original miniature pieces per instrument, made from the existing licensed samples."""
from pathlib import Path
import json, subprocess
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
FF=Path('C:/Users/XTIA/Projects/harmony-trainer/tools/ffmpeg/ffmpeg-8.1.2-essentials_build/bin/ffmpeg.exe')
DATA=json.loads((ROOT/'v83/data.json').read_text(encoding='utf-8-sig'))
OUT=ROOT/'assets/audio/v83';OUT.mkdir(parents=True,exist_ok=True)
RATE=32000
melodies=[
 [(0,1),(2,1),(4,1),(7,1),(4,1),(2,1),(0,2),(4,1),(5,1),(7,2),(9,1),(7,1),(4,2),(2,1),(4,1),(5,1),(2,1),(0,2),(7,1),(4,1),(2,1),(0,3)],
 [(7,1),(4,1),(5,1),(2,1),(4,2),(0,2),(2,1),(5,1),(9,1),(7,1),(4,2),(2,2),(5,1),(4,1),(2,2),(0,1),(4,1),(7,2),(2,1),(0,3)],
 [(0,1),(4,1),(7,2),(9,1),(7,1),(4,2),(5,1),(9,1),(7,1),(4,1),(2,2),(0,2),(4,1),(2,1),(5,2),(7,1),(4,1),(2,2),(0,4)]
]
names=['晨光小调','叶子舞曲','晚安星星']
manifest={}
for instrument in ['musicpiano','musicdrum','musicxylophone','musicharp','musictambourine','musicmaracas','musicguitar']:
 rec=DATA['recordings'][instrument]
 sample=np.frombuffer(subprocess.check_output([str(FF),'-v','error','-i',str(ROOT/rec['path']),'-f','f32le','-ac','1','-ar',str(RATE),'pipe:1']),dtype='<f4').astype(float)
 manifest[instrument]=[]
 for tune,notes in enumerate(melodies):
  beat=.43 if tune!=1 else .46
  length=sum(n[1] for n in notes)*beat+1.0
  audio=np.zeros(int(length*RATE))
  if instrument in ['musicdrum','musictambourine','musicmaracas']:
   # Three distinct gentle rhythm pieces; percussion keeps its original natural pitch.
   steps=int((length-.8)/beat*2)
   for i in range(steps):
    if (i+tune)%[4,3,5][tune]==[3,2,4][tune]:continue
    at=int(i*beat*.5*RATE);strength=.76 if i%8==0 else .50 if i%2==0 else .27
    if instrument=='musicmaracas':strength*=.9
    n=min(len(sample),len(audio)-at);audio[at:at+n]+=sample[:n]*strength
  else:
   at=0
   for pitch,beats in notes:
    rate=2**(pitch/12)
    indices=np.arange(0,len(sample)-1,rate)
    sound=np.interp(indices,np.arange(len(sample)),sample)
    n=min(len(sound),int((beats*beat+.10)*RATE));sound=sound[:n].copy()
    fade=min(int(.035*RATE),n//3);sound[-fade:]*=np.linspace(1,0,fade)
    start=int(at*RATE);n=min(n,len(audio)-start);audio[start:start+n]+=sound[:n]*(.86 if beats>1 else .72)
    at+=beats*beat
  peak=np.max(np.abs(audio));audio*=.72/max(peak,.01)
  fade=int(.15*RATE);audio[-fade:]*=np.linspace(1,0,fade)
  target=OUT/f'{instrument}-song-{tune+1}.mp3'
  subprocess.run([str(FF),'-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a','libmp3lame','-b:a','96k',str(target)],input=audio.astype('<f4').tobytes(),check=True)
  manifest[instrument].append({'path':target.relative_to(ROOT).as_posix(),'title':names[tune] if instrument not in ['musicdrum','musictambourine','musicmaracas'] else ['小小进行曲','雨点节奏','摇摆游戏'][tune],'duration':round(length,2),'peak':round(float(np.max(np.abs(audio))),3),'rms':round(float(np.sqrt(np.mean(audio**2))),4)})
 print(instrument,[x['duration'] for x in manifest[instrument]])
(OUT/'songs.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'assets/v83-songs.js').write_text('/* Original short arrangements of the existing credited CC0 instrument recordings. */\nwindow.V83_SONGS='+json.dumps(manifest,ensure_ascii=False)+';\n',encoding='utf-8')
