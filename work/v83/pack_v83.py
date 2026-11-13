# -*- coding: utf-8 -*-
"""Bake official V8.3 layout and pack iPad standalone + slim web folder."""
from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals")
WORK = ROOT / "work"
ASSETS = WORK / "assets"
SHARE = ROOT / "share"
V83 = WORK / "v83"
OFFICIAL_JSON = V83 / "official-layout.json"
OFFICIAL_HTML = WORK / "Leonas-Zoo-v8.3.html"
EDITOR_HTML = WORK / "Leonas-Zoo-v8.3-editor.html"
STORE_JS = ASSETS / "v83-layout-store.js"
OFFICIAL_LAYOUT_JS = ASSETS / "v83-official-layout.js"
README = ROOT / "README.md"
SHARE_README = SHARE / "README-分享说明.txt"
WEB_DIR = SHARE / "v8.3-web"
STANDALONE = SHARE / "Leonas-Zoo-v8.3.html"
WEB_ZIP = SHARE / "Leonas-Zoo-v8.3-web.zip"
STANDALONE_ZIP = SHARE / "Leonas-Zoo-v8.3.zip"
USED_LIST = V83 / "used-assets.json"
REPORT = V83 / "pack-report.txt"

EXPECTED_SHA = "E1B274F54D2DAE151181D954FA545176D3F0B02501E8BE0F774AC45A3FEAEAA8"
ACTIVE_SCENES = ("savanna", "rainforest", "ocean", "farm", "music")
DROP_PREFIXES = (
    "assets/chapters-v4-10/",
    "assets/chapters-v4-11/",
    "assets/exploration-v4-8/",
    "assets/chapters-v4-9/planets/",
    "assets/chapters-v4-9/hongkong/",
    "assets/chapters-v4-9/supermarket/",
    "assets/chapters-v4-9/beach/",
    "assets/chapters-v4-9/weather/",
    "assets/bg/reference/",
    "assets/bg/arctic",
    "assets/bg/antarctic",
    "assets/bg/market",
    "assets/bg/farm-v4-2",
    "assets/market-v4-7-1/",
)
# Always include these even if only constructed at runtime.
ALWAYS_GLOBS = [
    "bg/v83/*-forward.png",
    "animals/v83/*",
    "animals/v8/*",
    "animals/v7-1/*/*",
    "audio/v83/*.mp3",
    "fonts/fredoka.ttf",
]
HARDCODED = [
    "assets/animation/v4-2/acacia.webp",
    "assets/animation/support-tree-v4.webp",
    "assets/animation/v4-1/reeffish-poster.webp",
    "assets/fonts/fredoka.ttf",
]

MIME = {
    ".png": "image/png",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".json": "application/json",
}


def log(msg: str) -> None:
    print(msg, flush=True)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def html_tags(html: str) -> list[str]:
    return re.findall(r"<(?:script|link)[^>]+(?:src|href)=[\"']([^\"']+)[\"']", html)


def strip_query(p: str) -> str:
    return p.split("?", 1)[0].replace("\\", "/")


def bake_official() -> dict:
    data = json.loads(OFFICIAL_JSON.read_text(encoding="utf-8"))
    digest = sha256(OFFICIAL_JSON)
    if digest != EXPECTED_SHA:
        raise SystemExit(f"official-layout.json SHA mismatch:\n  got  {digest}\n  want {EXPECTED_SHA}")
    counts = {sid: len(lst) for sid, lst in data["scenes"].items()}
    total = sum(counts.values())
    log(f"official-layout.json OK  sha256={digest}  animals={total}  {counts}")

    official_js = (
        "/* Baked official V8.3 layout. Play mode uses this instead of localStorage. */\n"
        "window.V8_OFFICIAL_LAYOUT="
        + json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        + ";\n"
    )
    write(OFFICIAL_LAYOUT_JS, official_js)
    log(f"wrote {OFFICIAL_LAYOUT_JS.relative_to(ROOT)} ({OFFICIAL_LAYOUT_JS.stat().st_size} bytes)")

    store = read(STORE_JS).replace('\r\n','\n')
    if "V8_OFFICIAL_LAYOUT" not in store:
        old = (
            " let loadError='',lastSavedAt='';try{const saved=localStorage.getItem(key);if(saved)lastSavedAt=JSON.parse(saved).savedAt||'';if(saved)for(const [sid,list]of Object.entries(decode(JSON.parse(saved))))scenes[sid].animals=list;}catch(e){loadError='保存的布局未能读取，已显示原布局。';}\n"
            " const editing=document.documentElement?.dataset.layoutEditor==='true'||new URLSearchParams(g.location?.search||'').get('edit')==='1';\n"
            " if(editing&&document.documentElement)document.documentElement.dataset.layoutEditor='true';"
        )
        new = (
            " const editing=document.documentElement?.dataset.layoutEditor==='true'||new URLSearchParams(g.location?.search||'').get('edit')==='1';\n"
            " if(editing&&document.documentElement)document.documentElement.dataset.layoutEditor='true';\n"
            " let loadError='',lastSavedAt='';\n"
            " if(editing){try{const saved=localStorage.getItem(key);if(saved)lastSavedAt=JSON.parse(saved).savedAt||'';if(saved)for(const [sid,list]of Object.entries(decode(JSON.parse(saved))))scenes[sid].animals=list;}catch(e){loadError='保存的布局未能读取，已显示原布局。';}}\n"
            " else if(g.V8_OFFICIAL_LAYOUT){try{for(const [sid,list]of Object.entries(decode(g.V8_OFFICIAL_LAYOUT)))scenes[sid].animals=list;}catch(e){loadError='正式布局未能读取，已显示原布局。';}}"
        )
        if old not in store:
            raise SystemExit("v83-layout-store.js load/editing block not found; refusing to patch blindly")
        store = store.replace(old, new, 1)
        write(STORE_JS, store)
        log("patched v83-layout-store.js (localStorage only in editor; official bake in play)")
    else:
        log("v83-layout-store.js already has official-layout hook")

    html = read(OFFICIAL_HTML).replace('\r\n','\n')
    # Remove default editor CSS/JS; load them only for ?edit=1 so editor.html file: redirect still works.
    html = html.replace(
        '<link rel="stylesheet" href="assets/v83.css"><link rel="stylesheet" href="assets/v83-editor.css?v=direct2"></head>',
        '<link rel="stylesheet" href="assets/v83.css">\n'
        '<script>(function(){if(new URLSearchParams(location.search).get("edit")==="1"){document.documentElement.dataset.layoutEditor="true";const l=document.createElement("link");l.rel="stylesheet";l.href="assets/v83-editor.css";document.head.append(l);}})();</script></head>',
    )
    html = html.replace(
        '<script src="assets/v83-art.js"></script><script src="assets/v83-layout-store.js?v=direct2"></script>',
        '<script src="assets/v83-art.js"></script><script src="assets/v83-official-layout.js"></script><script src="assets/v83-layout-store.js?v=direct2"></script>',
    )
    html = html.replace(
        '<aside class="version-links">V8.3 · <a href="Leonas-Zoo-v8.3-editor.html">自己排动物</a></aside><script src="assets/v83-layout-editor.js?v=direct2"></script></body></html>',
        '<aside class="version-links">V8.3 正式版 · <a href="Leonas-Zoo-v8.3-editor.html">自己排动物</a></aside>\n'
        '<script>if(document.documentElement.dataset.layoutEditor==="true"){const s=document.createElement("script");s.src="assets/v83-layout-editor.js";document.body.append(s);}</script></body></html>',
    )
    if "v83-official-layout.js" not in html:
        raise SystemExit("failed to bake official HTML (official-layout script missing after patch)")
    if "v83-editor.css?v=direct2" in html or "v83-layout-editor.js?v=direct2" in html:
        raise SystemExit("failed to remove default editor assets from official HTML")
    if "<title>Leona's ZOO · V8.3</title>" not in html:
        raise SystemExit("official title is not V8.3")
    write(OFFICIAL_HTML, html)
    log(f"updated official play HTML {OFFICIAL_HTML.relative_to(ROOT)}")
    return data


def update_readmes() -> None:
    write(
        README,
        """# toddler-animals / Leona's Zoo

最新正式版是 **V8.3**。原来的 **V8 / V8.2** 保留。编辑器仍可用来自己排动物，不会改掉正式版默认布局。

## V8.3 正式版（打开这个玩）
- 电脑游玩：[`work/Leonas-Zoo-v8.3.html`](work/Leonas-Zoo-v8.3.html)（已写入编辑后的正式布局；全新设备不依赖 localStorage）
- 自己排动物：[`work/Leonas-Zoo-v8.3-editor.html`](work/Leonas-Zoo-v8.3-editor.html)（仍然使用浏览器 localStorage，可保存、导入导出）
- iPad / 离线单文件：[`share/Leonas-Zoo-v8.3.html`](share/Leonas-Zoo-v8.3.html)
- 网站上传（瘦身文件夹）：[`share/v8.3-web/`](share/v8.3-web/) 或 [`share/Leonas-Zoo-v8.3-web.zip`](share/Leonas-Zoo-v8.3-web.zip)

### 在 iPad 上打开单文件
1. 用隔空投送（AirDrop）把 `share/Leonas-Zoo-v8.3.html` 发到 iPad，在“文件”里保存。
2. 用 **Safari** 打开该文件（在“文件”中点分享 → 用 Safari 打开，或先把文件拷进 iCloud/文件后用 Safari 打开）。
3. 可在 Safari 用“添加到主屏幕”，当成小 App 使用。第一次要点一下画面，背景音才会开始播放。
4. 若单文件太大、Safari 打不开，改用下面的网页文件夹/网上传版。

## V2（可分享单页，旧版）
- 打开：`share/Leonas-Zoo-v2.html`
- 同目录：`Leonas-Zoo-v2.zip`、`runtime-v2/`

## V8.2 / V8（保留版）
- V8.2 游玩：`work/Leonas-Zoo-v8.2.html`
- V8 主入口：`work/Leonas-Zoo-v8.html`

## 文件夹
- `work/` — 正在改的工程
- `share/` — 给别人打开的分享包
- `Archive/` — 过程版

打开预览请强制刷新（Ctrl+F5）。
""",
    )
    write(
        SHARE_README,
        """Leona's Zoo V8.3

English
- iPad / offline single file: open Leonas-Zoo-v8.3.html in Safari (AirDrop it into the Files app first).
- Website upload: unzip Leonas-Zoo-v8.3-web.zip and upload the folder (index.html + assets/). Then open it like a normal webpage.
- If the single file is too large for iPad Safari, use the web folder instead.

中文
- iPad / 离线单文件：把 Leonas-Zoo-v8.3.html 隔空投送到 iPad，在“文件”里用 Safari 打开。
- 网站上传：解压 Leonas-Zoo-v8.3-web.zip，把整个文件夹（index.html 和 assets/）拖到静态托管即可。
- 若单文件太大、Safari 打不开，请改用网页文件夹版。

V2 (old): Leonas-Zoo-v2.html
""",
    )
    log("updated README.md and share/README-分享说明.txt")


def path_from_text(text: str) -> set[str]:
    found = set()
    for m in re.finditer(
        r"(?:assets/|fonts/)[A-Za-z0-9_./\-]+\.(?:png|webp|jpg|jpeg|gif|svg|mp3|wav|ogg|m4a|mp4|webm|woff2?|ttf|otf|json)",
        text,
    ):
        found.add(strip_query(m.group(0)))
    return found


def resolve_asset_path(p: str, css_file: Path | None = None) -> str:
    p = strip_query(p)
    if p.startswith("data:"):
        return p
    if p.startswith("fonts/"):
        return "assets/" + p
    if not p.startswith("assets/") and css_file is not None:
        resolved = (css_file.parent / p).resolve()
        try:
            return resolved.relative_to(WORK.resolve()).as_posix()
        except Exception:
            return "assets/" + p.lstrip("./")
    return p


def collect_static(html: str, keep_ids: set[str]) -> set[str]:
    used: set[str] = set(HARDCODED)
    tags = html_tags(html)
    for tag in tags:
        rel = strip_query(tag)
        if rel.startswith("data:"):
            continue
        fp = WORK / rel
        if not fp.exists():
            continue
        text = read(fp)
        if fp.suffix == ".css":
            for u in re.findall(r"url\([\"']?([^)\"']+)[\"']?\)", text):
                if u.startswith("data:"):
                    continue
                used.add(resolve_asset_path(u, fp))
        used |= {resolve_asset_path(p) for p in path_from_text(text)}

    for pattern in ALWAYS_GLOBS:
        for fp in ASSETS.glob(pattern):
            if fp.is_file():
                used.add(fp.relative_to(WORK).as_posix())

    # Filter unused chapter/exploration/old-bg trees.
    filtered = set()
    dropped = 0
    for p in used:
        if any(p.startswith(pref) for pref in DROP_PREFIXES):
            dropped += 1
            continue
        filtered.add(p)
    log(f"static collect {len(used)} -> {len(filtered)} after dropping {dropped} unused-prefix files")

    # If a voice/call path's animal id is obvious and not in keep_ids, drop it — but only under voice/.
    # Keep all v7-1 (preloaded at startup) and all v83 art already added.
    kept = set()
    voice_dropped = 0
    for p in filtered:
        parts = p.split("/")
        if len(parts) >= 4 and parts[1] == "voice":
            # assets/voice/<ver>/<id>-en.mp3 or <id>-cmn-male.mp3
            name = Path(p).stem
            aid = name.split("-")[0]
            if keep_ids and aid not in keep_ids and not aid.startswith("music"):
                voice_dropped += 1
                continue
        kept.add(p)
    log(f"dropped {voice_dropped} voice files for animals not in official layout")
    return kept


def file_url(path: Path) -> str:
    return "file:///" + path.resolve().as_posix().replace(" ", "%20")


def chrome_exe() -> Path | None:
    for p in (
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    ):
        if p.exists():
            return p
    return None


DUMP_JS = r"""
<script>
(function(){
  const urls = new Set();
  const add = (p) => {
    if (typeof p === 'string' && /assets\/|\.png|\.webp|\.jpe?g|\.gif|\.svg|\.mp3|\.wav|\.ttf|\.woff/.test(p) && !p.startsWith('data:')) {
      urls.add(p.split('?')[0].replace(/\\/g,'/'));
    }
  };
  const walk = (o, d) => {
    if (o == null || d > 8) return;
    if (typeof o === 'string') { add(o); return; }
    if (typeof o !== 'object') return;
    if (o.nodeType || o === window || o === document) return;
    if (Array.isArray(o)) { for (const x of o) walk(x, d+1); return; }
    try { for (const v of Object.values(o)) walk(v, d+1); } catch (e) {}
  };
  const order = window.GAME_SCENE_ORDER || [];
  const ids = new Set();
  for (const sid of order) {
    const sc = window.GAME_SCENES && window.GAME_SCENES[sid];
    walk(sc, 0);
    for (const a of (sc && sc.animals) || []) ids.add(a.id);
  }
  document.documentElement.dataset.dumpIds = JSON.stringify([...ids].sort());
  document.documentElement.dataset.dumpOrder = JSON.stringify(order);
  const counts = {};
  for (const sid of order) counts[sid] = (window.GAME_SCENES[sid].animals||[]).length;
  document.documentElement.dataset.dumpCounts = JSON.stringify(counts);
  for (const id of ids) {
    walk(window.ANIMAL_ANIMATIONS && window.ANIMAL_ANIMATIONS[id], 0);
    walk(window.V8_STORYBOARDS && window.V8_STORYBOARDS[id], 0);
    walk(window.GAME_DIALOGUE && window.GAME_DIALOGUE[id], 0);
    walk(window.CALL_RECORDINGS && window.CALL_RECORDINGS[id], 0);
    walk(window.CHAPTER_CALL_RECORDINGS && window.CHAPTER_CALL_RECORDINGS[id], 0);
    walk(window.QUADRUPED_FULLBODY_V74 && window.QUADRUPED_FULLBODY_V74.animals && window.QUADRUPED_FULLBODY_V74.animals[id], 0);
    walk(window.V83_SONGS && window.V83_SONGS[id], 0);
  }
  ['assets/animation/v4-2/acacia.webp','assets/animation/support-tree-v4.webp','assets/animation/v4-1/reeffish-poster.webp','assets/fonts/fredoka.ttf'].forEach(add);
  const pre = document.createElement('pre');
  pre.id = 'USED_ASSETS_DUMP';
  pre.textContent = JSON.stringify({order, counts, ids:[...ids].sort(), urls:[...urls].sort()}, null, 2);
  document.documentElement.replaceChildren(pre);
})();
</script>
"""


def collect_chrome(official_data: dict) -> tuple[set[str], dict]:
    exe = chrome_exe()
    meta = {}
    if not exe:
        log("Chrome/Edge not found; skipping runtime dump")
        return set(), meta
    dump_html = V83 / "_dump-used-assets.html"
    html = read(OFFICIAL_HTML)
    # Play mode, no editor. Scripts are relative to work/, so write dump next to official or fix paths.
    # Write into work/ so relative assets/ resolve.
    dump_html = WORK / "_dump-used-assets.html"
    write(dump_html, html.replace("</body>", DUMP_JS + "</body>"))
    out_dir = V83 / "_chrome-dump"
    out_dir.mkdir(exist_ok=True)
    dump_out = out_dir / "dom.html"
    cmd = [
        str(exe),
        "--headless=new",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--no-first-run",
        "--no-default-browser-check",
        "--allow-file-access-from-files",
        "--virtual-time-budget=20000",
        "--dump-dom",
        file_url(dump_html),
    ]
    log("running " + exe.name + " headless dump-dom")
    try:
        proc = subprocess.run(cmd, capture_output=True, timeout=90)
    except Exception as e:
        log(f"chrome dump failed: {e}")
        return set(), meta
    text = proc.stdout.decode("utf-8", "replace")
    dump_out.write_text(text, encoding="utf-8")
    (out_dir / "stderr.txt").write_text(proc.stderr.decode("utf-8", "replace"), encoding="utf-8")
    m = re.search(r'<pre id="USED_ASSETS_DUMP">([^<]+)</pre>', text)
    if not m:
        # maybe unescaped or pretty-printed differently
        m = re.search(r"USED_ASSETS_DUMP[^\n]*\n?([\s\S]+)", text)
        raw = m.group(1) if m else text
        # try to find JSON
        start = raw.find("{")
        end = raw.rfind("}")
        blob = raw[start : end + 1] if start >= 0 and end > start else ""
    else:
        blob = m.group(1)
        blob = (
            blob.replace("&quot;", '"')
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
        )
    urls: set[str] = set()
    if blob:
        try:
            payload = json.loads(blob)
            urls = {strip_query(u) if isinstance(u, str) and u.startswith("assets/") else strip_query(u) for u in payload.get("urls", [])}
            urls = {u for u in urls if u.startswith("assets/") or u.startswith("fonts/")}
            meta = {k: payload.get(k) for k in ("order", "counts", "ids")}
            log(f"chrome dump urls={len(urls)} order={meta.get('order')} counts={meta.get('counts')}")
        except Exception as e:
            log(f"could not parse chrome dump JSON: {e}")
    else:
        log("chrome dump-dom did not contain JSON payload")
    return urls, meta


def normalize_used(paths: set[str]) -> tuple[list[Path], list[str]]:
    files = []
    missing = []
    seen = set()
    for p in sorted(paths):
        p = strip_query(p)
        if p.startswith("fonts/"):
            p = "assets/" + p
        fp = WORK / p
        if fp.exists() and fp.is_file():
            key = fp.resolve()
            if key in seen:
                continue
            seen.add(key)
            files.append(fp)
        else:
            missing.append(p)
    return files, missing


def size_report(files: list[Path]) -> str:
    groups = defaultdict(lambda: [0, 0])
    total = 0
    for fp in files:
        rel = fp.relative_to(WORK).as_posix()
        key = "/".join(rel.split("/")[:3])
        sz = fp.stat().st_size
        groups[key][0] += sz
        groups[key][1] += 1
        total += sz
    lines = [f"USED FILES {len(files)}  {total/1e6:.2f} MB  (base64 ~ {total*4/3/1e6:.2f} MB)"]
    for k, (sz, n) in sorted(groups.items(), key=lambda kv: -kv[1][0]):
        lines.append(f"  {sz/1e6:8.2f} MB  {n:5}  {k}")
    return "\n".join(lines), total


def build_web(html: str, files: list[Path]) -> None:
    if WEB_DIR.exists():
        shutil.rmtree(WEB_DIR)
    WEB_DIR.mkdir(parents=True)
    # official play HTML without editor link (folder may be uploaded alone)
    web_html = html
    web_html = re.sub(
        r'<aside class="version-links">.*?</aside>\s*',
        '<aside class="version-links">V8.3 正式版</aside>\n',
        web_html,
        count=1,
        flags=re.S,
    )
    # remove edit-only loader? harmless if left; remove for cleanliness
    web_html = re.sub(
        r'<script>\(function\(\)\{if\(new URLSearchParams\(location\.search\)\.get\("edit"\)==="1"\).*?</script>',
        "",
        web_html,
        count=1,
        flags=re.S,
    )
    web_html = re.sub(
        r'<script>if\(document\.documentElement\.dataset\.layoutEditor==="true"\).*?</script>',
        "",
        web_html,
        count=1,
        flags=re.S,
    )
    write(WEB_DIR / "index.html", web_html)
    for fp in files:
        dest = WEB_DIR / fp.relative_to(WORK)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(fp, dest)
    # also copy the play scripts/css referenced by HTML (not just media)
    for tag in html_tags(web_html):
        rel = strip_query(tag)
        if rel.startswith("data:"):
            continue
        src = WORK / rel
        if src.exists() and src.is_file():
            dest = WEB_DIR / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
    readme = WEB_DIR / "README.txt"
    write(
        readme,
        "Upload this whole folder (index.html + assets/) to any static host.\n"
        "Then open index.html like a normal webpage.\n"
        "把整个文件夹（index.html 和 assets/）上传到静态网站即可。\n",
    )
    log(f"built {WEB_DIR}")


def data_uri(fp: Path) -> str:
    ext = fp.suffix.lower()
    mime = MIME.get(ext) or mimetypes.guess_type(fp.name)[0] or "application/octet-stream"
    import base64

    b64 = base64.b64encode(fp.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b64}"


RESOLVE_HOOK = r"""
window.ASSET=window.ASSET||{};
window.resolveAsset=function(p){
  if(typeof p!=='string'||!p)return p;
  if(/^(data:|blob:|https?:|file:|#|javascript:)/i.test(p))return p;
  var noq=p.split('?')[0].replace(/\\/g,'/');
  var keys=[p,noq];
  if(noq.indexOf('./')===0)keys.push(noq.slice(2));
  if(noq.indexOf('fonts/')===0)keys.push('assets/'+noq);
  for(var i=0;i<keys.length;i++)if(window.ASSET[keys[i]])return window.ASSET[keys[i]];
  return p;
};
(function(){
  function hook(proto,prop){
    var desc=Object.getOwnPropertyDescriptor(proto,prop);
    if(!desc||!desc.set)return;
    Object.defineProperty(proto,prop,{configurable:true,enumerable:desc.enumerable,get:function(){return desc.get.call(this);},set:function(v){desc.set.call(this,window.resolveAsset(v));}});
  }
  hook(HTMLImageElement.prototype,'src');
  hook(HTMLAudioElement.prototype,'src');
})();
"""


def inline_css(text: str, css_file: Path, asset_uris: dict[str, str]) -> str:
    def repl(m):
        raw = m.group(1).strip("\"'")
        if raw.startswith("data:"):
            return m.group(0)
        rel = resolve_asset_path(raw, css_file)
        uri = asset_uris.get(rel)
        if not uri:
            return m.group(0)
        return f'url("{uri}")'

    return re.sub(r"url\(([^)]+)\)", repl, text)


def build_standalone(html: str, files: list[Path]) -> int:
    # Map work-relative posix path -> data URI
    log("encoding data URIs for standalone...")
    asset_uris: dict[str, str] = {}
    total_raw = 0
    for fp in files:
        rel = fp.relative_to(WORK).as_posix()
        asset_uris[rel] = data_uri(fp)
        total_raw += fp.stat().st_size
    log(f"encoded {len(asset_uris)} files, raw {total_raw/1e6:.2f} MB")

    # Play-only HTML: drop editor loaders and editor link
    standalone_html = html
    standalone_html = re.sub(
        r'<aside class="version-links">.*?</aside>\s*',
        '<aside class="version-links">V8.3 正式版</aside>\n',
        standalone_html,
        count=1,
        flags=re.S,
    )
    standalone_html = re.sub(
        r'<script>\(function\(\)\{if\(new URLSearchParams\(location\.search\)\.get\("edit"\)==="1"\).*?</script>',
        "",
        standalone_html,
        count=1,
        flags=re.S,
    )
    standalone_html = re.sub(
        r'<script>if\(document\.documentElement\.dataset\.layoutEditor==="true"\).*?</script>',
        "",
        standalone_html,
        count=1,
        flags=re.S,
    )

    # Collect CSS and JS in document order
    css_parts = []
    js_parts = [RESOLVE_HOOK]
    # ASSET map as its own script for easier scanning
    asset_js_chunks = ["window.ASSET=Object.assign(window.ASSET||{},{"]
    first = True
    for rel, uri in asset_uris.items():
        # escape
        key = json.dumps(rel, ensure_ascii=False)
        val = json.dumps(uri, ensure_ascii=False)
        sep = "" if first else ","
        asset_js_chunks.append(f"{sep}{key}:{val}")
        first = False
    asset_js_chunks.append("});")
    asset_map = "".join(asset_js_chunks)

    def replace_tag(m):
        tag = m.group(0)
        href = re.search(r"(?:src|href)=[\"']([^\"']+)[\"']", tag)
        if not href:
            return tag
        rel = strip_query(href.group(1))
        if rel.startswith("data:"):
            return tag
        fp = WORK / rel
        if not fp.exists():
            log(f"WARNING missing tag file {rel}")
            return tag
        if fp.suffix == ".css" or "stylesheet" in tag:
            css_parts.append(inline_css(read(fp), fp, asset_uris))
            return ""
        if fp.suffix == ".js" or tag.lower().startswith("<script"):
            js_parts.append(read(fp))
            return ""
        return tag

    # only replace script/link to local assets
    body = re.sub(
        r'<(?:link[^>]+href=["\']assets/[^"\']+["\'][^>]*>|script[^>]+src=["\']assets/[^"\']+["\'][^>]*>\s*</script>)',
        replace_tag,
        standalone_html,
        flags=re.I,
    )
    style_block = "<style>\n" + "\n".join(css_parts) + "\n</style>"
    script_block = (
        "<script>\n"
        + asset_map
        + "\n</script>\n<script>\n"
        + "\n".join(js_parts)
        + "\n</script>"
    )
    # insert styles before </head>, scripts before </body>
    if "</head>" not in body:
        raise SystemExit("standalone HTML missing </head>")
    body = body.replace("</head>", style_block + "</head>", 1)
    if "</body>" not in body:
        raise SystemExit("standalone HTML missing </body>")
    body = body.replace("</body>", script_block + "</body>", 1)
    write(STANDALONE, body)
    sz = STANDALONE.stat().st_size
    log(f"wrote standalone {STANDALONE}  {sz} bytes  ({sz/1e6:.2f} MB)")
    return sz


def zip_dir(src: Path, dest: Path) -> None:
    if dest.exists():
        dest.unlink()
    with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for fp in src.rglob("*"):
            if fp.is_file():
                zf.write(fp, fp.relative_to(src).as_posix())
    log(f"zipped folder {dest} ({dest.stat().st_size/1e6:.2f} MB)")


def zip_file(src: Path, dest: Path) -> None:
    if dest.exists():
        dest.unlink()
    with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        zf.write(src, src.name)
    log(f"zipped file {dest} ({dest.stat().st_size/1e6:.2f} MB)")


def smoke(official_data: dict, files: list[Path], missing: list[str], standalone_size: int) -> str:
    lines = []
    html = read(OFFICIAL_HTML)
    need = [
        "assets/v83-official-layout.js",
        "assets/v83-layout-store.js",
        "assets/game-v8-3.js",
        "assets/v83-art.js",
        "assets/v83-backgrounds.js",
        "assets/v83-songs.js",
        "assets/chapter-sounds-v8-3.js",
    ]
    for n in need:
        ok = n in html
        lines.append(f"official HTML has {n}: {'YES' if ok else 'NO'}")
        if not ok:
            lines.append("  ERROR missing required script")
    # editor not default-loaded
    if "v83-layout-editor.js?v=direct2" in html or 'href="assets/v83-editor.css?v=direct2"' in html:
        lines.append("ERROR official HTML still default-loads editor assets")
    else:
        lines.append("official HTML does not default-load editor CSS/JS: YES")
    if "V8_OFFICIAL_LAYOUT" in read(STORE_JS) and "editing" in read(STORE_JS):
        lines.append("layout-store play vs editor branch: YES")
    # baked counts
    store_js_has = "V8_OFFICIAL_LAYOUT" in read(OFFICIAL_LAYOUT_JS)
    baked = json.loads(read(OFFICIAL_LAYOUT_JS).split("=", 1)[1].rstrip().rstrip(";"))
    for sid, lst in official_data["scenes"].items():
        b = len(baked["scenes"][sid])
        lines.append(f"baked {sid}: {b}  json: {len(lst)}  {'OK' if b==len(lst) else 'MISMATCH'}")
    lines.append(f"baked total {sum(len(v) for v in baked['scenes'].values())}  json total {sum(len(v) for v in official_data['scenes'].values())}")

    # slim folder completeness
    slim_missing = []
    for fp in files:
        dest = WEB_DIR / fp.relative_to(WORK)
        if not dest.exists():
            slim_missing.append(fp.relative_to(WORK).as_posix())
    # also HTML script tags
    web_html = read(WEB_DIR / "index.html")
    for tag in html_tags(web_html):
        rel = strip_query(tag)
        if rel.startswith("data:"):
            continue
        if not (WEB_DIR / rel).exists():
            slim_missing.append(rel)
    lines.append(f"slim folder missing used files: {len(slim_missing)}")
    for m in slim_missing[:30]:
        lines.append(f"  missing {m}")
    lines.append(f"collect missing on disk: {len(missing)}")
    for m in missing[:30]:
        lines.append(f"  absent {m}")

    st = read(STANDALONE)
    leftover = []
    for pat, label in [
        (r'src="assets/', "src=\"assets/"),
        (r"src='assets/", "src='assets/"),
        (r'href="assets/', "href=\"assets/"),
        (r"href='assets/", "href='assets/"),
    ]:
        leftover.extend(re.findall(pat, st))
    # CSS url leftover relative assets
    css_left = re.findall(r"url\((['\"]?)(?!data:)([^)\"']+)\1\)", st)
    css_rel = [u[1] for u in css_left if "assets/" in u[1] or u[1].startswith("fonts/")]
    lines.append(f"standalone leftover src/href assets/ tags: {len(leftover)}")
    lines.append(f"standalone leftover css url relative assets: {len(css_rel)}")
    for u in css_rel[:10]:
        lines.append(f"  css {u}")
    if standalone_size > 80 * 1000 * 1000:
        lines.append(
            f"WARNING standalone is {standalone_size/1e6:.2f} MB, iPad Safari may choke (>80-100 MB). Prefer the slim web folder."
        )
    else:
        lines.append(f"standalone size {standalone_size/1e6:.2f} MB (under 80 MB raw file size)")
    # no lighter reintroduced
    if "globalCompositeOperation='lighter'" in st or 'globalCompositeOperation="lighter"' in st:
        lines.append("ERROR standalone reintroduced walk lighter composite")
    else:
        lines.append("no walk 'lighter' composite: YES")
    return "\n".join(lines)


def cleanup_temp() -> None:
    temps = [
        V83 / "inspect_paths.py",
        V83 / "extract_slices.py",
        V83 / "find_asset.py",
        V83 / "find_src_loads.py",
        V83 / "inspect_motion.py",
        V83 / "_literal_paths.json",
        V83 / "_slices.txt",
        V83 / "_asset_usage.txt",
        V83 / "_motion_and_v71.txt",
        V83 / "_src_loads.txt",
        WORK / "_dump-used-assets.html",
    ]
    for p in temps:
        if p.exists():
            p.unlink()
            log(f"removed temp {p.name}")
    dump_dir = V83 / "_chrome-dump"
    if dump_dir.exists():
        shutil.rmtree(dump_dir)
        log("removed _chrome-dump")


def main() -> None:
    official = bake_official()
    update_readmes()
    keep_ids = set()
    for lst in official["scenes"].values():
        for a in lst:
            keep_ids.add(a["id"])
    log(f"official unique animal ids: {len(keep_ids)}")

    html = read(OFFICIAL_HTML)
    static_paths = collect_static(html, keep_ids)
    chrome_paths, chrome_meta = collect_chrome(official)
    used = set(static_paths) | set(chrome_paths)
    # Re-apply drop prefixes to chrome extras
    used = {p for p in used if not any(p.startswith(pref) for pref in DROP_PREFIXES)}
    files, missing = normalize_used(used)
    report, total = size_report(files)
    log(report)
    USED_LIST.write_text(
        json.dumps(
            {
                "files": [fp.relative_to(WORK).as_posix() for fp in files],
                "missing": missing,
                "chrome_meta": chrome_meta,
                "raw_bytes": total,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    build_web(html, files)
    zip_dir(WEB_DIR, WEB_ZIP)
    standalone_size = build_standalone(html, files)
    zip_file(STANDALONE, STANDALONE_ZIP)
    smoke_text = smoke(official, files, missing, standalone_size)
    log(smoke_text)
    write(
        REPORT,
        report
        + "\n\n"
        + smoke_text
        + "\n\nkeep_ids="
        + str(sorted(keep_ids))
        + "\nchrome_meta="
        + json.dumps(chrome_meta, ensure_ascii=False)
        + "\n",
    )
    cleanup_temp()
    log("DONE")


if __name__ == "__main__":
    main()
