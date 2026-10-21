from pathlib import Path
import json,re,html,urllib.request,urllib.parse,subprocess
import numpy as np,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'geo/assets/audio/v4-8';OUT.mkdir(parents=True,exist_ok=True)
RAW=OUT/'source';RAW.mkdir(exist_ok=True);FF=imageio_ffmpeg.get_ffmpeg_exe();RATE=24000
def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=60) as r:return r.read()
rows=[]
for id,number,title,author in [('harbor','2573','Gulls on the Harbor','Joseph SARDIN'),('camp','2714','Forest and stream #2','Pierre SIBANARCO')]:
 url='https://bigsoundbank.com/'+('gulls-on-the-harbor' if id=='harbor' else 'forest-and-stream-2')+'-s'+number+'.html'
 text=fetch(url).decode('utf8');links=re.findall(r'["\']([^"\']+\.mp3(?:\?[^"\']*)?)["\']',text)
 if not links:raise RuntimeError('No public recording link: '+url)
 download=urllib.parse.urljoin(url,html.unescape(links[0]));source=RAW/(id+'.mp3')
 if not source.exists():source.write_bytes(fetch(download))
 raw=subprocess.check_output([FF,'-v','error','-ss','12','-i',str(source),'-t','36','-ac','1','-ar',str(RATE),'-f','f32le','pipe:1']);a=np.frombuffer(raw,dtype=np.float32)
 rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)));gain=min(.075/rms,.58/peak)
 subprocess.run([FF,'-v','error','-y','-ss','12','-i',str(source),'-t','36','-af',f'volume={gain},afade=t=in:d=0.18,afade=t=out:st=35.82:d=0.18','-codec:a','libmp3lame','-b:a','128k',str(OUT/(id+'.mp3'))],check=True)
 rows.append({'id':id,'path':'assets/audio/v4-8/'+id+'.mp3','title':title,'author':author,'source':url,'download':download,'license':'CC0 1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','duration':36,'modifications':'36 second excerpt; gentle volume normalization and fades; original pitch','rms':rms*gain})
 print('Prepared',id,flush=True)
# Original soft musical underscore. This is music, not a fictional sound of vacuum.
duration=40;t=np.arange(duration*RATE,dtype=np.float64)/RATE
pad=np.zeros_like(t)
for i,f in enumerate([130.8128,196.0,261.6256,329.6276,392.0]):
 pad+=(np.sin(2*np.pi*f*t+.07*np.sin(2*np.pi*t/duration))+.18*np.sin(2*np.pi*f*2*t))*(.010+.003*np.sin(2*np.pi*t/duration+i))
for start,note in [(2,523.251),(10,659.255),(18,587.330),(26,783.991),(34,659.255)]:
 q=t-start;envelope=np.where(q>=0,np.exp(-np.maximum(0,q)/2.8)*(1-np.exp(-np.maximum(0,q)*4)),0)
 pad+=.024*envelope*np.sin(2*np.pi*note*t)
pad*=np.minimum(1,t/.3)*np.minimum(1,(duration-t)/.3)
subprocess.run([FF,'-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-codec:a','libmp3lame','-b:a','128k',str(OUT/'space.mp3')],input=pad.astype(np.float32).tobytes(),check=True)
rows.append({'id':'space','path':'assets/audio/v4-8/space.mp3','title':'Original quiet exploration music','author':'Project-authored procedural musical score','license':'Project original','duration':duration,'description':'Soft musical underscore; never presented as physical space ambience.','rms':float(np.sqrt(np.mean(pad*pad)))})
call=ROOT/'geo/assets/calls/v4-8/campstream.mp3';call.parent.mkdir(parents=True,exist_ok=True)
subprocess.run([FF,'-v','error','-y','-ss','4','-i',str(OUT/'camp.mp3'),'-t','2.5','-af','volume=1.2,afade=t=in:d=0.08,afade=t=out:st=2.35:d=0.15','-codec:a','libmp3lame','-b:a','128k',str(call)],check=True)
rows.append({'id':'campstream','path':'assets/calls/v4-8/campstream.mp3','duration':2.5,'title':'Forest stream excerpt','source':rows[1]['source'],'author':rows[1]['author'],'license':'CC0 1.0','licenseUrl':rows[1]['licenseUrl'],'copyright':rows[1]['author'],'modifications':'Short stream excerpt, volume normalization and fades; original pitch'})
(OUT/'recordings.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
print('Prepared space music and stream interaction',flush=True)
