import fs from 'node:fs';
import crypto from 'node:crypto';
const source='geo/assets/animation/v4-7/source/';
const records=[
  {
    "id": "cheetah",
    "accepted": true,
    "gait": "rotary gallop",
    "evidence": "Eight ordered whole drawings show staggered forecontacts 0/1, gathered recovery 2/3, alternating hind contacts 4/5, hind push 6, extended recovery 7. Forepaws in 4–6 correctly airborne after targeted repair. Four anatomical limb identities remain readable; torso registration stable.",
    "style": "Sculpted child-friendly 3D matching original poster."
  },
  {
    "id": "tiger",
    "accepted": true,
    "gait": "compact gallop",
    "evidence": "Eight ordered drawings separate forecontacts, gather/recover, hindcontacts with airborne front wrists, then extend. Fixed canvas source pose2 repaired low hind toe; latest runtime frame no below-ground hind toe. Head/torso stable except deliberate small bounce.",
    "style": "Low-poly sculpted volumes and painted stripes wrap anatomy; no photoreal fur or flat cut-paper third style."
  },
  {
    "id": "jaguar",
    "accepted": true,
    "gait": "short compact bound",
    "evidence": "Forecontact roles alternate; front paws folded/suspended during rear support in 4–6. Near/far hind identity visible across cycle despite natural occlusion in one rear contact pose. Compact gathering and reach differ from cheetah extension; stable original world registration.",
    "style": "Soft sculpted 3D consistent with original rainforest animals."
  },
  {
    "id": "lioncub",
    "accepted": true,
    "gait": "light diagonal trot",
    "evidence": "Near-front lead in 0 versus far-front lead in 4; corresponding diagonal rear limbs change. Gather/pass drawings and short flight have all four connected limbs. No fixed rear struts; fixed original canvas registration.",
    "style": "Low-poly stylized sculpted cub."
  },
  {
    "id": "buffalo",
    "accepted": true,
    "gait": "four-beat walk",
    "evidence": "Selected four new whole drawings: 0 near-hind recovery, 1 near-fore recovery, 2 far-hind recovery, 3 far-fore recovery. Other three limbs support; whole hoof clearance visible in all recovery poses. Near-fore identity repair prevents duplicate far-fore recovery. Latest same-zoom actual runtime contact sheet checked; stable head/shoulder/torso full camera.",
    "rejected": "Old eight-pose atlas and proposed reorder rejected because no readable hind recovery."
  },
  {
    "id": "rhino",
    "accepted": true,
    "gait": "four-beat walk",
    "evidence": "Four whole drawings show near-hind, near-fore, far-hind, far-fore independent recovery. Same-zoom actual runtime and original source camera inspected. Pose4 head/upper torso rise is weight transfer with common planted soles and comparable horizontal torso/face proportions, not whole-bounding-box scale normalization. Small authored drawing variation accepted."
  },
  {
    "id": "warthog",
    "accepted": true,
    "gait": "brisk short-step walk",
    "evidence": "Actual ordered runtime drawings show near/far fore recovery distinguished by shoulder depth and limb width, and both hind limbs raised in different phases (rear outer in 2/5, inner in 3/6). Torso/head stable. Accept as brisk walk rhythm rather than claiming mechanically exact diagonal trot."
  },
  {
    "id": "elephantcalf",
    "accepted": true,
    "gait": "grounded four-beat stepping",
    "evidence": "Actual ordered runtime: both foreleg recovery roles switch; rear outer visibly lifts in 2/6 and inner lifts in 3/7. Bright near and dark far feet change airborne/stance roles. No whole-body flight or fixed hindlegs; body/head stable."
  },
  {
    "id": "lioness",
    "accepted": true,
    "gait": "four-beat walk",
    "evidence": "Final replacement four whole drawings and same-zoom actual runtime inspected: bright near-fore recovery, dark far-hind recovery, dark far-fore recovery, bright near-hind recovery. Each has other three paws supporting. Complete four-leg root anatomy and correct near/far phase identities, stable head/torso framing, slight deliberate weight transfer. Configuration correctly labels walk.",
    "rejected": "Old eight-pose atlas had foreleg swapping but frozen hind supports; fully withdrawn, not counted as final acceptance."
  },
  {
    "id": "zebra",
    "accepted": true,
    "gait": "brisk four-beat walk",
    "evidence": "Final four whole drawings and same-zoom actual runtime checked: 0 bright outer near-hind recovery, 1 broad bright near-fore recovery, 2 dark inner far-hind recovery, 3 dark inner far-fore recovery. Three supporting soles and one full hoof-height recovery clearance in each key. Head, stripes, shoulder and torso full-camera registration stable. Explicit walk configuration; not labelled diagonal trot.",
    "rejected": "Old eight-pose atlas withdrawn for missing far-hind recovery. New initial pose0 duplicate far-hind role withdrawn and repaired to near-hind; final source no fixed hindleg."
  },
  {
    "id": "elephant",
    "accepted": true,
    "gait": "grounded deliberate walk",
    "evidence": "Final same-zoom runtime cycle inspected after replacement raw4 dark far-hind recovery. Both forelegs and bright near-hind retain distinct recovery in other original drawings. New far-hind raised under abdomen with three supporting feet, no whole-body flight. Exact whole-view camera and torso are compatible with other seven originals; no bbox or forced ground alignment.",
    "rejected": "Original raw4 and atlas sequence lacked clear far-hind recovery; replacement whole drawing supplies missing phase instead of hiding defect by reordering."
  }
];
const sha=p=>fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;
for(const r of records){
 const pp=source+r.id+'-pack.json';r.packHash=sha(pp);const p=fs.existsSync(pp)?JSON.parse(fs.readFileSync(pp,'utf8').replace(/^\uFEFF/,'')):{};
 const paths=p.poseFiles||[source+r.id+'-source.png'];r.sourceHashes=Object.fromEntries(paths.map(x=>[x,sha(x)]));
 r.sourceImageSizes=Object.fromEntries(paths.filter(x=>fs.existsSync(x)&&x.endsWith('.png')).map(x=>{const b=fs.readFileSync(x);return [x,{width:b.readUInt32BE(16),height:b.readUInt32BE(20)}];}));
 r.activePackagingSource=p.poseFiles?source+r.id+'-painted-poses.png':source+r.id+'-source.png';r.sourceHash=sha(r.activePackagingSource);
 r.runtimeContactSheet='screenshots/v4-7/runtime-poses/'+r.id+'.png';r.runtimeContactSheetHash=sha(r.runtimeContactSheet);
 r.cycle=p.cycle||[];r.holdsMs=p.holdsMs||[];
}
const paths=['screenshots/v4-7/cats-actual-cadence.json','screenshots/v4-7/hoof-actual-cadence.json'];
const cadence=[];for(const path of paths)if(fs.existsSync(path)){const c=JSON.parse(fs.readFileSync(path,'utf8'));cadence.push({path,sha256:sha(path),errors:c.errors,results:c.characters.map(x=>({id:x.id,speed:x.speed,framesSeen:x.framesSeen,expectedDuration:x.expectedDuration,observedDuration:x.observedDuration,rafP95:x.rafP95,rafMax:x.rafMax}))});}
const report={reviewer:'cel_gait_review',updatedAt:new Date().toISOString(),scope:'Whole-drawing limb identity, phase, grounded contact, fixed camera, selected runtime sheet and real wall-clock cadence. Browser direction/crop/repeat/reduced-motion final gates remain parent responsibility.',finalAcceptedIds:records.filter(x=>x.accepted).map(x=>x.id),pendingIds:records.filter(x=>!x.accepted).map(x=>x.id),records,cadence,method:'Near/far fore/hind each must visibly lift, recover forwards and return to stance over the cycle; four visible feet in one drawing alone is insufficient. Frames may naturally occlude one far foot. Exact authored body pixels are not required, but no bbox-normalized scale/ground fixes. Limited rhythmic key drawings accepted; no procedural rig final images.'};
fs.writeFileSync(source+'cats-hoof-temporal-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({accepted:report.finalAcceptedIds,pending:report.pendingIds}));
