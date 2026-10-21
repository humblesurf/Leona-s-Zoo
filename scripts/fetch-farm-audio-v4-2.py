from pathlib import Path
import re,json,subprocess,html,time,sys
import urllib.request,urllib.parse,numpy as np,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'geo/assets/calls/v4-2';OUT.mkdir(parents=True,exist_ok=True);RAW=OUT/'source';RAW.mkdir(exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe()
def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (LeonasZoo local educational asset preparation)'}),timeout=60) as response:return response.read()
jobs=[
 {'id':'cow','source':'https://bigsoundbank.com/cow-moos-3-s2383.html','author':'Joseph Sardin','duration':2.8,'start':0,'license':'CC0 1.0'},
 {'id':'sheep','source':'https://bigsoundbank.com/sheep-1-s2343.html','author':'Joseph Sardin','duration':1.4,'start':0,'license':'CC0 1.0'},
 {'id':'duck','source':'https://bigsoundbank.com/ducks-s0276.html','author':'DenisChardonnet','duration':2.8,'start':1.0,'license':'CC0 1.0'},
 {'id':'hen','source':'https://bigsoundbank.com/hens-lays-s0978.html','author':'Joseph Sardin','duration':2.8,'start':.5,'license':'CC0 1.0'},
 {'id':'pig','source':'https://freesound.org/people/egomassive/sounds/536746/','author':'egomassive; original recording Felix Blume','duration':1.4,'start':0,'license':'CC0 1.0'},
 {'id':'chick','source':'https://bigsoundbank.com/chick-that-chirp-s0672.html','author':'Joseph Sardin','duration':2.4,'start':3,'license':'CC0 1.0'},
 {'id':'farm','source':'https://bigsoundbank.com/flock-sheep-and-cows-s3220.html','author':'Joseph Sardin','duration':24,'start':15,'license':'CC0 1.0','ambient':True},
 {'id':'market','source':'https://bigsoundbank.com/search?q=market','author':'Joseph Sardin','duration':24,'start':30,'license':'CC0 1.0','ambient':True}
]
rows=json.loads((OUT/'recordings.json').read_text(encoding='utf8')) if (OUT/'recordings.json').exists() else []
for job in jobs:
 if len(sys.argv)>1 and job['id'] not in sys.argv[1:]:continue
 id=job['id'];rows=[r for r in rows if r['id']!=id];txt=fetch(job['source']).decode('utf8')
 if id=='market':
  urls=re.findall(r'href=["\']([^"\']+\.html)["\']',txt);chosen=next(u for u in urls if 'outdoor-market-1-' in u);job['source']=urllib.parse.urljoin(job['source'],chosen);txt=fetch(job['source']).decode('utf8')
 urls=re.findall(r'["\']([^"\']+\.(?:mp3|ogg)(?:\?[^"\']*)?)["\']',txt);urls=[html.unescape(u) for u in urls]
 if 'freesound' in job['source']:urls=[u for u in urls if 'previews' in u and ('hq.mp3' in u or '.ogg' in u)]
 if not urls:raise RuntimeError('No public audio source '+id)
 url=urllib.parse.urljoin(job['source'],urls[0]);source=RAW/f'{id}.mp3';source.write_bytes(fetch(url))
 # Trim at original pitch, with gentle fades. Measure the selected excerpt.
 raw=subprocess.check_output([FF,'-v','error','-ss',str(job['start']),'-i',str(source),'-t',str(job['duration']),'-ac','1','-ar','24000','-f','f32le','pipe:1']);a=np.frombuffer(raw,dtype=np.float32);duration=len(a)/24000;rms=float(np.sqrt(np.mean(a*a)));peak=float(np.max(np.abs(a)));gain=min((.07 if job.get('ambient') else .14)/rms,.65/peak)
 dest=(ROOT/'geo/assets/audio/v4-2'/f'{id}.mp3') if job.get('ambient') else OUT/f'{id}.mp3';dest.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run([FF,'-v','error','-y','-ss',str(job['start']),'-i',str(source),'-t',str(duration),'-af',f'volume={gain},afade=t=in:d=0.04,afade=t=out:st={max(.06,duration-.10)}:d=0.10','-codec:a','libmp3lame','-b:a','128k',str(dest)],check=True)
 rows.append({**job,'download':url,'path':str(dest.relative_to(ROOT/'geo')).replace('\\','/'),'duration':round(duration,3),'licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','copyright':job['author'],'modifications':'Excerpt, mono, gentle loudness and short fades; original pitch','rms':round(rms*gain,4)});(OUT/'recordings.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8');print('Prepared',id,round(duration,2),flush=True)
