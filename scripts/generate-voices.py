"""Generate local three-language narration. Regeneration requires internet, playback does not."""
import asyncio, json
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'geo/assets/voice'
SCRIPT = json.loads((OUT / 'script.json').read_text(encoding='utf-8'))
VOICES = {'en': 'en-US-AnaNeural', 'yue': 'zh-HK-HiuMaanNeural', 'cmn': 'zh-CN-XiaoxiaoNeural'}

async def main():
    semaphore = asyncio.Semaphore(4)
    failures = []
    async def render(animal, lang, line):
        dest = OUT / f'{animal}-{lang}.mp3'
        if dest.exists() and dest.stat().st_size > 3000:
            return
        async with semaphore:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(line, VOICES[lang], rate='-8%', pitch='+0Hz', volume='-5%').save(str(dest))
                    print(f'OK {animal} {lang}', flush=True)
                    return
                except Exception as exc:
                    if attempt == 2:
                        failures.append((animal, lang, str(exc)))
                    else:
                        await asyncio.sleep(1 + attempt)
    await asyncio.gather(*(render(a, lang, line) for a, lines in SCRIPT.items() for lang,line in lines.items()))
    (OUT/'production.json').write_text(json.dumps({'engine':'Microsoft Edge neural TTS via edge-tts','voices':VOICES,'rate':'-8%','failures':failures},ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Finished: {len(SCRIPT)*3-len(failures)} / {len(SCRIPT)*3}', flush=True)
    if failures:
        raise RuntimeError(failures)

asyncio.run(main())
