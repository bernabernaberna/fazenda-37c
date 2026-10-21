"""Derivados de micrografias reais; sem síntese, retoque celular ou alteração de cor."""
import json,pathlib,hashlib
from PIL import Image,ImageOps
ROOT=pathlib.Path(__file__).resolve().parent
RAW={x['id']:x for x in json.loads((ROOT/'sources-raw.json').read_text(encoding='utf8'))}
# crop=(left,top,right,bottom), em pixels do original; rotação depois do recorte.
SPECS=[
 dict(id='pacini',source='pacini',title='Corpúsculo lamelar no tecido cutâneo',crop=None,rotation=0,description='Corpúsculo lamelar amplo com lamelas concêntricas; tecido adiposo à direita.',author='Mikael Häggström',species='Humana (contexto de micrografia cutânea clínica; descrição de consentimento da fonte)',stain='Não informada na página da imagem'),
 dict(id='adiposo-pacini',source='pacini',title='Tecido adiposo no campo cutâneo',crop=[1705,100,2048,1320],rotation=0,description='Recorte da região direita da micrografia do corpúsculo lamelar, com células adiposas de grandes espaços claros.',author='Mikael Häggström',species='Humana (contexto de micrografia cutânea clínica; descrição de consentimento da fonte)',stain='Não informada na página da imagem'),
 dict(id='pele-pilosa',source='pele-pilosa',title='Pele pilosa do couro cabeludo',crop=[300,550,3490,3500],rotation=0,description='Epiderme, derme, folículo piloso e glândulas sebáceas em couro cabeludo humano; artefato de separação do estrato córneo preservado.',author='Lazar.zenit',species='Humana',stain='Hematoxilina e eosina (categoria H&E da fonte)'),
 dict(id='ductos-sudoriparos',source='ductos-sudoriparos',title='Perfis tubulares no tecido cutâneo',crop=[1200,240,3770,2540],rotation=0,description='Perfis de glândula sudorípara; ponteira do microscópio original preservada. A fonte identifica epitélio cúbico estratificado.',author='Athikhun.suw',species='Humana (o rótulo original identifica couro cabeludo; espécie não explícita na descrição da página)',stain='Não informada na página da imagem'),
 dict(id='pilosebacea',source='pilosebacea',title='Unidade pilossebácea',crop=None,rotation=0,description='Folículo piloso diagonal e lóbulos sebáceos. A fonte informa unidade normal em amostra também portadora de nevo intradérmico benigno; não usada para diagnóstico de nevo.',author='Kilbad; ajuste de cor/brilho da versão Commons: Tilifa Ocaufa',species='Humana (contexto anatomopatológico da fonte)',stain='Hematoxilina e eosina (informada na fonte)'),
 dict(id='derme-colagena',source='pilosebacea',title='Feixes conjuntivos da derme',crop=[0,80,640,1040],rotation=0,description='Recorte da região esquerda da unidade pilossebácea, com feixes de colágeno em diferentes orientações.',author='Kilbad; ajuste de cor/brilho da versão Commons: Tilifa Ocaufa',species='Humana (contexto anatomopatológico da fonte)',stain='Hematoxilina e eosina (informada na fonte)'),
 dict(id='meissner',source='meissner',title='Micrografia da pele glabra com receptor superficial',crop=None,rotation=0,description='Micrografia com seta original apontando corpúsculo de Meissner na papila dérmica; epiderme e estrato córneo visíveis.',author='OpenStax Anatomy and Physiology',species='Não informada explicitamente na página da imagem (atlas de anatomia e fisiologia humana)',stain='Não informada na página da imagem'),
 dict(id='epiderme-meissner',source='meissner',title='Epiderme e região papilar',crop=[0,35,800,430],rotation=0,description='Recorte superior da micrografia com estrato córneo, camadas epidérmicas celulares e papilas dérmicas. Parte da seta original permanece.',author='OpenStax Anatomy and Physiology',species='Não informada explicitamente na página da imagem (atlas de anatomia e fisiologia humana)',stain='Não informada na página da imagem'),
 dict(id='pele-espessa-panorama',source='pele-espessa-panorama',title='Pele da polpa digital em panorama',crop=None,rotation=180,description='Micrografia da polpa digital; superfície orientada para o topo por rotação de 180 graus. Campo amplo com epiderme, derme e perfis profundos.',author='Глущенко Арина (Arina Glushchenko)',species='Humana (categoria Histology of human skin e descrição polpa digital na fonte)',stain='Não informada na página da imagem')
]
result=[]
for spec in SPECS:
    raw=RAW[spec['source']];info=raw['info'];meta=info['extmetadata']
    orig=ROOT/raw['originalFile'];im=ImageOps.exif_transpose(Image.open(orig)).convert('RGB')
    originalSize=list(im.size)
    if spec['crop']:im=im.crop(tuple(spec['crop']))
    if spec['rotation']:im=im.rotate(spec['rotation'],expand=True)
    im.thumbnail((1000,1000),Image.Resampling.LANCZOS)
    out=ROOT/(spec['id']+'.webp');im.save(out,'WEBP',quality=86,method=6)
    changes=[]
    if spec['crop']:changes.append('Recorte retangular '+str(spec['crop'])+' px do original, sem retoque de tecido')
    if spec['id']=='ductos-sudoriparos':changes.append('O recorte exclui a legenda inglesa da borda; ponteira original mantida')
    if spec['rotation']:changes.append('Rotação de '+str(spec['rotation'])+' graus')
    changes.append('Redimensionamento proporcional até 1000 px e conversão WebP qualidade 86; cores sem ajuste')
    license=meta.get('LicenseShortName',{}).get('value','Domínio público')
    if spec['source']=='pilosebacea':license='Domínio público (PD-user)'
    licenseUrl=meta.get('LicenseUrl',{}).get('value','https://commons.wikimedia.org/wiki/Template:PD-user').replace('http:','https:')
    item={**{k:v for k,v in spec.items() if k not in ('source','crop','rotation')},'file':out.name,'sourceUrl':info['descriptionurl'],'originalUrl':info['url'].split('?')[0],'license':license,'licenseUrl':licenseUrl,'changes':'; '.join(changes),'width':im.width,'height':im.height,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'size':out.stat().st_size,'originalFile':raw['originalFile'],'originalSha256':raw['originalSha256'],'originalWidth':originalSize[0],'originalHeight':originalSize[1],'crop':spec['crop'],'rotation':spec['rotation'],'inspected':True}
    result.append(item)
(ROOT/'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('derivados',len(result),'bytes',sum(x['size'] for x in result))
for x in result:print(x['id'],x['width'],x['height'],x['size'])
