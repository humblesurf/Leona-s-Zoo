"""V4 continuation: new wording, original pitch, same pre-recorded cast."""
import asyncio,json,hashlib
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'geo/assets/voice/v4-1'
SCRIPT=json.loads((OUT/'script.json').read_text(encoding='utf8'))
CAST={
 'en':[('child','en-US-AnaNeural',''),('male','en-US-AndrewNeural','-male'),('female','en-US-EmmaNeural','-female')],
 'yue':[('female','zh-HK-HiuMaanNeural',''),('male','zh-HK-WanLungNeural','-male'),('bright','zh-HK-HiuGaaiNeural','-bright')],
 'cmn':[('female','zh-CN-XiaoxiaoNeural',''),('male','zh-CN-YunxiNeural','-male'),('bright','zh-CN-YunxiaNeural','-bright')]
}
async def main():
 sem=asyncio.Semaphore(4);failures=[];completed=0
 async def render(id,lang,line,role,voice,suffix):
  nonlocal completed
  dest=OUT/f'{id}-{lang}{suffix}.mp3'
  if dest.exists() and dest.stat().st_size>3000:return
  async with sem:
   for attempt in range(4):
    try:
     await edge_tts.Communicate(line,voice,rate='-6%',pitch='+0Hz',volume='-5%').save(str(dest))
     completed+=1
     if completed%15==0:print(f'Recorded {completed} performances',flush=True)
     return
    except Exception as e:
     if attempt==3:failures.append([id,lang,role,str(e)])
     else:await asyncio.sleep(2+attempt*2)
 await asyncio.gather(*(render(id,lang,line,*v) for id,lines in SCRIPT.items() for lang,line in lines.items() for v in CAST[lang]))
 manifest={'engine':'Microsoft Edge neural TTS via edge-tts','cast':CAST,'rate':'-6%','pitch':'unchanged','scriptSha256':hashlib.sha256((OUT/'script.json').read_bytes()).hexdigest(),'narrationFiles':len(SCRIPT)*9,'failures':failures}
 (OUT/'production.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
 print('Finished',len(SCRIPT)*9,'performances. Failures:',failures,flush=True)
 if failures:raise RuntimeError('Narration generation failed')
asyncio.run(main())
