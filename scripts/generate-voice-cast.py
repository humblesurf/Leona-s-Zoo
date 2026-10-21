"""Extra narration performances; preserve original pitch and record the actual cast."""
import asyncio, json
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'geo/assets/voice'
SCRIPT = json.loads((OUT / 'script.json').read_text(encoding='utf-8'))
CAST = {
 'en': [('child','en-US-AnaNeural',''),('male','en-US-AndrewNeural','-male'),('female','en-US-EmmaNeural','-female')],
 'yue': [('female','zh-HK-HiuMaanNeural',''),('male','zh-HK-WanLungNeural','-male'),('bright','zh-HK-HiuGaaiNeural','-bright')],
 'cmn': [('female','zh-CN-XiaoxiaoNeural',''),('male','zh-CN-YunxiNeural','-male'),('bright','zh-CN-YunxiaNeural','-bright')]
}
async def main():
    sem=asyncio.Semaphore(4)
    failures=[]
    async def render(animal,lang,line,role,voice,suffix):
        dest=OUT/f'{animal}-{lang}{suffix}.mp3'
        if dest.exists() and dest.stat().st_size>3000:return
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(line,voice,rate='-6%',pitch='+0Hz',volume='-5%').save(str(dest))
                    print(f'OK {animal} {lang} {role}',flush=True)
                    return
                except Exception as exc:
                    if attempt==3:failures.append([animal,lang,role,str(exc)])
                    else:await asyncio.sleep(2+attempt*2)
    await asyncio.gather(*(render(a,l,line,*v) for a,lines in SCRIPT.items() for l,line in lines.items() for v in CAST[l]))
    manifest={'engine':'Microsoft Edge neural TTS via edge-tts','cast':CAST,'rate':'-6% (original recordings -8%)','pitch':'unchanged','selection':'shuffle bag per language; no consecutive identical performer','note':'English Ana is a child voice; Mandarin Yunxia is a youthful cartoon male voice; Cantonese uses adult male and female voices.','failures':failures}
    (OUT/'production.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Finished; failures:',failures,flush=True)
    if failures:raise RuntimeError(failures)
asyncio.run(main())
