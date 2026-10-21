from pathlib import Path
import concurrent.futures,json,subprocess
import numpy as np,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1];FF=imageio_ffmpeg.get_ffmpeg_exe()
voices=sorted((ROOT/'geo/assets/voice/v4-9').glob('*.mp3'))
assert len(voices)==369,len(voices)
files=voices+list((ROOT/'geo/assets/audio/v4-9').glob('*.mp3'))+list((ROOT/'geo/assets/calls/v4-9').glob('*.mp3'))
def check(p):
 raw=subprocess.check_output([FF,'-v','error','-i',str(p),'-ac','1','-ar','16000','-f','f32le','pipe:1'])
 a=np.frombuffer(raw,dtype=np.float32);duration=len(a)/16000
 assert duration>.15 and np.isfinite(a).all(),p
 rms=float(np.sqrt(np.mean(a*a)));assert rms>.001,p
 return {'path':str(p.relative_to(ROOT/'geo')).replace('\\','/'),'duration':round(duration,3),'rms':round(rms,4),'peak':round(float(np.max(np.abs(a))),4)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(check,files))
(ROOT/'geo/assets/audio/v4-9/validation.json').write_text(json.dumps({'voices':369,'files':rows,'errors':[]},indent=2),encoding='utf8')
print({'voices':369,'totalDecoded':len(rows),'errors':[]})
