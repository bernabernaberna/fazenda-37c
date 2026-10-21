import pathlib,json,hashlib
from PIL import Image
p=pathlib.Path(__file__).resolve().parent
m=json.loads((p/'manifest.json').read_text(encoding='utf8'))
used={'pacini','pele-pilosa','ductos-sudoriparos','pilosebacea','meissner','pele-espessa-panorama'}
assert len(m)==len({x['id'] for x in m})
checks=[]
for x in m:
    f=p/x['file'];o=p/x['originalFile'];im=Image.open(f)
    assert hashlib.sha256(f.read_bytes()).hexdigest()==x['sha256']
    assert hashlib.sha256(o.read_bytes()).hexdigest()==x['originalSha256']
    assert max(im.size)<=1000 and im.size==(x['width'],x['height'])
    assert x['license'] and x['licenseUrl'].startswith('https:') and x['author']
    assert x['sourceUrl'].startswith('https://commons.wikimedia.org/wiki/File:')
    checks.append({'id':x['id'],'hash':True,'originalHash':True,'size':[x['width'],x['height']],'bytes':x['size'],'license':x['license']})
report={'pass':True,'derivatives':len(m),'distinctOriginals':len({x['originalSha256'] for x in m}),'allBytes':sum(x['size'] for x in m),'mainBytes':sum(x['size'] for x in m if x['id'] in used),'checked':checks}
(p/'validacao.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,ensure_ascii=True))
