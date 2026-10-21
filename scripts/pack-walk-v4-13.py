"""Register and pack complete original walk cels, without limb reconstruction.

The source PNGs remain unchanged. A panel receives one uniform body-landmark
scale and translation. All panels then share one output canvas/scale. Foot
coordinates are only measurements; they never enter the registration fit.
"""
from pathlib import Path
import argparse, hashlib, json, math, re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'v4-13/assets/animation/walk-v4-13'
SOURCE = OUT / 'source'
QA = OUT / 'qa'
QA.mkdir(parents=True, exist_ok=True)
LANDMARKS = {'zebra': {
    'nearEye': [111, 132], 'nearEar': [151, 28],
    'shoulderBack': [328, 180], 'hipBack': [439, 167],
    'tailRoot': [538, 218],
}, 'rhino': {
    'nearEye': [171, 296], 'nearEar': [234, 160],
    'shoulderBack': [360, 217], 'hipBack': [475, 212],
    'tailRoot': [560, 272],
}}
RADII = {'nearEye': (21, 20), 'nearEar': (17, 18),
         'shoulderBack': (28, 22), 'hipBack': (27, 22), 'tailRoot': (22, 26)}
WEIGHTS = {'nearEye': 4, 'nearEar': 2, 'shoulderBack': 2, 'hipBack': 4, 'tailRoot': 2}
TOUCH = {'nearHind': 0, 'nearFore': 4, 'farHind': 8, 'farFore': 12}


def opaque_bounds(image, threshold=16):
    return image.getchannel('A').point(lambda a: 255 if a >= threshold else 0).getbbox()


def edge_counts(image, threshold=16):
    a = np.asarray(image.getchannel('A')) >= threshold
    return {'left': int(a[:, 0].sum()), 'right': int(a[:, -1].sum()),
            'top': int(a[0].sum()), 'bottom': int(a[-1].sum())}


def safe_grid(image):
    """Split a 2x2 sheet only inside genuinely alpha-empty central gutters."""
    a = np.asarray(image.getchannel('A')) >= 16
    cuts, gaps = [], []
    for axis, length in ((0, image.width), (1, image.height)):
        counts = a.sum(axis=axis)
        loc = np.arange(length)
        zero = np.where((counts == 0) & (loc > length * .35) & (loc < length * .65))[0]
        groups = np.split(zero, np.where(np.diff(zero) != 1)[0] + 1)
        groups = [g for g in groups if len(g) >= 4]
        if not groups:
            raise ValueError('No alpha-empty 2x2 gutter; manual safe crop required')
        gap = max(groups, key=len)
        cuts.append(int((int(gap[0]) + int(gap[-1])) // 2))
        gaps.append([int(gap[0]), int(gap[-1])])
    x, y = cuts
    return [[0, 0, x, y], [x, 0, image.width, y],
            [0, y, x, image.height], [x, y, image.width, image.height]], gaps


def gray(image):
    bg = Image.new('RGBA', image.size, (243, 245, 248, 255))
    bg.alpha_composite(image)
    return np.asarray(bg.convert('L'), dtype=float)


def ncc(search, template):
    th, tw = template.shape
    h, w = search.shape
    if h < th or w < tw:
        return None
    zero = template - template.mean()
    shape = (h + th - 1, w + tw - 1)
    cross = np.fft.irfft2(np.fft.rfft2(search, shape) *
                         np.fft.rfft2(zero[::-1, ::-1], shape), s=shape)[th-1:h, tw-1:w]
    def sums(arr):
        it = np.pad(arr, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
        return it[th:, tw:] - it[:-th, tw:] - it[th:, :-tw] + it[:-th, :-tw]
    total = sums(search)
    variance = np.maximum(sums(search * search) - total * total / (th * tw), 1e-9)
    return cross / np.sqrt(variance * np.sum(zero * zero))


def match(image, reference, point, radius, ratio, expected, search_radius):
    rx, ry = radius
    patch = reference.crop((point[0]-rx, point[1]-ry, point[0]+rx+1, point[1]+ry+1))
    patch = patch.resize((max(3, round(patch.width*ratio)), max(3, round(patch.height*ratio))), Image.Resampling.LANCZOS)
    ox, oy = rx * ratio, ry * ratio
    left = max(0, int(expected[0]-ox-search_radius))
    top = max(0, int(expected[1]-oy-search_radius))
    right = min(image.width, int(expected[0]-ox+search_radius+patch.width+1))
    bottom = min(image.height, int(expected[1]-oy+search_radius+patch.height+1))
    scores = ncc(gray(image.crop((left, top, right, bottom))), gray(patch))
    if scores is None:
        return [0., 0.], -1.
    y, x = np.unravel_index(np.argmax(scores), scores.shape)
    return [left+x+ox, top+y+oy], float(scores[y, x])


def fit_body(source, target, weights):
    sc = np.average(source, axis=0, weights=weights)
    tc = np.average(target, axis=0, weights=weights)
    cs = source-sc
    scale = float(np.sum(weights[:, None]*cs*(target-tc)) / np.sum(weights[:, None]*cs*cs))
    shift = tc-scale*sc
    residual = source*scale+shift-target
    rms = float(np.sqrt(np.average(np.sum(residual*residual, axis=1), weights=weights)))
    return scale, shift, residual, rms


def body_match(image, reference, reference_points, manual):
    eye = reference_points['nearEye']
    eye_best = None
    rb, ib = opaque_bounds(reference), opaque_bounds(image)
    rough = (ib[2]-ib[0])/(rb[2]-rb[0])
    # Outer bounds only seed a broad search. They never determine final scale,
    # position, limb paths, ground alignment or the complete output viewport.
    ratios = sorted(set([1., rough] + [round(v, 3) for v in np.arange(.64, 1.73, .025)]))
    for ratio in ratios:
        expected = [ib[0]+(eye[0]-rb[0])*ratio, ib[1]+(eye[1]-rb[1])*ratio]
        found, score = match(image, reference, eye, RADII['nearEye'], ratio, expected, 68)
        if eye_best is None or score > eye_best[0]:
            eye_best = (score, ratio, found)
    score, ratio, found_eye = eye_best
    points, scores = {}, {}
    for key, point in reference_points.items():
        if key in manual:
            points[key], scores[key] = manual[key], 'manual anatomical correspondence'
        elif key == 'nearEye':
            points[key], scores[key] = found_eye, round(score, 5)
        else:
            expected = [found_eye[i]+ratio*(point[i]-eye[i]) for i in (0, 1)]
            points[key], quality = match(image, reference, point, RADII[key], ratio, expected, 45)
            scores[key] = round(quality, 5)
    return points, scores


def load_panels(animal, selection_path=None):
    selected = []
    for start in (0, 4, 8, 12):
        file = SOURCE/f'{animal}-{start:02d}-{start+3:02d}.png'
        if not file.exists():
            continue
        raw = Image.open(file).convert('RGBA')
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        panels, gaps = safe_grid(raw)
        for offset, panel in enumerate(panels):
            selected.append({'frame': start+offset, 'source': file.relative_to(ROOT).as_posix(),
                             'panel': panel, 'originalSourceSize': list(raw.size),
                             'sourceSha256': digest,
                             'alphaEmptyGutters': gaps, 'image': raw.crop(tuple(panel))})
    selectionfile = Path(selection_path) if selection_path else SOURCE/f'{animal}-source-selection.json'
    if selection_path and not selectionfile.is_absolute():
        selectionfile = ROOT/selectionfile
    if selection_path and not selectionfile.is_file():
        raise FileNotFoundError('Explicit source selection does not exist: '+str(selectionfile))
    if selectionfile.exists():
        selection = json.loads(selectionfile.read_text(encoding='utf8'))
        if selection.get('exclusiveFrames'):
            # A newly authored series must never inherit missing poses from
            # an older, visually rejected trial merely because files exist.
            selected = []
        for key, choice in selection.get('frames', {}).items():
            frame = int(key)
            file = Path(choice['source'])
            file = file if file.is_absolute() else SOURCE/file
            raw = Image.open(file).convert('RGBA')
            panel = choice.get('panel')
            row = {'frame': frame, 'source': file.relative_to(ROOT).as_posix(),
                   'panel': panel, 'originalSourceSize': list(raw.size),
                   'sourceSha256': hashlib.sha256(file.read_bytes()).hexdigest(),
                   'image': raw.crop(tuple(panel)) if panel else raw}
            selected = [r for r in selected if r['frame'] != frame]+[row]
    if selected:
        # Additional rest exposure, not an additional generated drawing. The
        # first phase has all soles on the ground and naturally closes 15->0.
        rest = dict(next(r for r in selected if r['frame'] == 0))
        rest['frame'] = 16
        rest['duplicateExposureOfWalkingFrame'] = 0
        selected.append(rest)
    return sorted(selected, key=lambda r: r['frame'])


def annotate(animal, rows, images, reference):
    cols, width = 4, 560
    height = 460
    canvas = Image.new('RGB', (cols*width, math.ceil(len(rows)/cols)*(height+36)), (242, 245, 248))
    outline = reference.getchannel('A').point(lambda a: 255 if a >= 128 else 0).filter(ImageFilter.FIND_EDGES)
    edge = Image.new('RGBA', reference.size, (25, 166, 212, 0)); edge.putalpha(outline)
    rawcanvas = Image.new('RGB', canvas.size, (242, 245, 248))
    for i, row in enumerate(rows):
        im = images[row['frame']]
        scale = row['uniformScaleToMaster']; tx, ty = row['translationToMaster']
        p = row.get('panel')
        if p:
            tx += p[0]*scale; ty += p[1]*scale
        rendered = im.transform(reference.size, Image.Transform.AFFINE,
                                (1/scale, 0, -tx/scale, 0, 1/scale, -ty/scale), Image.Resampling.BICUBIC)
        bg = Image.new('RGBA', reference.size, (242, 245, 248, 255)); bg.alpha_composite(rendered); bg.alpha_composite(edge)
        draw = ImageDraw.Draw(bg)
        for key, point in LANDMARKS[animal].items():
            x, y = point; draw.ellipse((x-4, y-4, x+4, y+4), fill=(232, 50, 48, 255))
        factor = min(width/bg.width, height/bg.height)
        tile = bg.convert('RGB').resize((round(bg.width*factor), round(bg.height*factor)), Image.Resampling.LANCZOS)
        x, y = i % cols*width, i//cols*(height+36)
        canvas.paste(tile, (x, y+36))
        ImageDraw.Draw(canvas).text((x+7, y+8), f'{animal} {row["frame"]:02d} scale{scale:.4f} bodyRMS{row["bodyRMS"]:.2f}', fill=(22, 32, 42))
        rawbg = Image.new('RGBA', im.size, (242, 245, 248, 255)); rawbg.alpha_composite(im); dr = ImageDraw.Draw(rawbg)
        for gx in range(0, im.width, 50):
            dr.line((gx, 0, gx, im.height), fill=(164, 180, 188, 150), width=1); dr.text((gx+2, 8), str(gx), fill=(22, 32, 42))
        for gy in range(0, im.height, 50):
            dr.line((0, gy, im.width, gy), fill=(164, 180, 188, 150), width=1); dr.text((2, gy+2), str(gy), fill=(22, 32, 42))
        factor = min(width/rawbg.width, height/rawbg.height)
        rawcanvas.paste(rawbg.convert('RGB').resize((round(im.width*factor), round(im.height*factor)), Image.Resampling.LANCZOS), (x, y+36))
        ImageDraw.Draw(rawcanvas).text((x+7, y+8), f'{animal} {row["frame"]:02d} LOCAL source crop pixels', fill=(22, 32, 42))
    canvas.save(QA/f'{animal}-body-registration.png')
    rawcanvas.save(QA/f'{animal}-source-coordinate-cels.png')


def measure_feet(animal, rows, measurements, output_scale):
    """Audit actual authored sole positions and estimate stride from stance.

    Foot state is a manual inspection of the finished original, not the guide.
    Expected timing is reported separately for diagnosis. No ideal coordinates
    are used as evidence that an original has planted feet or natural anatomy.
    """
    points, warnings = {}, []
    for row in rows:
        frame = row['frame']
        if frame == 16 or str(frame) not in measurements:
            continue
        digest = measurements[str(frame)].get('sourceSha256')
        if digest != row['sourceSha256']:
            warnings.append(f'Frame {frame}: original changed or hash missing; old sole measurements not used')
            continue
        raw = measurements[str(frame)].get('feet', {})
        points[frame] = {}
        for leg, item in raw.items():
            local = np.asarray(item['point'], dtype=float)
            panel = row.get('panel') or [0, 0]
            rawpt = local+np.asarray(panel[:2])
            master = rawpt*row['uniformScaleToMaster']+np.asarray(row['translationToMaster'])
            points[frame][leg] = {'sourceLocalPoint': local.tolist(), 'masterPoint': master.tolist(),
                                  'state': item['state'], 'confidence': item.get('confidence', 'manual visible sole'),
                                  'trackingFeature': item.get('trackingFeature', 'visibleSole')}
    stance_deltas, perleg = [], {}
    for leg in TOUCH:
        observations = []
        for frame in range(16):
            nxt = (frame+1) % 16
            if leg not in points.get(frame, {}) or leg not in points.get(nxt, {}):
                continue
            a, b = points[frame][leg], points[nxt][leg]
            if a['trackingFeature'] != b['trackingFeature']:
                continue
            if a['state'] == b['state'] == 'stance':
                delta = b['masterPoint'][0]-a['masterPoint'][0]
                dy = b['masterPoint'][1]-a['masterPoint'][1]
                observations.append({'fromFrame': frame, 'toFrame': nxt, 'bodyRelativeRetreatX': delta,
                                     'soleVerticalDifference': dy})
                stance_deltas.append(delta)
        perleg[leg] = observations
    # Robust positive retreat is the observed body-relative movement backwards
    # of a planted sole; one cycle traverses sixteen phase intervals.
    positive = [d for d in stance_deltas if d > .25]
    step = float(np.median(positive)) if positive else None
    stride = step*16 if step is not None else None
    for observations in perleg.values():
        for item in observations:
            item['worldSupportResidualAtMeasuredStride'] = None if step is None else item['bodyRelativeRetreatX']-step
    return {'method': 'Manual actual finished-original sole coordinates, separately judged stance/swing. Uniform body transform only. Median positive stance retreat per phase times sixteen; guide ideal foot coordinates are never sampled.',
            'completedMeasuredFrames': sorted(points), 'actualFeet': points,
            'measurementWarnings': warnings,
            'stanceTransitions': perleg, 'sampleCount': len(stance_deltas),
            'medianPositiveRetreatMasterPixelsPerPhase': step,
            'strideMasterPixels': stride, 'strideOutputPixels': None if stride is None else stride*output_scale,
            'stanceRetreatRangeMasterPixels': [min(stance_deltas), max(stance_deltas)] if stance_deltas else None,
            'expectedLandingPhasesForComparisonOnly': TOUCH,
            'review': measurements.get('_review', 'NOT YET REVIEWED: original foot measurements missing')}


def annotate_actual_feet(animal, rows, images, measurements):
    selected = [r for r in rows if r['frame'] < 16]
    width, height = 560, 470
    canvas = Image.new('RGB', (width*4, height*math.ceil(len(selected)/4)), (242, 245, 248))
    for i, row in enumerate(selected):
        im = images[row['frame']]
        bg = Image.new('RGBA', im.size, (242, 245, 248, 255)); bg.alpha_composite(im)
        draw = ImageDraw.Draw(bg)
        measured = measurements.get(str(row['frame']), {})
        valid = measured.get('sourceSha256') == row['sourceSha256']
        if valid:
            for leg, data in measured.get('feet', {}).items():
                x, y = data['point']
                color = (232, 77, 52, 255) if data['state'] == 'swing' else (22, 143, 73, 255)
                radius = max(4, round(im.width/140))
                draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=color)
                draw.text((x+radius+2, y-18), f'{leg}: {x:.1f},{y:.0f}', fill=color)
        factor = min(width/im.width, (height-35)/im.height)
        tile = bg.convert('RGB').resize((round(im.width*factor), round(im.height*factor)), Image.Resampling.LANCZOS)
        x, y = i%4*width, i//4*height
        canvas.paste(tile, (x, y+35))
        title = f'ACTUAL ORIGINAL {row["frame"]:02d} sha{row["sourceSha256"][:8]}'
        if not valid:
            title += '  MEASUREMENTS STALE/MISSING'
        ImageDraw.Draw(canvas).text((x+7, y+7), title, fill=(22, 32, 42))
    canvas.save(QA/f'{animal}-measured-actual-soles.png')


def process(animal, args):
    selected = load_panels(animal, args.source_selection)
    rejected_file = SOURCE/'rejected-originals.json'
    rejected = json.loads(rejected_file.read_text(encoding='utf8')) if rejected_file.exists() else {'originals': []}
    rejected_hashes = {r['sha256'] for r in rejected['originals']}
    if not args.trial_only:
        for entry in selected:
            if entry['sourceSha256'] in rejected_hashes:
                raise ValueError('Explicitly rejected original cannot enter runtime: '+entry['source'])
    if not selected or selected[0]['frame'] != 0:
        raise ValueError('Missing first original sheet: '+animal)
    manualfile = Path(args.measurements) if args.measurements else SOURCE/f'{animal}-measurements.json'
    if args.measurements and not manualfile.is_absolute():
        manualfile = ROOT/manualfile
    if args.measurements and not manualfile.is_file():
        raise FileNotFoundError('Explicit original measurements do not exist: '+str(manualfile))
    manual = json.loads(manualfile.read_text(encoding='utf8')) if manualfile.exists() else {}
    if '_referenceBodyLandmarks' in manual:
        LANDMARKS[animal] = manual['_referenceBodyLandmarks']
    # Freeze the first original's anatomical body coordinate space. Replacing
    # walking pose0 must not silently move all body landmarks or make the new
    # single-image camera equal the old atlas camera.
    reference_tag = manual.get('_referenceTag', '')
    reference_name = animal + ('-'+reference_tag if reference_tag else '')
    refmeta = SOURCE/f'{reference_name}-body-master-reference.json'
    refimage = QA/f'{reference_name}-body-master-reference.png'
    if not refmeta.exists():
        firstfile = ROOT/manual['_referenceSource'] if manual.get('_referenceSource') else SOURCE/f'{animal}-00-03.png'
        firstraw = Image.open(firstfile).convert('RGBA')
        firstpanel = None if manual.get('_referenceSource') else safe_grid(firstraw)[0][0]
        (firstraw.crop(tuple(firstpanel)) if firstpanel else firstraw).save(refimage)
        rm = {'source': firstfile.relative_to(ROOT).as_posix(), 'panel': firstpanel,
              'sourceSha256': hashlib.sha256(firstfile.read_bytes()).hexdigest(),
              'frozenCompleteBodyCrop': refimage.relative_to(ROOT).as_posix(),
              'role': 'Private complete-original anatomical correspondence only; never game asset, never guide-derived.'}
        refmeta.write_text(json.dumps(rm, indent=2), encoding='utf8')
    rm = json.loads(refmeta.read_text(encoding='utf8'))
    reference = Image.open(ROOT/rm['frozenCompleteBodyCrop']).convert('RGBA')
    refpoints = LANDMARKS[animal]
    keys = list(refpoints)
    weights = np.asarray([WEIGHTS[k] for k in keys], dtype=float)
    target = np.asarray([refpoints[k] for k in keys], dtype=float)
    rows, images = [], {}
    for entry in selected:
        frame, im = entry['frame'], entry['image']
        overrides = manual.get(str(frame), {}).get('bodyLandmarks', {})
        same_reference = entry['sourceSha256'] == rm['sourceSha256'] and entry.get('panel') == rm['panel']
        if same_reference:
            pts, scores = refpoints, {k: 1. for k in keys}
        else:
            pts, scores = body_match(im, reference, refpoints, overrides)
        source = np.asarray([pts[k] for k in keys], dtype=float)
        scale, shift, residual, rms = fit_body(source, target, weights)
        panel = entry.get('panel')
        absolute_points = {k: [float(v)+(panel[i] if panel else 0) for i, v in enumerate(pts[k])] for k in keys}
        absolute_shift = shift-(np.asarray(panel[:2])*scale if panel else 0)
        status = manual.get(str(frame), {}).get('sourceReviewStatus', 'PENDING actual-art anatomy review')
        row = {k: v for k, v in entry.items() if k != 'image'}
        row.update({'sourcePixelLandmarks': absolute_points, 'nccScores': scores,
                    'uniformScaleToMaster': scale, 'translationToMaster': absolute_shift.tolist(),
                    'bodyRMS': rms, 'bodyResidualsMasterPixels': dict(zip(keys, residual.tolist())),
                    'opaqueBoundsLocal': list(opaque_bounds(im)), 'sourceOpaqueEdgeCounts': edge_counts(im),
                    'sourceReviewStatus': status})
        images[frame] = im; rows.append(row)
    reg = {'version': '4.13', 'animal': animal, 'referenceSource': rm['source'],
           'referencePanel': rm['panel'], 'referenceSourceSha256': rm['sourceSha256'],
           'referenceCanvasSize': list(reference.size),
           'referenceBodyLandmarks': refpoints, 'bodyLandmarkWeights': dict(zip(keys, weights.tolist())),
           'method': 'Complete original cels. NCC/body correspondence, uniform scale plus translation only. No rotation, per-axis scale, mesh, limb cutouts, frame blending, ground/foot fit or per-frame alpha-bbox normalization.',
           'frames': rows}
    regfile = QA/f'{animal}-trial-registration.json' if args.trial_only else SOURCE/f'{animal}-registration.json'
    regfile.write_text(json.dumps(reg, ensure_ascii=False, indent=2), encoding='utf8')
    annotate(animal, rows, images, reference)
    annotate_actual_feet(animal, rows, images, manual)
    complete = [r['frame'] for r in rows] == list(range(17))
    if not complete and not args.allow_incomplete:
        print(f'{animal}: registered {len(rows)-1}/16 walking originals, waiting to pack', flush=True)
        return
    if args.register_only:
        print(f'{animal}: registration written, max bodyRMS {max(r["bodyRMS"] for r in rows):.3f}', flush=True)
        return
    bounds = []
    for row in rows:
        if 'REJECTED' in row['sourceReviewStatus'].upper():
            raise ValueError('Rejected original cannot be packed: '+str(row['frame']))
        b = row['opaqueBoundsLocal']; s = row['uniformScaleToMaster']; tx, ty = row['translationToMaster']
        p = row.get('panel') or [0, 0]
        tx += p[0]*s; ty += p[1]*s
        bounds.append([b[0]*s+tx, b[1]*s+ty, b[2]*s+tx, b[3]*s+ty])
    left, top = min(b[0] for b in bounds), min(b[1] for b in bounds)
    right, bottom = max(b[2] for b in bounds), max(b[3] for b in bounds)
    outscale = args.content_height/(bottom-top)
    margin = 24
    w, h = math.ceil((right-left)*outscale)+margin*2, args.content_height+margin*2
    sheet = Image.new('RGBA', (w*4, h*math.ceil(len(rows)/4)), (0, 0, 0, 0))
    rendered = []
    for i, row in enumerate(rows):
        im = images[row['frame']]; s = row['uniformScaleToMaster']; tx, ty = row['translationToMaster']; p = row.get('panel') or [0, 0]
        tx += p[0]*s; ty += p[1]*s
        total = s*outscale
        dx, dy = (tx-left)*outscale+margin, (ty-top)*outscale+margin
        cel = im.transform((w, h), Image.Transform.AFFINE, (1/total, 0, -dx/total, 0, 1/total, -dy/total), Image.Resampling.BICUBIC)
        box = opaque_bounds(cel)
        if min(box[0], box[1], w-box[2], h-box[3]) < 12:
            raise ValueError(f'Insufficient complete-body margin: {animal} frame{row["frame"]}')
        sheet.alpha_composite(cel, (i%4*w, i//4*h)); rendered.append(cel)
        cel.save(QA/f'{animal}-packed-{row["frame"]:02d}.png')
    sheet.save(OUT/f'{animal}-sheet.webp', lossless=True, method=6)
    restindex = next((i for i, r in enumerate(rows) if r['frame'] == 16), 0)
    rendered[restindex].save(OUT/f'{animal}-poster.webp', lossless=True, method=6)
    audit = measure_feet(animal, rows, manual, outscale)
    (QA/f'{animal}-actual-foot-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding='utf8')
    mfile = OUT/'manifest.json'
    manifest = json.loads(mfile.read_text(encoding='utf8')) if mfile.exists() else {'version': '4.13', 'animals': {}}
    animal_pack = {'sheet': f'assets/animation/walk-v4-13/{animal}-sheet.webp',
        'poster': f'assets/animation/walk-v4-13/{animal}-poster.webp', 'viewport': {'w': w, 'h': h},
        'frames': [{'x': i%4*w, 'y': i//4*h, 'w': w, 'h': h, 'dx': 0, 'dy': 0} for i in range(len(rows))],
        'restFrame': 16, 'walkingPoseCount': len(rows)-1,
        'ready': complete and not any('WAITING_REPAIR' in r['sourceReviewStatus'] for r in rows),
        'allOriginalsPresent': complete,
        'actualGaitApproved': bool(manual.get('_actualGaitApproved', False)),
        'stridePixels': audit['strideOutputPixels'], 'strideMasterPixels': audit['strideMasterPixels'],
        'unionMaster': [left, top, right, bottom], 'outputScale': outscale, 'outputOffset': [margin-left*outscale, margin-top*outscale],
        'margin': margin, 'bodyRMS': [r['bodyRMS'] for r in rows], 'registration': reg,
        'qa': audit, 'sourceSelection': [r['source']+'#'+str(r['panel']) for r in rows]}
    if args.trial_only:
        animal_pack['selectedForRuntime'] = False
        (QA/f'{animal}-trial-pack.json').write_text(json.dumps(animal_pack, ensure_ascii=False, indent=2), encoding='utf8')
    else:
        manifest['animals'][animal] = animal_pack
        mfile.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
    print(json.dumps({'animal': animal, 'complete': complete, 'viewport': [w, h],
                      'maxBodyRMS': max(r['bodyRMS'] for r in rows), 'strideOutputPixels': audit['strideOutputPixels']}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ids', nargs='+', default=['zebra'])
    parser.add_argument('--register-only', action='store_true')
    parser.add_argument('--allow-incomplete', action='store_true', help='Private diagnostic pack, never ready=true')
    parser.add_argument('--content-height', type=int, default=650)
    parser.add_argument('--trial-only', action='store_true', help='Write private QA pack metadata only, never add animal to runtime manifest')
    parser.add_argument('--source-selection', help='Explicit private candidate selection; leaves production source-selection unchanged')
    parser.add_argument('--measurements', help='Private candidate actual-original measurements JSON')
    args = parser.parse_args()
    for animal in args.ids:
        process(animal, args)
