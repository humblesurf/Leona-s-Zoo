from pathlib import Path
import asyncio,json
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'geo/assets/animation/v4-11-motion/goose'
OUT=ROOT/'geo/assets/voice/v4-11';OUT.mkdir(parents=True,exist_ok=True)
CAST={'en':[('child','en-US-AnaNeural',''),('male','en-US-AndrewNeural','-male'),('female','en-US-EmmaNeural','-female')],'yue':[('female','zh-HK-HiuMaanNeural',''),('male','zh-HK-WanLungNeural','-male'),('bright','zh-HK-HiuGaaiNeural','-bright')],'cmn':[('female','zh-CN-XiaoxiaoNeural',''),('male','zh-CN-YunxiNeural','-male'),('bright','zh-CN-YunxiaNeural','-bright')]}
async def main():
 dialogue=json.loads((DATA/'dialogue.json').read_text(encoding='utf8'));sem=asyncio.Semaphore(3);errors=[]
 async def record(id,lang,text,role,voice,suffix):
  target=OUT/f'{id}-{lang}{suffix}.mp3'
  if target.exists() and target.stat().st_size>3000:return
  async with sem:
   for attempt in range(4):
    try:await edge_tts.Communicate(text,voice,rate='-6%',volume='-5%').save(str(target));return
    except Exception as e:
     if attempt==3:errors.append([id,lang,role,str(e)])
     else:await asyncio.sleep(2+attempt*2)
 await asyncio.gather(*(record(id,lang,d['intro'][lang],*cast) for id,d in dialogue.items() for lang in CAST for cast in CAST[lang]))
 (DATA/'voice-production.json').write_text(json.dumps({'engine':'Microsoft Edge neural TTS via edge-tts','cast':CAST,'rate':'-6%','recordings':9,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
 print('Goose narrations',errors,flush=True)
 if errors:raise RuntimeError(errors)
asyncio.run(main())
