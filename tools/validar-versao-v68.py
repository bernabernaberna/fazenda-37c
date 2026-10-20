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
out=root/'analise'/'validacao-v68';out.mkdir(parents=True,exist_ok=True)
env=dict(os.environ)
env.setdefault('PLAYWRIGHT_MODULE','C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
suites=args.only or [
 'validar-acoes-integracao-v67.cjs','validar-historia.cjs','validar-historia-v2.cjs',
 'validar-saga-profunda-v6.cjs','validar-vida-fazenda-v6.cjs','validar-sandbox-infinito.cjs',
 'validar-jogabilidade.cjs','validar-mapa-organico-v63.cjs','validar-graficos-v68.cjs',
 'validar-vegetacao-v63.cjs','validar-save-objetos-v2.cjs','validar-save-animais-v61.cjs',
 'validar-vida-v66.cjs','validar-interiores-v66.cjs','validar-cultivos-v66.cjs',
 'validar-consequencias-v66.cjs','validar-saga-integrada-v6.cjs','validar-pele-histologia-v6.cjs',
 'validar-audio-original.cjs','validar-audio-integrado.cjs','validar-audio-v4.cjs']
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
