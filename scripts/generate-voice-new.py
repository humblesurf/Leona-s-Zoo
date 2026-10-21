"""Record introductions for animals added in this revision. Writes only under v5/assets/voice."""
import asyncio, json
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'v5/assets/voice'
text = (ROOT / 'v5/assets/v5-new-lines.js').read_text(encoding='utf-8')
LINES = json.loads(text.split('=', 1)[1].strip().rstrip(';'))
CAST = {
 'en': [('child','en-US-AnaNeural',''),('male','en-US-AndrewNeural','-male'),('female','en-US-EmmaNeural','-female')],
 'yue': [('female','zh-HK-HiuMaanNeural',''),('male','zh-HK-WanLungNeural','-male'),('bright','zh-HK-HiuGaaiNeural','-bright')],
 'cmn': [('female','zh-CN-XiaoxiaoNeural',''),('male','zh-CN-YunxiNeural','-male'),('bright','zh-CN-YunxiaNeural','-bright')]
}

async def main():
    sem = asyncio.Semaphore(4)
    failures = []
    jobs = [(a, lang, line, role, voice, suffix) for a, lines in LINES.items() for lang, line in lines.items() for role, voice, suffix in CAST[lang]]
    done = 0
    async def render(animal, lang, line, role, voice, suffix):
        nonlocal done
        dest = OUT / f'{animal}-{lang}{suffix}.mp3'
        if dest.exists() and dest.stat().st_size > 3000:
            done += 1
            return
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(line, voice, rate='-6%', pitch='+0Hz', volume='-5%').save(str(dest))
                    done += 1
                    print(f'{done}/{len(jobs)} {dest.name}', flush=True)
                    return
                except Exception as exc:
                    if attempt == 3:
                        failures.append([animal, lang, role, str(exc)])
                        print(f'FAIL {animal} {lang} {role} {exc}', flush=True)
                    else:
                        await asyncio.sleep(2 + attempt * 2)
    await asyncio.gather(*(render(*job) for job in jobs))
    print('Finished', len(jobs), 'failures', len(failures), flush=True)
    if failures:
        raise SystemExit(1)

asyncio.run(main())
