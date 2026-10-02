"""
Gera release/Fazenda37C-COMPLETO.html — UM arquivo com TUDO:
  • portal cinematográfico (proposta + telas reais + escolha Jogar / Professor)  [overlay]
  • o jogo completo (áudio embutido; saves funcionam pois é o documento principal)
  • painel do professor (dentro de um iframe; requer internet p/ Supabase)

Pré-requisito: rode `python build.py` e `python package.py` antes
(usamos release/Fazenda37C-standalone.html, que é o jogo com áudio já embutido).

Uso:  python package_completo.py
"""
from __future__ import annotations
import base64, json, mimetypes, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STANDALONE = ROOT / "release" / "Fazenda37C-standalone.html"   # jogo + áudio embutido
PROFESSOR = ROOT / "professor.html"
SHOTS = ROOT / "site" / "shots"
OUT = ROOT / "release" / "Fazenda37C-COMPLETO.html"


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def build() -> None:
    if not STANDALONE.is_file():
        raise SystemExit("ERRO: release/Fazenda37C-standalone.html não existe. Rode build.py e package.py antes.")

    game = STANDALONE.read_text(encoding="utf-8")

    # Reescreve os "Voltar ao site" (que apontavam p/ index.html) para reabrir o portal.
    game = game.replace("window.location.href='index.html'", "window.__fzPortal&&window.__fzPortal()")
    game = re.sub(r'href="index\.html"', 'href="javascript:void(0)" onclick="window.__fzPortal&&window.__fzPortal();return false;"', game)

    # Telas do jogo -> data URIs (embutidas UMA vez cada, como variáveis CSS)
    shot = lambda n: data_uri(SHOTS / n) if (SHOTS / n).is_file() else ""
    farm, skin = shot("site_farm.png"), shot("site_skin.png")
    mount, des = shot("site_mountain.png"), shot("site_desert.png")
    imgvars = ("#fzPortal{"
               f"--img-farm:url('{farm}');--img-skin:url('{skin}');"
               f"--img-mount:url('{mount}');--img-des:url('{des}');" "}")

    # Painel do professor (iframe srcdoc). Escapa </script> e aspas via JSON.
    prof_html = PROFESSOR.read_text(encoding="utf-8") if PROFESSOR.is_file() else "<p>Painel indisponível.</p>"
    prof_js = json.dumps(prof_html).replace("</", "<\\/")

    overlay = OVERLAY_TEMPLATE.replace("__IMGVARS__", imgvars).replace("__PROF_HTML__", prof_js)

    if "</body>" in game:
        game = game.replace("</body>", overlay + "\n</body>", 1)
    else:
        game = game + overlay

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(game, encoding="utf-8")
    size = OUT.stat().st_size / (1024 * 1024)
    print(f"-> {OUT}  ({size:.2f} MB)")
    print("Pronto! UM arquivo com portal cinematográfico + jogo + painel do professor.")


# =========================================================================
#  Overlay do portal — estilo AAA/cinematográfico, tudo escopado em #fzPortal
# =========================================================================
OVERLAY_TEMPLATE = r"""
<style>
__IMGVARS__
#fzPortal{position:fixed;inset:0;z-index:2147483000;overflow-y:auto;overflow-x:hidden;background:#080604;color:#f4ede0;
  font-family:'Trebuchet MS','Segoe UI',Verdana,Arial,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;}
#fzPortal *{box-sizing:border-box;margin:0;padding:0;}
#fzPortal .fzw{max-width:1240px;margin:0 auto;padding:0 28px;}
#fzPortal a{color:inherit;text-decoration:none;}
#fzPortal .disp{font-family:'Arial Narrow','Helvetica Neue Condensed',Impact,'Trebuchet MS',sans-serif;font-weight:900;text-transform:uppercase;}
#fzPortal .fzgrain{position:fixed;inset:0;z-index:6;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>");}
/* HERO */
#fzPortal .fzhero{position:relative;height:100vh;min-height:600px;display:flex;align-items:flex-end;overflow:hidden;}
#fzPortal .fzslide{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transform:scale(1.05);animation:fzShow 32s infinite;}
#fzPortal .fzslide.s1{background-image:var(--img-farm);animation-delay:0s;}
#fzPortal .fzslide.s2{background-image:var(--img-mount);animation-delay:8s;}
#fzPortal .fzslide.s3{background-image:var(--img-des);animation-delay:16s;}
#fzPortal .fzslide.s4{background-image:var(--img-skin);animation-delay:24s;}
@keyframes fzShow{0%{opacity:0;transform:scale(1.14);}4%{opacity:1;}22%{opacity:1;}28%{opacity:0;}100%{opacity:0;transform:scale(1.0);}}
#fzPortal .fzscrim{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(8,6,4,.55),rgba(8,6,4,.12) 30%,rgba(8,6,4,.55) 62%,rgba(8,6,4,.98)),
  radial-gradient(120% 80% at 50% 40%,transparent 40%,rgba(8,6,4,.7));}
#fzPortal .fzhc{position:relative;z-index:2;width:100%;padding-bottom:8vh;}
#fzPortal .fzeye{display:inline-flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:#ff9142;font-weight:bold;margin-bottom:18px;}
#fzPortal .fzeye::before{content:"";width:34px;height:2px;background:#ff6a2a;}
#fzPortal .fzmega{font-size:clamp(56px,13vw,168px);line-height:.84;letter-spacing:-.01em;text-shadow:0 6px 40px rgba(0,0,0,.6);}
#fzPortal .fzmega .h{color:#ff6a2a;text-shadow:0 0 40px rgba(255,106,42,.55);}
#fzPortal .fztag{font-size:clamp(16px,2.4vw,24px);color:#e9ddc8;margin-top:18px;max-width:640px;font-style:italic;}
#fzPortal .fzcta{margin-top:32px;display:flex;gap:14px;flex-wrap:wrap;}
#fzPortal .fzbtn{display:inline-flex;align-items:center;gap:10px;font-weight:900;font-size:15px;letter-spacing:.08em;text-transform:uppercase;padding:16px 30px;border-radius:2px;cursor:pointer;border:2px solid transparent;transition:transform .14s,background .2s,box-shadow .14s;}
#fzPortal .fzbtn:hover{transform:translateY(-3px);}
#fzPortal .fzbtn.hot{background:#ff6a2a;color:#0c0704;box-shadow:0 12px 34px rgba(255,106,42,.4);}
#fzPortal .fzbtn.hot:hover{background:#ff9142;}
#fzPortal .fzbtn.out{background:rgba(255,255,255,.06);color:#f4ede0;border-color:rgba(255,255,255,.22);backdrop-filter:blur(4px);}
#fzPortal .fzscroll{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:3;color:#a89b86;font-size:11px;letter-spacing:.3em;text-transform:uppercase;display:flex;flex-direction:column;align-items:center;gap:8px;animation:fzBob 2s infinite;}
#fzPortal .fzscroll i{width:1px;height:30px;background:linear-gradient(#ff6a2a,transparent);display:block;}
@keyframes fzBob{0%,100%{transform:translateX(-50%);}50%{transform:translateX(-50%) translateY(7px);}}
/* REVEAL */
#fzPortal [data-fz]{opacity:0;transform:translateY(36px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1);}
#fzPortal [data-fz].in{opacity:1;transform:none;}
/* MANIFESTO */
#fzPortal .fzman{padding:min(16vh,140px) 0;text-align:center;background:linear-gradient(180deg,#080604,#0e0a06);}
#fzPortal .fzman h2{font-size:clamp(34px,6vw,84px);line-height:.98;}
#fzPortal .fzman .h{color:#ff6a2a;} #fzPortal .fzman .c{color:#3aa0ff;}
#fzPortal .fzman p{max-width:720px;margin:24px auto 0;color:#a89b86;font-size:clamp(15px,2vw,19px);}
/* SHOWCASE */
#fzPortal .fzshow{padding:64px 0;}
#fzPortal .fzrow{display:grid;grid-template-columns:1.1fr 1fr;gap:52px;align-items:center;}
#fzPortal .fzrow.rev{grid-template-columns:1fr 1.1fr;}
#fzPortal .fzrow.rev .fztxt{order:2;}
#fzPortal .fzkick{font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#7fd0ff;font-weight:bold;margin-bottom:12px;}
#fzPortal .fzkick.h{color:#ff9142;}
#fzPortal .fzshow h3{font-size:clamp(30px,4.6vw,56px);line-height:.96;margin-bottom:14px;}
#fzPortal .fzshow p{color:#d3c6b0;font-size:16px;max-width:520px;}
#fzPortal .fzmedia{position:relative;border-radius:6px;overflow:hidden;border:1px solid rgba(255,225,180,.14);box-shadow:0 30px 80px rgba(0,0,0,.6);aspect-ratio:768/500;background-size:cover;background-position:center;}
#fzPortal .fzmedia::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 90px rgba(0,0,0,.5);}
/* BIOMAS */
#fzPortal .fzbio{padding:74px 0 26px;}
#fzPortal .fzhead{text-align:center;margin-bottom:40px;}
#fzPortal .fzhead h2{font-size:clamp(30px,5.4vw,68px);line-height:.95;}
#fzPortal .fzhead p{color:#a89b86;margin-top:10px;letter-spacing:.06em;}
#fzPortal .fzbg{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
#fzPortal .fzbc{position:relative;height:290px;border-radius:6px;overflow:hidden;border:1px solid rgba(255,225,180,.14);background-size:cover;background-position:center;transition:transform .5s;cursor:pointer;}
#fzPortal .fzbc:hover{transform:scale(1.02);}
#fzPortal .fzbc .g{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(8,6,4,.92));}
#fzPortal .fzbc .l{position:absolute;left:22px;right:22px;bottom:20px;}
#fzPortal .fzbc .l .t{font-size:26px;line-height:1;}
#fzPortal .fzbc .l .s{font-size:13px;color:#cdbfa6;margin-top:5px;}
#fzPortal .fzbc .pin{position:absolute;top:16px;left:18px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;font-weight:900;padding:5px 10px;border-radius:2px;}
#fzPortal .pin.hot{background:#ff6a2a;color:#0c0704;} #fzPortal .pin.cold{background:#3aa0ff;color:#04121f;}
#fzPortal .pin.warm{background:#e0b64a;color:#241a05;} #fzPortal .pin.neu{background:#8fe0a0;color:#0f2a17;}
/* STATS */
#fzPortal .fzstats{padding:54px 0;border-top:1px solid rgba(255,225,180,.14);border-bottom:1px solid rgba(255,225,180,.14);background:#0e0a06;}
#fzPortal .fzstats .g{display:flex;flex-wrap:wrap;justify-content:space-around;gap:22px;text-align:center;}
#fzPortal .fzst b{display:block;font-size:clamp(38px,6vw,62px);line-height:1;color:#ff9142;}
#fzPortal .fzst span{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#a89b86;}
/* ENTRAR */
#fzPortal .fzenter{padding:90px 0 40px;}
#fzPortal .fzroles{display:grid;grid-template-columns:1fr 1fr;gap:22px;max-width:920px;margin:0 auto;}
#fzPortal .fzrole{position:relative;overflow:hidden;border-radius:8px;padding:38px 30px;border:1px solid rgba(255,225,180,.14);background:linear-gradient(180deg,rgba(30,20,10,.6),rgba(12,8,5,.8));text-align:center;display:flex;flex-direction:column;cursor:pointer;transition:transform .16s,border-color .16s,box-shadow .16s;}
#fzPortal .fzrole:hover{transform:translateY(-6px);box-shadow:0 26px 60px rgba(0,0,0,.6);}
#fzPortal .fzrole .em{font-size:54px;margin-bottom:12px;}
#fzPortal .fzrole h3{font-size:28px;margin-bottom:10px;}
#fzPortal .fzrole p{color:#cdbfa6;font-size:14px;margin-bottom:16px;flex:1;}
#fzPortal .fzrole .go{display:inline-block;font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-size:14px;padding:13px 22px;border-radius:2px;}
#fzPortal .fzrole.al{border-color:rgba(143,224,160,.35);} #fzPortal .fzrole.al:hover{border-color:#8fe0a0;} #fzPortal .fzrole.al .go{background:#8fe0a0;color:#0f2a17;}
#fzPortal .fzrole.pr{border-color:rgba(122,178,255,.35);} #fzPortal .fzrole.pr:hover{border-color:#3aa0ff;} #fzPortal .fzrole.pr .go{background:#3aa0ff;color:#04121f;}
#fzPortal .fzrole .note{font-size:11px;color:#c9a05a;margin-top:8px;}
#fzPortal .fzfoot{padding:40px 24px;text-align:center;color:#a89b86;font-size:13px;border-top:1px solid rgba(255,225,180,.14);background:#060402;}
#fzPortal .fzfoot .fl{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin:10px 0;}
@media(max-width:880px){#fzPortal .fzrow,#fzPortal .fzrow.rev{grid-template-columns:1fr;gap:22px;}#fzPortal .fzrow.rev .fztxt{order:0;}}
@media(max-width:760px){#fzPortal .fzbg,#fzPortal .fzroles{grid-template-columns:1fr;}}
@media(prefers-reduced-motion:reduce){#fzPortal .fzslide,#fzPortal .fzscroll,#fzPortal [data-fz]{animation:none!important;transition:none!important;opacity:1!important;transform:none!important;}}
/* iframe do professor */
#fzProf{position:fixed;inset:0;z-index:2147483001;background:#080604;display:none;flex-direction:column;}
#fzProf .bar{display:flex;align-items:center;gap:10px;padding:9px 14px;background:#0e0a06;border-bottom:1px solid rgba(255,225,180,.14);color:#ffd98a;font-family:'Trebuchet MS',sans-serif;}
#fzProf .bar button{background:#ff9142;color:#231204;border:0;border-radius:3px;padding:9px 15px;font-weight:900;cursor:pointer;text-transform:uppercase;letter-spacing:.05em;font-size:12px;}
#fzProf iframe{flex:1;border:0;width:100%;}
</style>

<div id="fzPortal">
  <div class="fzgrain"></div>

  <header class="fzhero">
    <div class="fzslide s1"></div><div class="fzslide s2"></div><div class="fzslide s3"></div><div class="fzslide s4"></div>
    <div class="fzscrim"></div>
    <div class="fzw fzhc">
      <div class="fzeye">Jogo educativo · Histologia da pele</div>
      <h1 class="fzmega disp">FAZENDA <span class="h">37°C</span></h1>
      <p class="fztag">Uma carta, seis moradores e três ventos. Ajude Rosa a reabrir a Casa das Sementes, cuide da terra e descubra a histologia no caminho.</p>
      <div class="fzcta">
        <span class="fzbtn hot" onclick="window.__fzJogar()">▶ Jogar agora</span>
        <span class="fzbtn out" onclick="window.__fzProf()">Sou professor(a)</span>
      </div>
    </div>
    <div class="fzscroll">Role<i></i></div>
  </header>

  <section class="fzman">
    <div class="fzw">
      <h2 class="disp" data-fz>O corpo é a<br>sua <span class="h">fazenda</span>.</h2>
      <p data-fz>No <span style="color:#ff6a2a">calor</span> você sua e vasodilata; no <span style="color:#3aa0ff">frio</span> você treme e vasoconstringe. Cada decisão no jogo é um conceito real de termorregulação — e você <b>sente</b> na pele.</p>
    </div>
  </section>

  <section class="fzshow">
    <div class="fzw"><div class="fzrow" data-fz>
      <div class="fztxt">
        <div class="fzkick">A ciência, jogável</div>
        <h3 class="disp">A histologia<br>acontece na tela</h3>
        <p>Abra a <b>Visão da Pele</b>: um corte histológico animado mostra epiderme, derme e hipoderme, com glândulas, vasos dérmicos e termorreceptores reagindo em tempo real ao que o corpo está passando.</p>
      </div>
      <div class="fzmedia" style="background-image:var(--img-skin)"></div>
    </div></div>
  </section>

  <section class="fzshow" style="background:#0e0a06;">
    <div class="fzw"><div class="fzrow rev" data-fz>
      <div class="fztxt">
        <div class="fzkick h">Um mundo que reage</div>
        <h3 class="disp">Um vale.<br>Três caminhos.</h3>
        <p>Da fazenda à <span style="color:#3aa0ff">montanha nevada</span> e ao <span style="color:#ff6a2a">deserto árido</span> — cada ambiente empurra o corpo ao limite e força uma resposta fisiológica diferente. Sobreviver é entender a pele.</p>
      </div>
      <div class="fzmedia" style="background-image:var(--img-farm)"></div>
    </div></div>
  </section>

  <section class="fzbio">
    <div class="fzw">
      <div class="fzhead" data-fz><h2 class="disp">Atravesse os extremos</h2><p>Três biomas e a Visão da Pele. Explore, observe e continue jogando.</p></div>
      <div class="fzbg">
        <div class="fzbc" onclick="window.__fzJogar()" data-fz style="background-image:var(--img-mount)"><div class="g"></div><span class="pin cold">− Frio</span><div class="l"><div class="t disp">Montanha nevada</div><div class="s">Vasoconstrição · tremor · hipotermia</div></div></div>
        <div class="fzbc" onclick="window.__fzJogar()" data-fz style="background-image:var(--img-des)"><div class="g"></div><span class="pin hot">+ Calor</span><div class="l"><div class="t disp">Deserto árido</div><div class="s">Vasodilatação · sudorese · desidratação</div></div></div>
        <div class="fzbc" onclick="window.__fzJogar()" data-fz style="background-image:var(--img-farm)"><div class="g"></div><span class="pin neu">Base</span><div class="l"><div class="t disp">A fazenda</div><div class="s">Plante, colha e mantenha o equilíbrio</div></div></div>
        <div class="fzbc" onclick="window.__fzJogar()" data-fz style="background-image:var(--img-skin)"><div class="g"></div><span class="pin warm">Ciência</span><div class="l"><div class="t disp">Visão da Pele</div><div class="s">O corte histológico ao vivo</div></div></div>
      </div>
    </div>
  </section>

  <section class="fzstats">
    <div class="fzw"><div class="g">
      <div class="fzst" data-fz><b class="disp">43</b><span>missões histológicas</span></div>
      <div class="fzst" data-fz><b class="disp">3</b><span>biomas conectados</span></div>
      <div class="fzst" data-fz><b class="disp">2</b><span>níveis: Fund./Médio</span></div>
      <div class="fzst" data-fz><b class="disp">0</b><span>instalação</span></div>
    </div></div>
  </section>

  <section class="fzenter">
    <div class="fzw">
      <div class="fzhead" data-fz><h2 class="disp">Escolha o seu lado</h2><p>Como você vai usar a Fazenda 37 °C?</p></div>
      <div class="fzroles">
        <div class="fzrole al" onclick="window.__fzJogar()" data-fz>
          <span class="em">🧑‍🌾</span><h3 class="disp">Sou Aluno</h3>
          <p>Conheça Rosa, Lia, Tomás, Inês, Caio e Nico. Converse, cultive amizades e reabra a Casa das Sementes enquanto aprende sobre a pele.</p>
          <span class="go">▶ Jogar agora</span>
        </div>
        <div class="fzrole pr" onclick="window.__fzProf()" data-fz>
          <span class="em">👩‍🏫</span><h3 class="disp">Sou Professor</h3>
          <p>Consulte os acertos e erros da turma com o backend configurado. Para apresentar offline, use o relatório local do jogo.</p>
          <span class="go">Abrir painel →</span>
          <span class="note">requer internet</span>
        </div>
      </div>
    </div>
  </section>

  <div class="fzfoot">
    <div class="disp" style="font-size:18px;">FAZENDA 37<span style="color:#ff6a2a">°C</span></div>
    <div style="opacity:.8;margin-top:8px;">Trabalho de Histologia (Extensão) · Dev. Bernardo Oliveira</div>
  </div>
</div>

<div id="fzProf">
  <div class="bar"><button onclick="window.__fzProfClose()">← Voltar ao portal</button><span>👩‍🏫 Painel do Professor — requer internet</span></div>
  <iframe id="fzProfFrame" title="Painel do Professor"></iframe>
</div>

<script>
(function(){
  var portal=document.getElementById('fzPortal');
  var prof=document.getElementById('fzProf');
  var frame=document.getElementById('fzProfFrame');
  var profHtml=__PROF_HTML__;
  window.__fzJogar=function(){ portal.style.display='none'; prof.style.display='none'; try{window.scrollTo(0,0);}catch(e){} };
  window.__fzPortal=function(){ prof.style.display='none'; portal.style.display='block'; try{portal.scrollTo(0,0);}catch(e){} };
  window.__fzProf=function(){ if(!frame.getAttribute('srcdoc')) frame.setAttribute('srcdoc', profHtml); portal.style.display='none'; prof.style.display='flex'; };
  window.__fzProfClose=function(){ prof.style.display='none'; portal.style.display='block'; };
  portal.style.display='block';
  // reveals (com fallback — conteúdo nunca fica preso invisível)
  var items=[].slice.call(portal.querySelectorAll('[data-fz]'));
  var rev=function(el){ el.classList.add('in'); };
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ rev(e.target); io.unobserve(e.target); } }); }, {root:portal, threshold:.12});
    items.forEach(function(el){ io.observe(el); });
    var safety=function(){ items.forEach(function(el){ if(!el.classList.contains('in')){ var r=el.getBoundingClientRect(); if(r.top < (innerHeight||800)*1.15) rev(el); } }); };
    portal.addEventListener('scroll', safety, {passive:true});
    setTimeout(safety, 400); setTimeout(safety, 1600);
  } else { items.forEach(rev); }
})();
</script>
"""


if __name__ == "__main__":
    build()
