"""Decode every new narration and retained V4 animal recording."""
import json,subprocess,concurrent.futures,sys
from pathlib import Path
import numpy as np
import imageio_ffmpeg
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[1];FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
files=sorted((ROOT/'geo/assets/voice/v4-1').glob('*.mp3'))+sorted((ROOT/'geo/assets/calls').glob('*.mp3'))
def check(p):
    proc=subprocess.run([FFMPEG,'-v','error','-i',str(p),'-ac','1','-ar','16000','-f','f32le','pipe:1'],capture_output=True)
    a=np.frombuffer(proc.stdout,dtype=np.float32);duration=len(a)/16000
    peak=float(np.max(np.abs(a))) if len(a) else 0;rms=float(np.sqrt(np.mean(a*a))) if len(a) else 0
    valid=proc.returncode==0 and duration>(.25 if p.parent.name=='calls' else 1) and peak>.01 and rms>.0001 and not proc.stderr
    return {'file':str(p.relative_to(ROOT)).replace('\\','/'),'duration':round(duration,3),'peak':round(peak,4),'rms':round(rms,4),'ok':bool(valid),'error':proc.stderr.decode('utf-8','replace')[:150]}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(check,files))
bad=[r for r in rows if not r['ok']]
assert len([p for p in files if 'voice' in p.parts])==495
(ROOT/'geo/assets/audio/validation-v4-1.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print('Decoded',len(rows),'files. Failures:',bad)
if bad:raise RuntimeError('Invalid audio assets')
