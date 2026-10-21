import fs from 'node:fs';
const file='geo/assets/quadruped-walk.js',base=fs.readFileSync('.upgrade-backup/v4-3-before-walk-review/quadruped-walk.js','utf8'),header=base.slice(0,base.indexOf('function polygon('));
fs.writeFileSync(file,header+fs.readFileSync('scripts/walk-renderer-v4-4.txt','utf8'));
