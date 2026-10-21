from pathlib import Path
import asyncio,json
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'geo/assets/voice/v4-11';OUT.mkdir(parents=True,exist_ok=True)
CAST={'en':[('child','en-US-AnaNeural',''),('male','en-US-AndrewNeural','-male'),('female','en-US-EmmaNeural','-female')],'yue':[('female','zh-HK-HiuMaanNeural',''),('male','zh-HK-WanLungNeural','-male'),('bright','zh-HK-HiuGaaiNeural','-bright')],'cmn':[('female','zh-CN-XiaoxiaoNeural',''),('male','zh-CN-YunxiNeural','-male'),('bright','zh-CN-YunxiaNeural','-bright')]}
dialogue=json.loads((ROOT/'geo/assets/chapters-v4-11/dialogue-root.json').read_text(encoding='utf8'))
async def main():
 sem=asyncio.Semaphore(4);errors=[];done=0
 async def record(id,lang,text,role,voice,suffix):
  nonlocal done
  target=OUT/f'{id}-{lang}{suffix}.mp3'
  if target.exists() and target.stat().st_size>3000:return
  async with sem:
   for attempt in range(4):
    try:
     await edge_tts.Communicate(text,voice,rate='-6%',volume='-5%').save(str(target));done+=1
     if done%12==0:print('Recorded',done,flush=True)
     return
    except Exception as e:
     if attempt==3:errors.append([id,lang,role,str(e)])
     else:await asyncio.sleep(2+attempt*2)
 await asyncio.gather(*(record(id,lang,d['intro'][lang],*cast) for id,d in dialogue.items() for lang in CAST for cast in CAST[lang]))
 (OUT/'script.json').write_text(json.dumps({id:d['intro'] for id,d in dialogue.items()},ensure_ascii=False,indent=2),encoding='utf8')
 (OUT/'production.json').write_text(json.dumps({'engine':'Microsoft Edge neural TTS via edge-tts','cast':CAST,'rate':'-6%','recordings':len(dialogue)*9,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
 print('Finished',len(dialogue)*9,'narrations',errors,flush=True)
 if errors:raise RuntimeError(errors)
asyncio.run(main())
