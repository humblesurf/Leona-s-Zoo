from pathlib import Path
import json,re,html,urllib.request,urllib.parse,subprocess,tarfile,io
import numpy as np,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'geo/assets/audio/v4-9';RAW=OUT/'source';CALL=ROOT/'geo/assets/calls/v4-9'
for d in [OUT,RAW,CALL]:d.mkdir(parents=True,exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe();RATE=24000
SOURCES={
 'musictambourine':('https://bigsoundbank.com/tambourine-s0463.html','Tambourine','Joseph SARDIN'),
 'musicmaracas':('https://bigsoundbank.com/maraca-1-s2527.html','Maraca #1','Joseph SARDIN'),
 'musicpiano':('https://bigsoundbank.com/tuning-a-piano-s2696.html','Tuning a piano','Pierre SIBANARCO'),
 'musicdrum':('https://bigsoundbank.com/snare-drum-5-s2308.html','Snare drum #5','Joseph SARDIN'),
 'beach':('https://bigsoundbank.com/petites-vagues-ecume-et-plage-s1447.html','Small Waves, Froth and Beach','Joseph SARDIN'),
 'weather':('https://bigsoundbank.com/wind-in-a-tree-s0659.html','Wind in a Tree','Joseph SARDIN'),
}
def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=60) as r:return r.read()
def rawfile(p):
 return np.frombuffer(subprocess.check_output([FF,'-v','error','-i',str(p),'-ac','1','-ar',str(RATE),'-f','f32le','pipe:1']),dtype=np.float32).copy()
def encode(p,a):
 subprocess.run([FF,'-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-codec:a','libmp3lame','-b:a','128k',str(p)],input=a.astype(np.float32).tobytes(),check=True)
def normalize(a,rms_target=.095,peak_target=.62,fade_in=.006,fade_out=.045):
 rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)));gain=min(rms_target/max(rms,1e-9),peak_target/max(peak,1e-9))
 a=a*gain
 n=min(len(a)//2,int(fade_in*RATE));a[:n]*=np.linspace(0,1,n)
 n=min(len(a)//2,int(fade_out*RATE));a[-n:]*=np.linspace(1,0,n)
 return a
download_info={}
for id,(url,title,author) in SOURCES.items():
 p=RAW/(id+'.mp3')
 page=RAW/(id+'.html')
 if not page.exists():page.write_bytes(fetch(url))
 s=page.read_text(encoding='utf8')
 links=re.findall(r'["\']([^"\']+\.mp3(?:\?[^"\']*)?)["\']',s)
 if not links:raise RuntimeError('No public recording link: '+url)
 download=urllib.parse.urljoin(url,html.unescape(links[0]))
 if not p.exists():p.write_bytes(fetch(download))
 download_info[id]={'id':id,'title':title,'author':author,'source':url,'download':download,'license':'CC0 1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','copyright':author}
 print('Fetched',id,flush=True)
bank=RAW/'Xylophone-MediumMallets-SFZ-FLAC-20200706.tar.gz'
bank_url='https://freepats.zenvoid.org/ChromaticPercussion/Xylophone1/Xylophone-MediumMallets-SFZ%2BFLAC-20200706.tar.gz'
if not bank.exists():bank.write_bytes(fetch(bank_url))
with tarfile.open(bank) as tar:
 print('Xylophone members:',[m.name for m in tar.getmembers() if m.name.endswith('.flac')],flush=True)
 for m in tar.getmembers():
  if m.isfile() and m.name.endswith(('.flac','.txt','.sfz')):
   dst=RAW/'xylophone'/Path(m.name).name;dst.parent.mkdir(exist_ok=True);dst.write_bytes(tar.extractfile(m).read())
if '--fetch' in __import__('sys').argv:
 for id in ['musictambourine','musicmaracas','musicpiano','musicdrum']:
  a=rawfile(RAW/(id+'.mp3'));step=int(.02*RATE);energy=np.array([np.sqrt(np.mean(a[i:i+step]**2)) for i in range(0,len(a)-step,step)]);
  peaks=[]
  for i in range(1,len(energy)-1):
   if energy[i]>max(.008,energy.max()*.2) and energy[i]>energy[i-1] and energy[i]>energy[i+1]:
    if not peaks or i*.02-peaks[-1][0]>.3:peaks.append((round(i*.02,3),round(float(energy[i]),4)))
  print(id,'duration',len(a)/RATE,'peaks',peaks,flush=True)
 raise SystemExit(0)

rows=[]
def save(id,p,a,info):
 encode(p,a)
 rows.append(dict(info,id=id,path='assets/'+str(p.relative_to(ROOT/'geo/assets')).replace('\\','/'),duration=round(len(a)/RATE,5),rms=float(np.sqrt(np.mean(a*a))),peak=float(np.max(np.abs(a)))))
 print('Prepared',id,flush=True)
def source_excerpt(id,start,duration,target=.095):
 a=rawfile(RAW/(id+'.mp3'));a=a[round(start*RATE):round((start+duration)*RATE)]
 if len(a)<duration*RATE*.9:raise RuntimeError('Short source '+id)
 a=normalize(a,rms_target=target)
 rec=dict(download_info[id],extractStart=start,modifications='One complete isolated strike/shake excerpt; original pitch, gentle amplitude normalization, short edge fades.',type='recording')
 if id=='musicpiano':
  rec.update(playbackRates=[1,1.122462,1.259921,1.122462],pitchPreservation=False,runtimeNotes='Four beats resample the original recorded A as A, B, C-sharp, B. Stored source pitch is retained. Pitch-preserving time stretch is disabled; light/heavy changes only volume.')
 save(id,CALL/(id+'.mp3'),a,rec)
# Onsets privately reviewed at 20 ms intervals. These windows isolate one action and avoid the next strike.
source_excerpt('musicpiano',.07,.70)
source_excerpt('musicdrum',.015,.48)
source_excerpt('musictambourine',1.255,.56)
source_excerpt('musicmaracas',.01,.53)
x=rawfile(RAW/'xylophone/C5_pp.flac')
above=np.flatnonzero(np.abs(x)>.002);start=max(0,int(above[0])-round(.007*RATE));x=x[start:start+round(.72*RATE)]
save('musicxylophone',CALL/'musicxylophone.mp3',normalize(x),{'title':'Wooden xylophone C5, medium mallet, soft dynamic','author':'Versilian Studios LLC; FreePats bank assembled by roberto@zenvoid.org','source':'https://freepats.zenvoid.org/ChromaticPercussion/xylophone.html','download':bank_url,'license':'CC0 1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','copyright':'Versilian Studios LLC / FreePats','type':'recording','originalFile':'C5_pp.flac','modifications':'Single wood-bar C5 note; leading silence removed, gentle amplitude normalization and tail fade; original pitch.','playbackRates':[1,1.122462,1.259921,1.122462],'pitchPreservation':False,'runtimeNotes':'Four beats resample the original recorded C5 as C5, D5, E5, D5. Stored source pitch is retained. Pitch-preserving time stretch is disabled; light/heavy changes only volume.'})
for id in ['beach','weather']:
 a=rawfile(RAW/(id+'.mp3'))[12*RATE:48*RATE]
 a=normalize(a,rms_target=.065,peak_target=.42,fade_in=.25,fade_out=.25)
 save(id,OUT/(id+'.mp3'),a,dict(download_info[id],type='recording',extractStart=12,modifications='36 second original-pitch excerpt, gentle amplitude normalization and edge fades.'))
harbor_info=json.loads((ROOT/'geo/assets/audio/v4-8/recordings.json').read_text(encoding='utf8'))[0]
h=rawfile(ROOT/'geo/assets/audio/v4-8/harbor.mp3')[:36*RATE]
save('hongkong',OUT/'hongkong.mp3',normalize(h,rms_target=.05,peak_target=.35,fade_in=.25,fade_out=.25),dict(harbor_info,title='Generic gentle harbour ambience for Hong Kong chapter',type='recording',description='Reused verified gulls/harbour recording. Generic city waterfront atmosphere; NOT a recording made in Hong Kong.',modifications='36 second excerpt; softer normalization and edge fades; original pitch.'))

# Project-authored ambience scores and store sound design. They are labelled as originals, never field recordings.
duration=36;t=np.arange(duration*RATE,dtype=np.float64)/RATE
def bed(notes,level):
 a=np.zeros_like(t)
 for i,f in enumerate(notes):a+=(np.sin(2*np.pi*f*t)+.13*np.sin(2*np.pi*f*2*t))*(level+.0015*np.sin(2*np.pi*t/duration+i))
 return a
music=bed([130.8128,196,261.6256],.004)
for start,f in [(4,392),(13,329.6276),(22,440),(31,392)]:
 q=np.maximum(0,t-start);env=np.where(t>=start,(1-np.exp(-q*5))*np.exp(-q/1.6),0)
 music+=.014*env*np.sin(2*np.pi*f*t)
save('music',OUT/'music.mp3',normalize(music,.012,.12,.3,.3),{'title':'Original very quiet music-room underscore','author':'Project-authored original musical composition','source':'scripts/prepare-chapter-audio-v4-9.py','license':'Project original','type':'original-music','description':'Sparse soft notes and sustained warm harmony, deliberately quiet so the selected instrument remains clear.'})
planets=bed([130.8128,196,261.6256,329.6276],.008)
for start,f in [(2,523.251),(10,659.255),(18,587.330),(26,783.991)]:
 q=np.maximum(0,t-start);env=np.where(t>=start,(1-np.exp(-q*4))*np.exp(-q/2.8),0)
 planets+=.026*env*np.sin(2*np.pi*f*t)
save('planets',OUT/'planets.mp3',normalize(planets,.025,.25,.3,.3),{'title':'Original soft planetary exploration score','author':'Project-authored original musical composition','source':'scripts/prepare-chapter-audio-v4-9.py','license':'Project original','type':'original-music','description':'Musical underscore for exploration, NOT a physical sound of the vacuum of space.'})
rng=np.random.default_rng(49);noise=rng.normal(size=len(t));freq=np.fft.rfftfreq(len(t),1/RATE)
filter_shape=np.exp(-(freq/470)**2)*(1-np.exp(-(freq/30)**2))
hvac=np.fft.irfft(np.fft.rfft(noise)*filter_shape,n=len(t));hvac=hvac/max(np.std(hvac),1e-8)*.01
store=hvac*(.85+.15*np.sin(2*np.pi*t/17))
for start in [8,21,31]:
 q=np.maximum(0,t-start);env=np.where((t>=start)&(t<start+.12),np.sin(np.minimum(q/.12,1)*np.pi)**2,0)
 store+=.035*env*np.sin(2*np.pi*860*t)
save('supermarket',OUT/'supermarket.mp3',normalize(store,.015,.15,.3,.3),{'title':'Original quiet supermarket ventilation and distant checkout cues','author':'Project-authored procedural sound design','source':'scripts/prepare-chapter-audio-v4-9.py','license':'Project original','type':'original-sound-design','description':'Gentle interior ventilation and sparse soft checkout beeps; no voices, no music or identifiable people.'})

# A generic tram ding-ding cue is an original bell, not a recording of Hong Kong's trams.
bell_t=np.arange(round(1.25*RATE),dtype=np.float64)/RATE;bell=np.zeros_like(bell_t)
for start in [.02,.49]:
 q=np.maximum(0,bell_t-start);env=np.where(bell_t>=start,(1-np.exp(-q*800))*np.exp(-q*7),0)
 for f,amp in [(1046.5,1),(2119,.23),(2920,.08)]:bell+=amp*env*np.sin(2*np.pi*f*bell_t)
save('hktram',CALL/'hktram.mp3',normalize(bell,.08,.52,.004,.065),{'title':'Original gentle ding-ding tram bell cue','author':'Project-authored modal bell sound design','source':'scripts/prepare-chapter-audio-v4-9.py','license':'Project original','type':'original-sound-design','description':'Two clear chimes for the tram interaction; not a recording of a Hong Kong tram.'})
wave=rawfile(RAW/'beach.mp3')[17*RATE:20*RATE]
save('beachwave',CALL/'beachwave.mp3',normalize(wave,.095,.58,.08,.16),dict(download_info['beach'],title='Small wave and shore foam excerpt',type='recording',extractStart=17,modifications='Three-second original-pitch wave excerpt, gentle amplitude normalization and fades.'))

# Full decode verification is performed on finished files, not on the unencoded source signal.
checks=[]
for row in rows:
 p=ROOT/'geo'/row['path'];a=rawfile(p);rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)));seconds=len(a)/RATE
 if not np.isfinite(a).all() or seconds<.1 or rms<.001 or peak>.8:raise RuntimeError('Audio validation failed: '+row['id'])
 checks.append({'id':row['id'],'path':row['path'],'duration':round(seconds,5),'rms':rms,'peak':peak,'nonSilent':True})
(OUT/'recordings.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(OUT/'validation.json').write_text(json.dumps({'files':len(checks),'errors':[],'checks':checks},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
call_rows={r['id']:r for r in rows if '/calls/' in r['path']}
(CALL/'recordings.json').write_text(json.dumps(call_rows,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
wrapper=ROOT/'geo/assets/chapter-sounds.js'
if wrapper.exists():
 code=wrapper.read_text(encoding='utf8')
 declaration='global.CHAPTER_CALL_RECORDINGS='+json.dumps(call_rows,ensure_ascii=False,separators=(',',':'))+';\n'
 code=re.sub(r'global\.CHAPTER_CALL_RECORDINGS=.*?;\n',lambda _:declaration,code,count=1,flags=re.S)
 wrapper.write_text(code,encoding='utf8')
print('Validated',len(checks),'files;',len(call_rows),'click samples',flush=True)
