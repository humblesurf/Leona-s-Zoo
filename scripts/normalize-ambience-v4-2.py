from pathlib import Path
import json,subprocess,hashlib
import numpy as np,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'geo/assets/audio/v4-2';OUT.mkdir(parents=True,exist_ok=True)
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe();rows=[]
for id in ['savanna','rainforest','ocean','polar']:
 source=ROOT/f'geo/assets/audio/{id}.mp3';raw=subprocess.check_output([FFMPEG,'-v','error','-i',str(source),'-ac','1','-ar','24000','-f','f32le','pipe:1']);a=np.frombuffer(raw,dtype=np.float32);rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)));gain=min(.08/rms,.70/peak);duration=len(a)/24000
 dest=OUT/f'{id}.mp3';subprocess.run([FFMPEG,'-v','error','-y','-i',str(source),'-af',f'volume={gain},afade=t=in:d=0.12,afade=t=out:st={duration-.12}:d=0.12','-codec:a','libmp3lame','-b:a','128k',str(dest)],check=True)
 rows.append({'id':id,'source':str(source.relative_to(ROOT)).replace('\\','/'),'output':str(dest.relative_to(ROOT)).replace('\\','/'),'sourceRms':rms,'gain':gain,'estimatedRms':rms*gain,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest()})
 print(id,'gain',round(gain,2),'RMS',round(rms*gain,4))
(OUT/'normalization.json').write_text(json.dumps(rows,indent=2),encoding='utf8')
p=ROOT/'geo/assets/game-data.js';text=p.read_text(encoding='utf8')
for id in ['savanna','rainforest','ocean','polar']:text=text.replace(f'assets/audio/{id}.mp3',f'assets/audio/v4-2/{id}.mp3')
p.write_text(text,encoding='utf8')
