from pathlib import Path
import asyncio,json
import edge_tts
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'geo/assets/voice/v4-12-names'
names=json.loads((OUT/'script.json').read_text(encoding='utf8'))
CAST={'en':[('child','en-US-AnaNeural',''),('male','en-US-AndrewNeural','-male'),('female','en-US-EmmaNeural','-female')],'yue':[('female','zh-HK-HiuMaanNeural',''),('male','zh-HK-WanLungNeural','-male'),('bright','zh-HK-HiuGaaiNeural','-bright')],'cmn':[('female','zh-CN-XiaoxiaoNeural',''),('male','zh-CN-YunxiNeural','-male'),('bright','zh-CN-YunxiaNeural','-bright')]}
async def main():
 sem=asyncio.Semaphore(6);done=0;errors=[]
 async def record(id,lang,text,role,voice,suffix):
  nonlocal done
  file=OUT/f'{id}-{lang}{suffix}.mp3'
  if file.exists() and file.stat().st_size>1000:return
  async with sem:
   for attempt in range(4):
    try:
     await edge_tts.Communicate(text,voice,rate='-8%',pitch='+0Hz',volume='-5%').save(str(file));done+=1
     if done%36==0:print('Names recorded',done,flush=True)
     return
    except Exception as e:
     if attempt==3:errors.append([id,lang,role,str(e)])
     else:await asyncio.sleep(2+attempt*2)
 await asyncio.gather(*(record(id,lang,text,*v)for id,d in names.items()for lang,text in d.items()for v in CAST[lang]))
 (OUT/'production.json').write_text(json.dumps({'engine':'Microsoft Edge neural TTS via edge-tts','cast':CAST,'rate':'-8%','pitch':'unchanged','text':'Animal name only; no greeting or introduction','recordings':len(names)*9,'errors':errors,'note':'English Ana is a child voice. Cantonese HiuGaai is a brighter adult voice; Mandarin Yunxia is youthful. Character casting is fixed and consistent between names and introductions.'},ensure_ascii=False,indent=2),encoding='utf8')
 print('Finished',len(names)*9,'name recordings; errors',errors,flush=True)
 if errors:raise RuntimeError(errors)
asyncio.run(main())
