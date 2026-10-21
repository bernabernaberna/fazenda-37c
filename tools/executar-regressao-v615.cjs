/* Executa o teste original no seu próprio diretório. Somente os destinos
   das evidências e das capturas ganham um prefixo; assertions não mudam. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const name=process.argv[2];assert.match(name||'',/^validar-[a-z0-9-]+\.cjs$/);
const file=path.resolve(__dirname,name);assert.equal(path.dirname(file),__dirname);
let source=fs.readFileSync(file,'utf8'),redirects=0;
source=source.replace(/(['"])(\.\.\/)?analise(?=\/|['"])/g,(_,quote,parent='')=>{redirects++;return quote+parent+'analise/validacao-v615/regressoes';});
source=source.replaceAll('/shot?name=','/shot?name=v615-regressao-').replaceAll('site/shots/','site/shots/v615-regressao-');
source=source.replace("'site','shots',name+", "'site','shots','v615-regressao-'+name+");
fs.mkdirSync(path.resolve(__dirname,'../analise/validacao-v615/regressoes/revisao-completa'),{recursive:true});
console.log(JSON.stringify({original:name,outputRedirects:redirects,artifactPrefix:'analise/validacao-v615/regressoes',capturePrefix:'v615-regressao-',assertions:'originais',filename:file}));
const instance=new Module(file,module);instance.filename=file;instance.paths=Module._nodeModulePaths(__dirname);instance._compile(source,file);
