from pathlib import Path
import sys,subprocess,json
sys.path.insert(0,'C:/Users/XTIA/.cache/codex-audio-v411')
import numpy as np,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'geo/assets/calls/v4-11';FF=imageio_ffmpeg.get_ffmpeg_exe();RATE=24000
source=OUT/'source/deer.mp3'
raw=subprocess.check_output([FF,'-v','error','-i',str(source),'-f','f32le','-ac','1','-ar',str(RATE),'pipe:1'])
x=np.frombuffer(raw,dtype='<f4');length=int(2.6*RATE)
# Keep a short audible call excerpt without changing its pitch.
starts=range(int(.1*RATE),max(int(.1*RATE)+1,len(x)-length),int(.1*RATE))
start=max(starts,key=lambda p:float(np.mean(x[p:p+length]**2)));y=x[start:start+length].copy()
y*=min(2.5,.42/max(float(np.max(np.abs(y))),1e-9));fade=int(.025*RATE);y[:fade]*=np.linspace(0,1,fade);y[-int(.065*RATE):]*=np.linspace(1,0,int(.065*RATE))
target=OUT/'deer.wav';subprocess.run([FF,'-y','-v','error','-f','f32le','-ac','1','-ar',str(RATE),'-i','pipe:0','-c:a','pcm_s16le',str(target)],input=y.astype('<f4').tobytes(),check=True)
record={'id':'gazelle','title':'Deer Meewing 01.wav','author':'msantoro11','source':'https://freesound.org/people/msantoro11/sounds/351113/','download':'https://cdn.freesound.org/previews/351/351113_4790684-hq.mp3','license':'CC0 1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','type':'recording','description':'The creator recorded the calls of a group of deer at a nature park. This replaces the historical gazelle recording for the character now named Deer.','path':'assets/calls/v4-11/deer.wav','extractStart':start/RATE,'duration':len(y)/RATE,'rms':float(np.sqrt(np.mean(y*y))),'peak':float(np.max(np.abs(y))),'modifications':'One complete 2.6-second call excerpt; mono, gentle amplitude adjustment and 25ms/65ms fades. Original pitch unchanged.'}
(OUT/'recordings.json').write_text(json.dumps([record],ensure_ascii=False,indent=2),encoding='utf8');print(record)
