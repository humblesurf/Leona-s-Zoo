"""Build v5 greeting lines. Does not touch geo voice files."""
import json, random, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
script = json.loads((ROOT / 'geo/assets/voice/script.json').read_text(encoding='utf-8'))
data = (ROOT / 'geo/assets/game-data.js').read_text(encoding='utf-8')
dialogue = data.split('window.GAME_SCENE_ORDER')[0]
names = {}
for m in re.finditer(r'\n  "([a-z0-9]+)": \{\n    "emoji":.*?\n    "name": \{\n      "en": "([^"]+)"', dialogue, re.S):
    names[m.group(1)] = m.group(2)

ids = sorted(script)
rng = random.Random(5)
rng.shuffle(ids)
keep_n = max(1, round(len(ids) / 4))
hello = set(ids[:keep_n])
rest = ids[keep_n:]
name_n = round(len(rest) * 0.45)
myname = set(rest[:name_n])

lines = {}
problems = []
for animal, pack in script.items():
    if animal in hello:
        continue
    style = 'name' if animal in myname else 'im'
    out = {}
    en = pack['en']
    if not en.startswith('Hello, little friend! '):
        problems.append((animal, 'en', en))
        continue
    body = en[len('Hello, little friend! '):]
    if style == 'im':
        out['en'] = body
    else:
        split = re.match(r"^(?:I'm|I am) (?:a |an )?.+?\. (.*)$", body)
        rest_en = split.group(1) if split else body
        nice=' '.join(part[:1].upper()+part[1:] for part in names.get(animal, animal.title()).split(' '))
        out['en'] = f"My name is {nice}. {rest_en}"
    for lang, prefix, pat in (
        ('yue', '你好呀，小朋友！', r'^(我係|我是)'),
        ('cmn', '你好呀，小朋友！', r'^(我是|我係)'),
    ):
        raw = pack[lang]
        if not raw.startswith(prefix):
            problems.append((animal, lang, raw))
            continue
        text = raw[len(prefix):]
        out[lang] = re.sub(pat, '我叫', text, count=1) if style == 'name' else text
    if len(out) == 3:
        lines[animal] = out

payload = 'window.V5_LINES = ' + json.dumps(lines, ensure_ascii=False, indent=2) + ';\n'
(ROOT / 'v5/assets/v5-lines.js').write_text(payload, encoding='utf-8')
preview = []
preview.append(f'animals {len(ids)} hello {len(hello)} name {sum(1 for a in lines if a in myname)} im {sum(1 for a in lines if a not in myname)}')
preview.append('HELLO ' + ', '.join(sorted(hello)))
preview.append('')
for animal in sorted(lines):
    preview.append(f'[{ "name" if animal in myname else "im" }] {animal}')
    preview.append('  EN ' + lines[animal]['en'])
    preview.append('  YUE ' + lines[animal]['yue'])
    preview.append('  CMN ' + lines[animal]['cmn'])
if problems:
    preview.append('PROBLEMS')
    preview.extend(str(p) for p in problems)
(ROOT / 'v5/assets/voice/preview.txt').write_text('\n'.join(preview), encoding='utf-8')
print(preview[0])
print('problems', len(problems))
print('wrote', len(lines))
