import json, re, pathlib
p = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets\animation-data.js")
t = p.read_text(encoding="utf-8")
m = re.search(r"window\.ANIMAL_ANIMATIONS = (\{.*\});", t, re.S)
d = json.loads(m.group(1))
for id_ in ("zebra","rhino","buffalo","warthog","lion","lioness","lioncub","elephant","hippo","cheetah","gazelle","cow","sheep","pig","toucan"):
    a = d.get(id_) or {}
    print(id_, {k: a.get(k) for k in ("walk","rig","cel","sheet","travel","duration","label","face")})
