import json, re, pathlib
root = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets")

def grab(name, pattern):
    t = (root / name).read_text(encoding="utf-8")
    m = re.search(pattern, t, re.S)
    if not m:
        print(name, "NO MATCH")
        return {}
    return json.loads(m.group(1))

anims = grab("animation-data.js", r"window\.ANIMAL_ANIMATIONS = (\{.*\});")
# authored is Object.assign second arg
auth_t = (root / "authored-motion-data.js").read_text(encoding="utf-8")
m = re.search(r"Object\.assign\(window\.ANIMAL_ANIMATIONS, (\{.*\})\);", auth_t, re.S)
auth = json.loads(m.group(1)) if m else {}
hoof_t = (root / "hoof-motion-v4-12.js").read_text(encoding="utf-8")
m = re.search(r"const defs=(\{.*?\});", hoof_t, re.S)
hoof = json.loads(m.group(1)) if m else {}
print("hoof keys", list(hoof))
print("auth keys sample", [k for k in auth if k in ("zebra","lioness","warthog","elephant","hippo","gazelle","cow","sheep","rhino","buffalo","lioncub","pig")])
ids = ["zebra","rhino","buffalo","warthog","lioness","lioncub","cow","sheep","pig","calf","lamb","piglet","elephant","hippo","gazelle","cheetah","lion"]
for i in ids:
    src = "hoof" if i in hoof else "auth" if i in auth else "base"
    d = hoof.get(i) or auth.get(i) or anims.get(i) or {}
    cel = d.get("cel") or {}
    frames = d.get("frames") or []
    print(f"{i:10} src={src:4} sheet={bool(d.get('sheet'))} frames={len(frames)} rig={d.get('rig')} walk={d.get('walk')} motion={cel.get('motion')} seq={len(cel.get('sequence') or [])} label={d.get('label')}")
