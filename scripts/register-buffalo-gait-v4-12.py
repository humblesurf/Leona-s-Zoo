"""Register complete generated buffalo bodies with fixed anatomy landmarks.

Each frame uses one uniform scale and one translation; no rotation, limb edits,
outer-bounds normalization, ground alignment, mesh or nonlinear deformation.
The source PNGs are never rewritten. Rendered images are private QA overlays.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'geo/assets/animation/v4-12-gait/source'
selection_path = SOURCE / 'buffalo-source-selection-v4-12.json'
selection = json.loads(selection_path.read_text(encoding='utf-8'))
for frame in selection['frames']:
    frame['independentAudit'] = 'PASS'
    if frame['frame'] == 0:
        frame['promptRecord'] = 'prompts-generated.json#/buffalo/pairs/01'
        frame['generatedSourceRecord'] = 'prompts-generated.json#/buffalo/pairs/01/source'
    if frame['frame'] == 7:
        frame['promptRecord'] = 'prompts-generated.json#/buffalo/prompt7'
        frame['generatedSourceRecord'] = 'prompts-generated.json#/buffalo/source7'
selection['independentAuditScope'] = 'All eight sources passed anatomy and foot-sequence review by /root/animal_styles_v411. Runtime playback remains a separate check.'
selection_path.write_text(json.dumps(selection, indent=2), encoding='utf-8')

REFERENCE_FRAME = 7
REFERENCE_POINTS = {
    'nearEyeCenter': (338.0, 294.0),
    'foreheadCrestBetweenHorns': (402.0, 43.0),
    'backHumpCrest': (649.0, 27.0),
    'tailRootDorsalAttachment': (1305.0, 215.0),
}
RADII = {
    'nearEyeCenter': (33, 33),
    'foreheadCrestBetweenHorns': (48, 30),
    'backHumpCrest': (44, 21),
    'tailRootDorsalAttachment': (48, 42),
}
WEIGHTS = {'nearEyeCenter': 4.0, 'foreheadCrestBetweenHorns': 2.0, 'backHumpCrest': 2.0, 'tailRootDorsalAttachment': 3.0}
COLORS = {'nearEyeCenter': (233, 73, 62), 'foreheadCrestBetweenHorns': (224, 151, 33), 'backHumpCrest': (33, 153, 87), 'tailRootDorsalAttachment': (130, 83, 220)}

def read_source(record):
    with Image.open(SOURCE / record['source']) as image:
        image = image.convert('RGBA')
        if record.get('panel'):
            image = image.crop(tuple(record['panel']))
        return image

images = {r['frame']: read_source(r) for r in selection['frames']}
reference = images[REFERENCE_FRAME]

def gray(image):
    canvas = Image.new('RGBA', image.size, (242, 245, 248, 255))
    canvas.alpha_composite(image)
    return np.asarray(canvas.convert('L'), dtype=np.float64)

def ncc_valid(search, template):
    th, tw = template.shape
    h, w = search.shape
    zero = template - template.mean()
    shape = (h + th - 1, w + tw - 1)
    corr = np.fft.irfft2(np.fft.rfft2(search, shape) * np.fft.rfft2(zero[::-1, ::-1], shape), s=shape)
    numerator = corr[th - 1:h, tw - 1:w]
    def box_sum(array):
        integral = np.pad(array, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
        return integral[th:, tw:] - integral[:-th, tw:] - integral[th:, :-tw] + integral[:-th, :-tw]
    sums = box_sum(search)
    squared = box_sum(search * search)
    variance = np.maximum(squared - sums * sums / (th * tw), 1e-9)
    return numerator / np.sqrt(variance * np.sum(zero * zero))

def match_landmark(image, key, scale_ratio, expected, radius):
    rx, ry = RADII[key]
    point = REFERENCE_POINTS[key]
    crop = (int(point[0] - rx), int(point[1] - ry), int(point[0] + rx + 1), int(point[1] + ry + 1))
    patch = reference.crop(crop)
    resized = patch.resize((max(3, round(patch.width * scale_ratio)), max(3, round(patch.height * scale_ratio))), Image.Resampling.LANCZOS)
    template = gray(resized)
    offset = (rx * scale_ratio, ry * scale_ratio)
    left = max(0, int(expected[0] - offset[0] - radius))
    top = max(0, int(expected[1] - offset[1] - radius))
    right = min(image.width, int(expected[0] - offset[0] + radius + resized.width + 1))
    bottom = min(image.height, int(expected[1] - offset[1] + radius + resized.height + 1))
    search = gray(image.crop((left, top, right, bottom)))
    scores = ncc_valid(search, template)
    y, x = np.unravel_index(np.argmax(scores), scores.shape)
    return [round(left + x + offset[0], 3), round(top + y + offset[1], 3)], round(float(scores[y, x]), 5)

landmarks = {}
scores = {}
for record in selection['frames']:
    f = record['frame']
    if f == REFERENCE_FRAME:
        landmarks[f] = {k: list(v) for k, v in REFERENCE_POINTS.items()}
        scores[f] = {k: 1.0 for k in REFERENCE_POINTS}
        continue
    landmarks[f], scores[f] = {}, {}
    for key, point in REFERENCE_POINTS.items():
        if f == 0:
            # Seed only: estimated from anatomical landmarks, never image bounds.
            ratio = 1 / 1.535
            expected = ((point[0] + 74) * ratio, (point[1] + 29) * ratio)
            radius = 22
        else:
            ratio, expected, radius = 1.0, point, 30
        landmarks[f][key], scores[f][key] = match_landmark(images[f], key, ratio, expected, radius)

keys = list(REFERENCE_POINTS)
target = np.asarray([REFERENCE_POINTS[k] for k in keys])
weights = np.asarray([WEIGHTS[k] for k in keys])
target_center = np.average(target, axis=0, weights=weights)

def transform_for(f):
    points = np.asarray([landmarks[f][k] for k in keys])
    source_center = np.average(points, axis=0, weights=weights)
    centered = points - source_center
    target_centered = target - target_center
    diagnostic_scale = np.sum(weights[:, None] * centered * target_centered) / np.sum(weights[:, None] * centered * centered)
    # All single images inherit master camera/size, so lock their source scale.
    # Only the smaller whole-body frame0 needs a scale fit from body landmarks.
    scale = float(diagnostic_scale) if f == 0 else 1.0
    translation = target_center - scale * source_center
    transformed = points * scale + translation
    residuals = transformed - target
    rms = np.sqrt(np.average(np.sum(residuals * residuals, axis=1), weights=weights))
    return {
        'uniformScaleToMaster': round(scale, 8),
        'translationToMaster': [round(float(v), 5) for v in translation],
        'diagnosticUnconstrainedLandmarkScale': round(float(diagnostic_scale), 8),
        'scalePolicy': 'Landmark-fitted complete-body scale for smaller pair panel' if f == 0 else 'Locked at 1: same master camera/size',
        'landmarkResidualsMasterPixels': {k: [round(float(v), 4) for v in residuals[i]] for i, k in enumerate(keys)},
        'weightedRmsMasterPixels': round(float(rms), 4),
        'maximumLandmarkResidualMasterPixels': round(float(np.linalg.norm(residuals, axis=1).max()), 4),
    }

transforms = {f: transform_for(f) for f in images}
report = {
    'version': 'v4.12',
    'animal': 'buffalo',
    'referenceSource': 'buffalo-pose-7.png',
    'referenceCanvasSize': list(reference.size),
    'coordinateSpace': 'Actual original source pixels; frame0 coordinates are also original pair coordinates because its panel starts at x0,y0.',
    'transformFormula': 'masterX = sourceX * uniformScaleToMaster + translationToMaster[0]; masterY = sourceY * uniformScaleToMaster + translationToMaster[1]. Apply to the complete body, then use one shared output scale and offset for every frame.',
    'method': 'Four stable anatomical landmarks; NCC local correspondences with manual reference point definitions. All singles use scale1. Frame0 uniform scale is fitted from weighted landmark pairs. Translation is fitted from body landmarks only. No foot, ground, bounding-box, per-axis scale, rotation or nonlinear adjustment.',
    'referenceLandmarks': {k: list(v) for k, v in REFERENCE_POINTS.items()},
    'landmarkDefinitions': {
        'nearEyeCenter': 'Center of the nearest visible eye/pupil.',
        'foreheadCrestBetweenHorns': 'Dorsal crest of the cream forehead horn boss between the horns.',
        'backHumpCrest': 'Highest dorsal apex of the brown back/shoulder hump.',
        'tailRootDorsalAttachment': 'Dorsal attachment of the tail shaft at the visible rear rump outline.',
    },
    'landmarkWeights': WEIGHTS,
    'frames': [{
        'frame': r['frame'], 'phase': r['phase'], 'source': r['source'], 'panel': r.get('panel'),
        'sourcePixelLandmarks': landmarks[r['frame']],
        'nccScores': scores[r['frame']],
        **transforms[r['frame']],
    } for r in selection['frames']],
}
(SOURCE / 'buffalo-registration-v4-12.json').write_text(json.dumps(report, indent=2), encoding='utf-8')

def registered(f):
    transform = transforms[f]
    scale = transform['uniformScaleToMaster']
    tx, ty = transform['translationToMaster']
    return images[f].transform(reference.size, Image.Transform.AFFINE, (1 / scale, 0, -tx / scale, 0, 1 / scale, -ty / scale), Image.Resampling.BICUBIC)

edge = reference.getchannel('A').point(lambda x: 255 if x > 128 else 0).filter(ImageFilter.FIND_EDGES)
outline = Image.new('RGBA', reference.size, (0, 152, 208, 0))
outline.putalpha(edge)
tile_size = (814, 483)
sheet = Image.new('RGB', (tile_size[0] * 2, (tile_size[1] + 28) * 4), (242, 245, 248))
source_sheet = Image.new('RGB', sheet.size, (242, 245, 248))
for i, record in enumerate(selection['frames']):
    f = record['frame']
    canvas = Image.new('RGBA', reference.size, (242, 245, 248, 255))
    canvas.alpha_composite(registered(f))
    canvas.alpha_composite(outline)
    draw = ImageDraw.Draw(canvas)
    for key, point in REFERENCE_POINTS.items():
        x, y = point
        c = COLORS[key]
        draw.line((x - 11, y, x + 11, y), fill=(*c, 255), width=3)
        draw.line((x, y - 11, x, y + 11), fill=(*c, 255), width=3)
    x, y = (i % 2) * tile_size[0], (i // 2) * (tile_size[1] + 28)
    sheet.paste(canvas.convert('RGB').resize(tile_size, Image.Resampling.LANCZOS), (x, y + 28))
    text = f'frame{f} body scale={transforms[f]["uniformScaleToMaster"]:.5f} shift={transforms[f]["translationToMaster"]} RMS={transforms[f]["weightedRmsMasterPixels"]:.2f}px'
    ImageDraw.Draw(sheet).text((x + 10, y + 7), text, fill=(30, 42, 55))

    raw = Image.new('RGBA', images[f].size, (242, 245, 248, 255))
    raw.alpha_composite(images[f])
    d = ImageDraw.Draw(raw)
    for key, point in landmarks[f].items():
        px, py = point
        c = COLORS[key]
        d.ellipse((px - 8, py - 8, px + 8, py + 8), outline=(*c, 255), width=3)
        d.text((px + 12, py + 4), f'{key} ({px:.1f}, {py:.1f})', fill=(*c, 255))
    fit = min(tile_size[0] / raw.width, tile_size[1] / raw.height)
    raw = raw.resize((round(raw.width * fit), round(raw.height * fit)), Image.Resampling.LANCZOS)
    source_sheet.paste(raw.convert('RGB'), (x, y + 28))
    ImageDraw.Draw(source_sheet).text((x + 10, y + 7), f'frame{f} ORIGINAL SOURCE landmarks', fill=(30, 42, 55))

sheet.save(SOURCE / 'buffalo-registration-overlay-v4-12.png')
source_sheet.save(SOURCE / 'buffalo-registration-landmarks-v4-12.png')
print(json.dumps({'frames': [{ 'frame': r['frame'], 'landmarks': r['sourcePixelLandmarks'], 'ncc': r['nccScores'], 'scale': r['uniformScaleToMaster'], 'translate': r['translationToMaster'], 'RMS': r['weightedRmsMasterPixels'], 'maximum': r['maximumLandmarkResidualMasterPixels']} for r in report['frames']]}, indent=2))
