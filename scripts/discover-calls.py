import json, urllib.request, urllib.parse, concurrent.futures, re,sys,time
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path
QUERIES={
 'tiger':'tiger growling filetype:audio', 'lion':'lion roaring filetype:audio',
 'elephant':'elephant trumpeting filetype:audio', 'zebra':'zebra call filetype:audio',
 'hippo':'hippopotamus sound filetype:audio', 'rhino':'rhinoceros call filetype:audio',
 'cheetah':'cheetah chirp filetype:audio','leopard':'leopard sound filetype:audio',
 'jaguar':'jaguar saw filetype:audio','crocodile':'crocodile call filetype:audio',
 'flamingo':'flamingo calls filetype:audio','meerkat':'meerkat call filetype:audio',
 'ostrich':'ostrich call filetype:audio','buffalo':'Syncerus caffer filetype:audio',
 'gazelle':'gazelle call filetype:audio','warthog':'warthog call filetype:audio',
 'gorilla':'gorilla vocal filetype:audio','orangutan':'orangutan call filetype:audio',
 'monkey':'squirrel monkey call filetype:audio','toucan':'Ramphastos call filetype:audio',
 'macaw':'Ara macao call filetype:audio','frog':'Agalychnis call filetype:audio',
 'hummingbird':'hummingbird wing sound filetype:audio','boa':'snake hissing filetype:audio',
 'otter':'river otter call filetype:audio','capybara':'capybara call filetype:audio',
 'tapir':'tapir whistle filetype:audio','dolphin':'dolphin underwater filetype:audio',
 'whale':'humpback whale song filetype:audio','seal':'Weddell seal filetype:audio',
 'penguin':'emperor penguin call filetype:audio','walrus':'walrus call filetype:audio',
 'arcticfox':'arctic fox call filetype:audio','polarbear':'polar bear growling filetype:audio'
}
def lookup(item):
 id,q=item
 params={'action':'query','format':'json','generator':'search','gsrnamespace':6,'gsrsearch':q,'gsrlimit':4,'prop':'imageinfo','iiprop':'url|extmetadata'}
 req=urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params),headers={'User-Agent':'AnimalFriends/2.0 (educational local project)'})
 try:
  data=json.load(urllib.request.urlopen(req,timeout=35))
  out=[]
  for page in sorted(data.get('query',{}).get('pages',{}).values(),key=lambda x:x.get('index',0)):
   i=page.get('imageinfo',[{}])[0]; m=i.get('extmetadata',{})
   val=lambda k:re.sub('<[^>]+>','',str(m.get(k,{}).get('value','')))
   out.append({'title':page['title'],'description':val('ImageDescription'),'license':val('LicenseShortName'),'licenseUrl':val('LicenseUrl'),'author':val('Artist'),'url':i.get('url','').split('?')[0],'source':i.get('descriptionurl','')})
  print(id,[(x['title'],x['description'][:120],x['license']) for x in out],flush=True)
  return id,out
 except Exception as e:
  print(id,str(e),flush=True);return id,[]
QUERIES.update({'zebra':'"Equus" filetype:audio -pronunciation', 'hippo':'"Hippopotamus" filetype:audio -pronunciation', 'rhino':'"Ceratotherium" filetype:audio', 'leopard':'"Panthera pardus" filetype:audio -pronunciation','flamingo':'"Phoenicopterus" filetype:audio','meerkat':'"Suricata" filetype:audio','ostrich':'"Struthio" filetype:audio','warthog':'"Phacochoerus" filetype:audio','gorilla':'"Gorilla" filetype:audio -pronunciation','monkey':'"Saimiri" filetype:audio','toucan':'"Ramphastos" filetype:audio','macaw':'"Ara macao" filetype:audio','frog':'"Agalychnis" filetype:audio','otter':'"Lutra" filetype:audio -pronunciation','capybara':'"Hydrochoerus" filetype:audio','tapir':'"Tapirus" filetype:audio','penguin':'"Aptenodytes forsteri" filetype:audio','arcticfox':'"Vulpes lagopus" filetype:audio','polarbear':'"Ursus maritimus" filetype:audio','walrus':'"Odobenus" filetype:audio'})
result={}
for item in QUERIES.items():
 id,rows=lookup(item);result[id]=rows
 Path('geo/assets/calls/candidates.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 time.sleep(2)
Path('geo/assets/calls/candidates.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
