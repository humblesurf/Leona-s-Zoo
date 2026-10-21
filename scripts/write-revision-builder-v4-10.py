from pathlib import Path
p=Path('share/build-share-v4-9.mjs');s=p.read_text(encoding='utf8').replace('runtime-v4-9','runtime-v4-10').replace('Leonas-Zoo-v4-9','Leonas-Zoo-v4-10').replace('zip-files-v4-9','zip-files-v4-10').replace('build-v4-9','build-v4-10')
s=s.replace("'chapters-data','chapter-sounds'","'chapters-data','revisions-data','animal-fixes-v4-10','chapter-sounds'")
s=s.replace("if(usedIds.size!==130||Object.keys(objects).length!==41||narrations.size!==1170||state.window.GAME_SCENE_ORDER.length!==15)throw Error('Incomplete V4.9 chapters');","if(usedIds.size!==118||narrations.size!==1062||state.window.GAME_SCENE_ORDER.length!==13)throw Error('Incomplete V4.10 revision');")
s=s.replace("if(Object.values(animations).filter(a=>a.cel).length!==19)throw Error('Missing preserved quadruped art');", "const old={window:{}};for(const f of ['animation-data','authored-motion-data'])vm.runInNewContext(fs.readFileSync(path.join(out,'runtime-v4-9/assets/'+f+'.js'),'utf8'),old);const preserved=Object.entries(old.window.ANIMAL_ANIMATIONS).filter(([id,d])=>d.cel);if(preserved.length!==19||preserved.some(([id,d])=>JSON.stringify(d)!==JSON.stringify(animations[id])))throw Error('Modified frozen quadruped art');")
s=s.replace(" media.add(scene.ambience);", " media.add(scene.ambience);for(const d of [...(scene.decor||[]),...(scene.backgroundHerds||[])])media.add(d.sprite||animations[d.id].poster);")
s=s.replace("Object.values({...previousObjects,...objects})", "Object.entries({...previousObjects,...objects}).filter(([id,d])=>usedIds.has(id)).map(([id,d])=>d)")
s=s.replace("'chapters-data.js','chapter-motion.js'", "'chapters-data.js','revisions-data.js','animal-fixes-v4-10.js','chapter-motion.js'").replace("'chapter.css'];", "'chapter.css','revisions.css'];")
a=s.index('const readme=');b=s.index('fs.writeFileSync(path.join(runtime,\'README.txt\')',a)
readme="Leona's ZOO · V4.10\\n\\n移除天气与四季、港口独立章节。13个场景、118类互动内容、1062段三语配音均内置。\\n香港：连续5.7:1海滨城市画卷，水路与电车路衔接；建筑直接融入背景。\\n超市：真正冷柜与货架，点击货架商品入篮。音乐小屋：乐器直接融入音乐教室，保留真实采样与快慢轻重四拍演奏。\\n海边：增加游客、亲子玩沙与休闲小屋，删除独立波浪。露营：原山景保留，增加野餐家庭、营灯、地图、望远镜。\\n草原：前中远景、群体变化、鳄鱼与水面身影；海底：更大的鲸鱼与三只鲨鱼。\\n羚羊恢复站立、蹬地、跃起、落地；蟒蛇恢复抬颈吐信；长颈鹿树叶从枝头消耗。\\n19类已有四足行走和奔跑原画及节奏保留。V5不参与。\\n英语默认，普通话/粤语/两语/三语轮播可选；背景音首次点击或滑动后启动，可右上角开关。\\n直接打开Leonas-Zoo-v4-10.html可离线使用；ZIP解压后打开index.html。\\n?scene=hongkong/supermarket/music/beach/camp/savanna/ocean 直达各篇。\\n完整来源和授权见CREDITS.md。\\n"
s=s[:a]+"const readme="+repr(readme).replace('\\\\n','\\n')+";\n"+s[b:]
s=s.replace("version:'V4.9',base:'V4.8'", "version:'V4.10',base:'V4.9'").replace("chapters:15,", "chapters:13,")
anchor="const files=['index.html'"
position=s.index(anchor)
s=s[:position]+"metadata.push('assets/animation/v4-10/packaging.json','assets/voice/v4-10/script.json','assets/voice/v4-10/production.json','assets/chapters-v4-10/manifest.json','assets/chapters-v4-10/prompts-root.json');for(const id of ['beach','camp','hongkong','music','supermarket'])for(const f of fs.readdirSync(path.join(geo,'assets/chapters-v4-10',id)))if(/\\.(json|txt)$/.test(f))metadata.push('assets/chapters-v4-10/'+id+'/'+f);\n"+s[position:]
Path('share/build-share-v4-10.mjs').write_text(s,encoding='utf8')
