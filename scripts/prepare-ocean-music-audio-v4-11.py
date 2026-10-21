from pathlib import Path
import sys,json,urllib.request,subprocess,tarfile
sys.path.insert(0,'C:/Users/XTIA/.cache/codex-audio-v411')
import numpy as np,imageio_ffmpeg,py7zr
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'geo/assets/chapters-v4-11/music/audio';RAW=OUT/'source'
RAW.mkdir(parents=True,exist_ok=True);FF=imageio_ffmpeg.get_ffmpeg_exe();RATE=24000
BANKS={
 'musicharp':{'title':'Concert harp C4, soft pluck','author':'Versilian Studios LLC; performer K. Smith; FreePats assembled by Roberto','source':'https://freepats.zenvoid.org/OrchestralStrings/harp.html','download':'https://freepats.zenvoid.org/OrchestralStrings/ConcertHarp/ConcertHarp-SFZ%2BFLAC-20200702.tar.gz','file':'harp.tar.gz'},
 'musicguitar':{'title':'Spanish classical guitar, soft nylon-string pluck','author':'Roberto for FreePats','source':'https://freepats.zenvoid.org/Guitar/acoustic-guitar.html','download':'https://freepats.zenvoid.org/Guitar/SpanishClassicalGuitar/SpanishClassicalGuitar-SFZ%2BFLAC-20190618.7z','file':'guitar.7z'}
}
def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=60) as response:return response.read()
for id,d in BANKS.items():
 (RAW/(id+'-license.html')).write_bytes(fetch(d['source']))
 bank=RAW/d['file']
 if not bank.exists():bank.write_bytes(fetch(d['download']))
 dst=RAW/id;dst.mkdir(exist_ok=True)
 if bank.suffix=='.7z':
  with py7zr.SevenZipFile(bank) as archive:
   members=archive.getnames()
   for name in members:
    target=(dst/name).resolve()
    if not target.is_relative_to(dst.resolve()):raise RuntimeError('Unsafe archive path')
   archive.extractall(path=dst)
 else:
  with tarfile.open(bank) as archive:
   for member in archive.getmembers():
    if member.isfile() and member.name.endswith(('.flac','.sfz','.txt')):
     # Flatten explicitly named audio/text members; no unchecked archive writes.
     (dst/Path(member.name).name).write_bytes(archive.extractfile(member).read())
 samples=sorted(dst.rglob('*.flac'));print(id,'samples',[p.name for p in samples],flush=True)
rows=[]
for id,filename,duration in [('musicharp','D4_mf1.flac',1.20),('musicguitar','C4.flac',.95)]:
 source=next((RAW/id).rglob(filename))
 sound=np.frombuffer(subprocess.check_output([FF,'-v','error','-i',str(source),'-ac','1','-ar',str(RATE),'-f','f32le','pipe:1']),dtype=np.float32).copy()
 voiced=np.flatnonzero(np.abs(sound)>.0015)
 if not len(voiced):raise RuntimeError('Silent original '+id)
 start=max(0,int(voiced[0])-int(.008*RATE));sound=sound[start:start+int(duration*RATE)]
 rms=float(np.sqrt(np.mean(sound**2)));peak=float(np.max(np.abs(sound)));sound*=min(.09/max(rms,1e-9),.62/max(peak,1e-9))
 n=int(.005*RATE);sound[:n]*=np.linspace(0,1,n);n=int(.08*RATE);sound[-n:]*=np.linspace(1,0,n)
 target=OUT/(id+'.mp3')
 subprocess.run([FF,'-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-codec:a','libmp3lame','-b:a','128k',str(target)],input=sound.astype(np.float32).tobytes(),check=True)
 d=BANKS[id];row={k:v for k,v in d.items() if k!='file'}
 row.update(id=id,title='Concert harp D4, soft pluck' if id=='musicharp' else row['title'],path='assets/'+target.relative_to(ROOT/'geo/assets').as_posix(),type='recording',license='CC0 1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',originalFile=filename,extractStart=start/RATE,duration=len(sound)/RATE,rms=float(np.sqrt(np.mean(sound**2))),peak=float(np.max(np.abs(sound))),playbackRates=[1,1.259921,1.498307,2],pitchPreservation=False,modifications='Single complete recorded pluck, trim leading silence, gentle amplitude normalization, short edge fades; no synthetic replacement. Four beats pitch-resample this real note into a major arpeggio.',runtimeNotes='Harp D4-F#4-A4-D5; guitar C4-E4-G4-C5. Each beat uses actual recorded note resampled with pitch-preserving time stretch disabled. Slow/fast changes beat spacing, soft/strong changes volume.')
 rows.append(row);print('Prepared',id,row['path'],row['rms'],flush=True)
(OUT.parent/'audio-recordings.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
