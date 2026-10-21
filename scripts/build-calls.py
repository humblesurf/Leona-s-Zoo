"""Import verified recordings and prepare short, gentle clips, with explicit provenance."""
import json,sys,re,urllib.request,urllib.parse,subprocess,time
from pathlib import Path
import numpy as np
import imageio_ffmpeg
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'geo/assets/calls';RAW=ROOT/'.upgrade-work/audio';RAW.mkdir(parents=True,exist_ok=True)
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
base=json.loads((OUT/'selected-meta.json').read_text(encoding='utf-8'))
pages={p['title']:p for p in base['query']['pages'].values()}
titles={'tiger':'File:439280 schots angry-tiger.wav','lion':'File:Lion raring-sound1TamilNadu178.ogg','elephant':'File:Elephant voice - trumpeting.ogg','jaguar':'File:Jaguar saw.flac','giraffe':'File:Giraffehum3.oga','zebra':'File:Grévys zebra (Sound Effects).ogg','dolphin':'File:161691 felixblume dolphin-screaming-underwater-in-caribbean-sea-mexico.wav','whale':'File:Humpback-Whale-Song-and-Foraging-Behavior-on-an-Antarctic-Feeding-Ground-pone.0051214.s001.oga'}
if (OUT/'candidates.json').exists():
 candidates=json.loads((OUT/'candidates.json').read_text(encoding='utf-8'))
 for id,title in {'flamingo':'Phoenicopterus roseus (Rosaflamingo','meerkat':'Erdmaennchen.ogg','cheetah':'Acoustic-Structure-and-Contextual','warthog':'20200322 warthog','toucan':'Toco Toucan call','macaw':'Scarlet macaw 01','frog':'Rotaugenlaubfrosch'}.items():
  row=next((r for r in candidates.get(id,[]) if title in r['title']),None)
  if row:titles[id]=row['title'];pages[row['title']]={'row':row}
def source(title):
 p=pages[title]
 if 'row' in p:return p['row']
 i=p['imageinfo'][0];m=i['extmetadata'];val=lambda k:re.sub('<[^>]*>','',m.get(k,{}).get('value',''))
 return {'title':title,'url':i['url'].split('?')[0],'source':i['descriptionurl'],'author':val('Artist'),'license':val('LicenseShortName'),'licenseUrl':val('LicenseUrl'),'description':val('ImageDescription')}
manifest=json.loads((OUT/'recordings.json').read_text(encoding='utf-8')) if (OUT/'recordings.json').exists() else {}
def import_clip(id,row,start=None,length=2.1):
 ext=Path(urllib.parse.urlparse(row['url']).path).suffix or '.wav'
 raw=RAW/(id+ext)
 if not raw.exists():
  request=urllib.request.Request(row['url'],headers={'User-Agent':'AnimalFriends/2.0 educational project'})
  raw.write_bytes(urllib.request.urlopen(request,timeout=60).read())
 pcm=subprocess.check_output([FFMPEG,'-v','error','-i',str(raw),'-t','90','-ac','1','-ar','22050','-f','f32le','pipe:1'])
 samples=np.frombuffer(pcm,dtype=np.float32);duration=len(samples)/22050
 length=min(length,duration)
 if start is None:
  # Select one clear call: strongest continuous window, without changing the species' pitch.
  win=max(1,int(length*22050));cs=np.concatenate(([0],np.cumsum(samples.astype(np.float64)**2)))
  points=np.arange(0,max(1,len(samples)-win),2205)
  energy=(cs[np.minimum(points+win,len(samples))]-cs[points])/win
  start=float(points[int(np.argmax(energy))]/22050)
 else:start=min(start,max(0,duration-length))
 dest=OUT/(id+'.mp3')
 subprocess.run([FFMPEG,'-y','-v','error','-ss',str(start),'-i',str(raw),'-t',str(length),'-ac','1','-ar','44100','-af',f'loudnorm=I=-22:TP=-5:LRA=7,afade=t=in:d=0.08,afade=t=out:st={max(0,length-.18)}:d=0.18','-b:a','96k',str(dest)],check=True)
 manifest[id]={**row,'path':f'assets/calls/{id}.mp3','start':round(start,3),'duration':round(length,3),'changes':'Trimmed, mono, gentle loudness normalization, short fades; no pitch change.'}
 print('OK',id,row['license'],round(duration,1),'s ->',round(start,2),flush=True)
for id,title in titles.items():
 if id in manifest:continue
 try:import_clip(id,source(title),length=2.6 if id in ['lion','tiger','whale'] else 2.1)
 except Exception as e:print('FAILED',id,str(e),flush=True)
 (OUT/'recordings.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
 time.sleep(4)
extra={
 'penguin':{'title':'Emperor Penguin colony, Antarctica','url':'https://cdn.freesound.org/previews/179/179589_370556-hq.mp3','source':'https://freesound.org/people/stormpetrel/sounds/179589/','author':'stormpetrel','license':'CC BY-NC 4.0','licenseUrl':'https://creativecommons.org/licenses/by-nc/4.0/','description':'Field recording of Emperor penguins and their chicks calling, Terre Adélie, Antarctica.'}
}
for id,row in extra.items():
 if id in manifest:continue
 try:import_clip(id,row,start=8.5)
 except Exception as e:print('FAILED',id,str(e),flush=True)
(OUT/'recordings.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Imported',len(manifest),'recordings')
