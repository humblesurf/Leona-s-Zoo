import fs from 'node:fs';
const rows={
music:[
['musicpiano','Piano','钢琴','鋼琴','🎹',"I'm a piano. My keys play high and low notes. Let's make a little tune!",'我是钢琴，琴键会弹出高高低低的声音。一起弹首小曲吧！','我係鋼琴，琴鍵會彈出高高低低嘅聲音。一齊彈首小曲啦！','piano'],
['musicdrum','Little drum','小鼓','小鼓','🥁',"I'm a little drum. Tap me gently, then try a stronger beat. Boom, boom!",'我是小鼓，轻轻敲，再试试重一点。咚，咚！','我係小鼓，輕輕敲，再試吓重啲。咚，咚！','drum'],
['musicxylophone','Xylophone','木琴','木琴','🎵',"I'm a xylophone. My wooden bars make bright notes when the mallets tap them.",'我是木琴，小槌敲敲木条，就会发出清脆的声音。','我係木琴，小槌敲吓木條，就會發出清脆嘅聲音。','xylophone'],
['musictambourine','Tambourine','铃鼓','鈴鼓','🎶',"I'm a tambourine. Shake my little jingles. Jingle, jingle!",'我是铃鼓，摇一摇，小铃片叮当响！','我係鈴鼓，搖一搖，小鈴片叮噹響！','tambourine'],
['musicmaracas','Maracas','沙锤','沙鎚','🎶',"We're maracas. Little seeds rattle inside us. Shake slowly, then quickly!",'我们是沙锤，小颗粒在里面沙沙响。慢慢摇，再快快摇！','我哋係沙鎚，小粒粒喺入面沙沙響。慢慢搖，再快快搖！','maracas']],
beach:[
['beachumbrella','Beach umbrella','遮阳伞','太陽傘','⛱️',"I'm a beach umbrella. My shade makes a cool little spot on the sand.",'我是遮阳伞，在沙滩上撑起一片凉凉的阴影。','我係太陽傘，喺沙灘撐起一片涼涼嘅陰影。','beach-umbrella'],
['beachbucket','Sand bucket','沙桶','沙桶','🪣',"I'm a sand bucket. Fill me with sand, then tip me over to make a little tower.",'我是沙桶，装满沙子，倒过来，就变成小塔啦！','我係沙桶，裝滿沙，再倒轉，就變成小塔喇！','beach-bucket'],
['beachshovel','Shovel','铲子','鏟仔','🏖️',"I'm a shovel. Scoop, scoop! Let's dig a small hole in the sand.",'我是铲子，铲呀铲，一起挖个小沙坑！','我係鏟仔，鏟呀鏟，一齊挖個小沙坑！','beach-shovel'],
['beachshell','Seashell','贝壳','貝殼','🐚',"I'm a seashell. Look at my ridges. A little sea animal once lived inside.",'我是贝壳，身上有一条条纹路。小海洋动物曾经住在里面。','我係貝殼，身上有一條條紋路。小海洋動物曾經住喺入面。','beach-shell'],
['beachcastle','Sandcastle','沙堡','沙堡','🏰',"I'm a sandcastle. Stack the sandy towers and pat them gently. Ta-da!",'我是沙堡，堆起小沙塔，轻轻拍一拍。完成啦！','我係沙堡，堆起小沙塔，輕輕拍一拍。完成喇！','beach-castle'],
['beachcrab','Little crab','小螃蟹','小蟹','🦀',"I'm a little crab. My little legs help me scuttle sideways across the sand.",'我是小螃蟹，小脚带着我横着走过沙滩。','我係小蟹，小腳帶住我橫住行過沙灘。','beach-crab'],
['beachwave','Wave','海浪','海浪','🌊',"I'm a wave. I roll onto the shore, then slide back into the sea. Whoosh!",'我是海浪，轻轻冲上岸，再退回海里。哗啦啦！','我係海浪，輕輕湧上岸，再退返海入面。嘩啦啦！','beach-wave']]
};
for(const [scene,list] of Object.entries(rows)){
 const dialogue=Object.fromEntries(list.map(([id,en,cmn,yue,emoji,e,c,y,motion])=>[id,{name:{en,cmn,yue},emoji,intro:{en:e,cmn:c,yue:y},kind:'discovery'}]));
 const dir='geo/assets/chapters-v4-9/'+scene;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/dialogue.json',JSON.stringify(dialogue,null,2));
}
// Asset packaging writes dimensions and placements after art review.
console.log('Music + beach dialogue ready: 12 objects.');
