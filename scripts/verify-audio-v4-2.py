"""Decode the active audio inventory, including narration, calls and ambience."""
import json,subprocess,concurrent.futures
from pathlib import Path
import numpy as np,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1];FF=imageio_ffmpeg.get_ffmpeg_exe()
files=json.loads((ROOT/'geo/assets/audit-v4-2.json').read_text(encoding='utf8'))['audioFiles']
def check(name):
 p=ROOT/'geo'/name
 proc=subprocess.run([FF,'-v','error','-i',str(p),'-ac','1','-ar','16000','-f','f32le','pipe:1'],capture_output=True)
 a=np.frombuffer(proc.stdout,dtype=np.float32);duration=len(a)/16000;peak=float(np.max(np.abs(a))) if len(a) else 0;rms=float(np.sqrt(np.mean(a*a))) if len(a) else 0
 return {'file':name,'duration':round(duration,3),'peak':round(peak,4),'rms':round(rms,4),'ok':bool(proc.returncode==0 and duration>(1 if '/voice/' in name else .25) and peak>.01 and rms>.0001 and not proc.stderr),'error':proc.stderr.decode('utf8','replace')[:150]}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(check,files))
bad=[r for r in rows if not r['ok']];(ROOT/'geo/assets/audio/validation-v4-2.json').write_text(json.dumps(rows,indent=2),encoding='utf8');print('Decoded',len(rows),'active files; failures',bad)
if bad:raise RuntimeError('Invalid active audio')
