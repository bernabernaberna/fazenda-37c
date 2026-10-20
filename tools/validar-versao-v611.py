"""Suíte serial com saída íntegra e código de retorno de cada processo.
Executar depois do build final. Benchmark separado exige navegador ocioso.
"""
from pathlib import Path
import subprocess, json, os, hashlib, datetime, time, argparse
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--only',nargs='*')
args=parser.parse_args()
node=os.environ.get('FARM37_NODE',r'C:\Program Files\nodejs\node.exe')
out=root/'analise'/'validacao-v611';out.mkdir(parents=True,exist_ok=True)
env=dict(os.environ)
env.setdefault('PLAYWRIGHT_MODULE','C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
suites=args.only or [
 'validar-jogabilidade.cjs','validar-sandbox-infinito.cjs','validar-save-objetos-v2.cjs',
 'validar-save-animais-v610.cjs','validar-acoes-integracao-v610.cjs','validar-cultivos-v66.cjs',
 'validar-vida-fazenda-v6.cjs','validar-pele-histologia-v6.cjs','validar-fronteira-integrada-v68.cjs',
 'validar-itens-v69.cjs','validar-item-art-v69.cjs','validar-inventario-v69.cjs','validar-cuidados-v610.cjs','validar-vida-v610.cjs','validar-ponte-biomas-v611.cjs','validar-atuacao-v611.cjs','validar-vozes-v611.cjs','validar-vale-integrado-v611.cjs','validar-caderno-v611.cjs','validar-cenas-v611.cjs','validar-agua-v611.cjs','validar-vegetacao-v611.cjs','validar-mapa-organico-v611.cjs']
report={'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256((root/'jogo.html').read_bytes()).hexdigest(),'suites':[]}
for name in suites:
 start=time.monotonic();code=-1;log=out/(name+'.log')
 with log.open('w',encoding='utf-8') as f:
  try:
   r=subprocess.run([node,str(root/'tools'/name)],cwd=root,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=300)
   code=r.returncode
  except subprocess.TimeoutExpired: f.write('\nTIMEOUT: 300 segundos\n')
 report['suites'].append({'name':name,'exitCode':code,'seconds':round(time.monotonic()-start,2),'log':str(log)})
 (out/'suite.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(name+': '+('OK' if code==0 else 'FALHOU')+' ('+str(round(time.monotonic()-start,1))+'s)',flush=True)
report['pass']=all(s['exitCode']==0 for s in report['suites'])
report['unchangedBuild']=report['sha256']==hashlib.sha256((root/'jogo.html').read_bytes()).hexdigest()
(out/'suite.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
raise SystemExit(0 if report['pass'] and report['unchangedBuild'] else 1)
