"""Rigid complete-body landmark registration for the v4.12 zebra and rhino.

Source PNGs remain untouched. No feet, ground or outer bounds enter the fit.
Unchanged single originals keep scale1; selected pair panels and an authorized
replacement zebra9 receive one uniform body-landmark scale and translation.
Output PNGs are private QA overlays.
"""
from pathlib import Path
import argparse
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'geo/assets/animation/v4-12-gait/source'
PHASES = dict(zip([0,2,3,4,5,7,8,9], [0,.17,.25,.375,.5,.67,.75,.875]))
SPECS = {
    'zebra': {
        'sources': {0:'zebra-pair-01.png', 2:'zebra-pose-2.png', 3:'zebra-pose-3.png', 4:'zebra-pose-4.png', 5:'zebra-pair-56.png', 7:'zebra-pose-7.png', 8:'zebra-pose-8.png', 9:'zebra-pose-9-repair-a.png'},
        'points': {'nearEyeCenter':(234,273), 'nearEarTip':(272,24), 'hipBackCrest':(942,323), 'tailRootDorsalAttachment':(1107,420)},
        'radii': {'nearEyeCenter':(32,32), 'nearEarTip':(30,16), 'hipBackCrest':(46,30), 'tailRootDorsalAttachment':(42,40)},
        'pairSeeds': {0:{'scale':1.56,'points':{'nearEyeCenter':(240,174), 'nearEarTip':(267,18), 'hipBackCrest':(698,204), 'tailRootDorsalAttachment':(799,265)}}, 5:{'scale':1.43,'points':{'nearEyeCenter':(180,196), 'nearEarTip':(207,24), 'hipBackCrest':(658,232), 'tailRootDorsalAttachment':(791,309)}}},
        'definitions': {'nearEyeCenter':'Center of nearest visible eye/pupil.', 'nearEarTip':'Tip of nearest foreground ear.', 'hipBackCrest':'Dorsal crest of the hind body/back, above the broad foreground rump.', 'tailRootDorsalAttachment':'Dorsal tail-shaft attachment on the posterior rump outline.'},
    },
    'rhino': {
        'sources': {0:'rhino-pair-01.png', 2:'rhino-pose-2.png', 3:'rhino-pose-3.png', 4:'rhino-pose-4.png', 5:'rhino-pose-5.png', 7:'rhino-pose-7.png', 8:'rhino-pose-8-repair-a.png', 9:'rhino-pose-9.png'},
        'points': {'nearEyeCenter':(349,394), 'nearEarTip':(531,36), 'shoulderBackCrest':(735,103), 'tailRootDorsalAttachment':(1342,327)},
        'radii': {'nearEyeCenter':(34,34), 'nearEarTip':(40,24), 'shoulderBackCrest':(46,34), 'tailRootDorsalAttachment':(44,40)},
        'pairSeeds': {0:{'scale':1.59,'points':{'nearEyeCenter':(224,330), 'nearEarTip':(331,106), 'shoulderBackCrest':(459,146), 'tailRootDorsalAttachment':(859,293)}}},
        'definitions': {'nearEyeCenter':'Center of nearest visible eye/pupil.', 'nearEarTip':'Tip of nearest foreground ear.', 'shoulderBackCrest':'Dorsal shoulder/back crest directly behind the foreground ear.', 'tailRootDorsalAttachment':'Dorsal tail-shaft attachment at the posterior rump outline.'},
    },
}
parser=argparse.ArgumentParser()
parser.add_argument('--zebra9',default='zebra-pose-9-repair-a.png',help='Replacement complete-body frame9 source filename inside source/.')
parser.add_argument('--fit-zebra9',action='store_true',help='Allow the replacement frame9 one body-landmark uniform camera scale.')
parser.add_argument('--zebra9-review-status',choices=['WAITING_REVIEW','PASS'],default='WAITING_REVIEW',help='Independent anatomy review state of replacement frame9.')
args=parser.parse_args()
SPECS['zebra']['sources'][9]=args.zebra9

def gray(image):
    bg = Image.new('RGBA',image.size,(242,245,248,255))
    bg.alpha_composite(image)
    return np.asarray(bg.convert('L'),dtype=np.float64)

def ncc(search, template):
    th,tw = template.shape
    h,w = search.shape
    zero = template-template.mean()
    shape=(h+th-1,w+tw-1)
    cross=np.fft.irfft2(np.fft.rfft2(search,shape)*np.fft.rfft2(zero[::-1,::-1],shape),s=shape)[th-1:h,tw-1:w]
    def sums(a):
        integral=np.pad(a,((1,0),(1,0))).cumsum(0).cumsum(1)
        return integral[th:,tw:]-integral[:-th,tw:]-integral[th:,:-tw]+integral[:-th,:-tw]
    total=sums(search)
    variance=np.maximum(sums(search*search)-total*total/(th*tw),1e-9)
    return cross/np.sqrt(variance*np.sum(zero*zero))

def safe_left_panel(image):
    counts=(np.asarray(image.getchannel('A'))>=16).sum(axis=0)
    candidates=np.where((counts==0)&(np.arange(image.width)>image.width*.35)&(np.arange(image.width)<image.width*.65))[0]
    groups=np.split(candidates,np.where(np.diff(candidates)!=1)[0]+1)
    groups=[g for g in groups if len(g)>=3]
    if not groups:
        raise ValueError('No safe alpha-empty inter-animal gap')
    gap=max(groups,key=len)
    cut=int((int(gap[0])+int(gap[-1]))//2)
    return [0,0,cut,image.height], [int(gap[0]),int(gap[-1])]

def match(image, reference, point, radii, ratio, seed, radius=30):
    rx,ry=radii
    patch=reference.crop((point[0]-rx,point[1]-ry,point[0]+rx+1,point[1]+ry+1))
    patch=patch.resize((round(patch.width*ratio),round(patch.height*ratio)),Image.Resampling.LANCZOS)
    offset=(rx*ratio,ry*ratio)
    left=max(0,int(seed[0]-offset[0]-radius))
    top=max(0,int(seed[1]-offset[1]-radius))
    right=min(image.width,int(seed[0]-offset[0]+radius+patch.width+1))
    bottom=min(image.height,int(seed[1]-offset[1]+radius+patch.height+1))
    scores=ncc(gray(image.crop((left,top,right,bottom))),gray(patch))
    y,x=np.unravel_index(np.argmax(scores),scores.shape)
    return [round(float(left+x+offset[0]),3),round(float(top+y+offset[1]),3)],round(float(scores[y,x]),5)

for animal,spec in SPECS.items():
    images,panels,gaps,sizes={},{},{},{}
    for frame,name in spec['sources'].items():
        with Image.open(SOURCE/name) as raw:
            raw=raw.convert('RGBA')
            sizes[frame]=list(raw.size)
            if frame in spec['pairSeeds']:
                panels[frame],gaps[frame]=safe_left_panel(raw)
                raw=raw.crop(tuple(panels[frame]))
            images[frame]=raw
    reference=images[7]
    landmarks,scores,camera_ratios={},{},{}
    for frame,image in images.items():
        landmarks[frame],scores[frame]={},{}
        body_shift=(0,0)
        camera_variant=animal=='zebra' and frame==9 and args.fit_zebra9
        if camera_variant:
            eye=spec['points']['nearEyeCenter']
            best=None
            # Search the distinctive eye at several camera scales, then track
            # all other body points relative to that same eye/camera seed.
            for ratio in [.70,.75,.80,.85,.90,.92,.94,.96,.98,1.,1.02,1.04,1.06,1.08,1.10,1.15,1.20,1.25,1.30,1.40,1.50]:
                expected=(image.width/2+ratio*(eye[0]-reference.width/2),image.height/2+ratio*(eye[1]-reference.height/2))
                found,score=match(image,reference,eye,spec['radii']['nearEyeCenter'],ratio,expected,160)
                if best is None or score>best[0]:
                    best=(score,ratio,found)
            camera_ratios[frame]=best[1]
            matched_eye=best[2]
        elif frame!=7 and frame not in spec['pairSeeds']:
            eye=spec['points']['nearEyeCenter']
            matched_eye,eye_score=match(image,reference,eye,spec['radii']['nearEyeCenter'],1.0,eye,100)
            body_shift=(matched_eye[0]-eye[0],matched_eye[1]-eye[1])
        for key,point in spec['points'].items():
            if frame==7:
                landmarks[frame][key]=list(point)
                scores[frame][key]=1.0
                continue
            if camera_variant:
                ratio=camera_ratios[frame]
                eye=spec['points']['nearEyeCenter']
                expected=(matched_eye[0]+ratio*(point[0]-eye[0]),matched_eye[1]+ratio*(point[1]-eye[1]))
            elif frame in spec['pairSeeds']:
                seed=spec['pairSeeds'][frame]
                ratio=1/seed['scale']
                expected=seed['points'][key]
            else:
                ratio=1.0
                expected=(point[0]+body_shift[0],point[1]+body_shift[1])
            landmarks[frame][key],scores[frame][key]=match(image,reference,point,spec['radii'][key],ratio,expected,30 if frame in spec['pairSeeds'] else 50)
    keys=list(spec['points'])
    target=np.asarray([spec['points'][k] for k in keys],dtype=float)
    weights=np.array([4.,2.,2.,3.])
    target_center=np.average(target,axis=0,weights=weights)
    rows=[]
    for frame in spec['sources']:
        points=np.asarray([landmarks[frame][k] for k in keys])
        source_center=np.average(points,axis=0,weights=weights)
        centered=points-source_center
        diagnostic=float(np.sum(weights[:,None]*centered*(target-target_center))/np.sum(weights[:,None]*centered*centered))
        diagnostic_shift=target_center-diagnostic*source_center
        diagnostic_residual=points*diagnostic+diagnostic_shift-target
        camera_variant=animal=='zebra' and frame==9 and args.fit_zebra9
        scale=diagnostic if frame in spec['pairSeeds'] or camera_variant else 1.0
        shift=target_center-scale*source_center
        residual=points*scale+shift-target
        rms=float(np.sqrt(np.average(np.sum(residual*residual,axis=1),weights=weights)))
        rows.append({
            'frame':frame,'phase':PHASES[frame],'source':spec['sources'][frame],'originalSourceSize':sizes[frame],
            'panel':panels.get(frame),'alphaEmptySplitGap':gaps.get(frame),'sourcePixelLandmarks':landmarks[frame],'nccScores':scores[frame],
            'uniformScaleToMaster':round(scale,8),'translationToMaster':[round(float(v),5) for v in shift],
            'diagnosticUnconstrainedLandmarkScale':round(diagnostic,8),
            'diagnosticUniformBodyLandmarkFit':{
                'uniformScaleToMaster':round(diagnostic,8),
                'translationToMaster':[round(float(v),5) for v in diagnostic_shift],
                'weightedRmsMasterPixels':round(float(np.sqrt(np.average(np.sum(diagnostic_residual*diagnostic_residual,axis=1),weights=weights))),4),
                'maximumLandmarkResidualMasterPixels':round(float(np.linalg.norm(diagnostic_residual,axis=1).max()),4),
                'applied':frame in spec['pairSeeds'] or camera_variant,
            },
            'scalePolicy':'Uniform fit from body landmarks for replacement frame9 camera' if camera_variant else ('Uniform fit from body landmarks for pair panel' if frame in spec['pairSeeds'] else 'Locked at 1: same master camera and size'),
            'templateCameraRatioSeed':camera_ratios.get(frame,1.0),
            'sourceReviewStatus':('REJECTED: old frame9 source sole clipped; replacement pending' if args.zebra9=='zebra-pose-9-repair-a.png' else args.zebra9_review_status) if animal=='zebra' and frame==9 else 'Selected source',
            'rawAlphaVisibleBounds':list(images[frame].getchannel('A').point(lambda a:255 if a>=16 else 0).getbbox()),
            'sourceEdgeContentCounts':{
                'left':int((np.asarray(images[frame].getchannel('A'))[:,0]>=16).sum()),
                'top':int((np.asarray(images[frame].getchannel('A'))[0,:]>=16).sum()),
                'right':int((np.asarray(images[frame].getchannel('A'))[:,-1]>=16).sum()),
                'bottom':int((np.asarray(images[frame].getchannel('A'))[-1,:]>=16).sum()),
            },
            'landmarkResidualsMasterPixels':{k:[round(float(v),4) for v in residual[i]] for i,k in enumerate(keys)},
            'weightedRmsMasterPixels':round(rms,4),'maximumLandmarkResidualMasterPixels':round(float(np.linalg.norm(residual,axis=1).max()),4),
        })
    report={
        'version':'v4.12','animal':animal,'referenceSource':spec['sources'][7],'referenceCanvasSize':list(reference.size),
        'selectedFrames':list(PHASES),'coordinateSpace':'Actual original source pixels. Pair panels start at x0,y0, so their landmark coordinates also address the original pair PNG.',
        'readyForPacking':animal!='zebra' or (args.zebra9!='zebra-pose-9-repair-a.png' and all(v==0 for v in rows[-1]['sourceEdgeContentCounts'].values())),
        'method':'Four stable anatomical body landmarks, NCC local correspondence. All unchanged single originals lock scale1; pair panels and explicitly authorized replacement zebra9 fit one uniform scale from body landmarks. Body-landmark translation. No foot, ground or outer-bounds fitting, no rotation, per-axis scale or nonlinear deformation.',
        'transformFormula':'masterX = sourceX * uniformScaleToMaster + translationToMaster[0]; masterY = sourceY * uniformScaleToMaster + translationToMaster[1]. Then use one common output scale/offset for every complete body.',
        'referenceLandmarks':{k:list(v) for k,v in spec['points'].items()},'landmarkDefinitions':spec['definitions'],'landmarkWeights':dict(zip(keys,weights.tolist())),
        'frames':rows,
    }
    (SOURCE/f'{animal}-registration-v4-12.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    colors=[(232,68,57),(225,149,32),(31,152,84),(129,82,220)]
    edge=reference.getchannel('A').point(lambda a:255 if a>128 else 0).filter(ImageFilter.FIND_EDGES)
    outline=Image.new('RGBA',reference.size,(0,154,210,0));outline.putalpha(edge)
    tile_width=812
    tile_height=round(reference.height*tile_width/reference.width)
    sheet=Image.new('RGB',(tile_width*2,(tile_height+28)*4),(242,245,248))
    raw_sheet=Image.new('RGB',sheet.size,(242,245,248))
    for i,row in enumerate(rows):
        frame=row['frame'];scale=row['uniformScaleToMaster'];tx,ty=row['translationToMaster']
        rendered=images[frame].transform(reference.size,Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.BICUBIC)
        canvas=Image.new('RGBA',reference.size,(242,245,248,255));canvas.alpha_composite(rendered);canvas.alpha_composite(outline)
        draw=ImageDraw.Draw(canvas)
        for key,color in zip(keys,colors):
            x,y=spec['points'][key]
            draw.line((x-10,y,x+10,y),fill=(*color,255),width=3);draw.line((x,y-10,x,y+10),fill=(*color,255),width=3)
        x,y=(i%2)*tile_width,(i//2)*(tile_height+28)
        sheet.paste(canvas.convert('RGB').resize((tile_width,tile_height),Image.Resampling.LANCZOS),(x,y+28))
        ImageDraw.Draw(sheet).text((x+10,y+7),f'{animal} frame{frame} scale={scale:.5f} RMS={row["weightedRmsMasterPixels"]:.2f}px',fill=(30,42,55))
        raw=Image.new('RGBA',images[frame].size,(242,245,248,255));raw.alpha_composite(images[frame]);d=ImageDraw.Draw(raw)
        for key,color in zip(keys,colors):
            px,py=landmarks[frame][key];d.ellipse((px-7,py-7,px+7,py+7),outline=(*color,255),width=3);d.text((px+11,py+4),f'{key} ({px:.1f},{py:.1f})',fill=(*color,255))
        fit=min(tile_width/raw.width,tile_height/raw.height)
        raw=raw.resize((round(raw.width*fit),round(raw.height*fit)),Image.Resampling.LANCZOS)
        raw_sheet.paste(raw.convert('RGB'),(x,y+28));ImageDraw.Draw(raw_sheet).text((x+10,y+7),f'{animal} frame{frame} original source landmarks',fill=(30,42,55))
    sheet.save(SOURCE/f'{animal}-registration-overlay-v4-12.png')
    raw_sheet.save(SOURCE/f'{animal}-registration-landmarks-v4-12.png')
    if animal=='zebra':
        row=next(r for r in rows if r['frame']==9)
        diagnostic=row['diagnosticUniformBodyLandmarkFit']
        s=diagnostic['uniformScaleToMaster'];tx,ty=diagnostic['translationToMaster']
        rendered=images[9].transform(reference.size,Image.Transform.AFFINE,(1/s,0,-tx/s,0,1/s,-ty/s),Image.Resampling.BICUBIC)
        canvas=Image.new('RGBA',reference.size,(242,245,248,255));canvas.alpha_composite(rendered);canvas.alpha_composite(outline)
        active='active JSON applies body-fit' if args.fit_zebra9 else 'active JSON stays scale1'
        ImageDraw.Draw(canvas).text((12,8),f'Frame9 whole-body scale={s:.8f} shift=({tx:.5f},{ty:.5f}) RMS={diagnostic["weightedRmsMasterPixels"]:.2f}px; {active}',fill=(30,42,55))
        canvas.save(SOURCE/'zebra-registration-frame9-bodyfit-diagnostic-v4-12.png')
    print(json.dumps({'animal':animal,'rows':[{k:r[k] for k in ['frame','panel','uniformScaleToMaster','translationToMaster','weightedRmsMasterPixels','maximumLandmarkResidualMasterPixels','nccScores']} for r in rows]},indent=2))
