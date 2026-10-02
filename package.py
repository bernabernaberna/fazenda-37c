"""
Fazenda 37 °C — empacotador para distribuição via NAVEGADOR (sem .exe)

Gera, dentro da pasta `release/`, dois formatos prontos para enviar:

  1) Fazenda37C-standalone.html
        UM único arquivo. Os áudios .ogg são embutidos como data-URI base64
        diretamente no HTML. A pessoa só dá duplo-clique e joga — não há
        pasta de áudio para "perder". É o formato mais à prova de erros para
        mandar por e-mail/WhatsApp/Drive.

  2) Fazenda37C-web.zip
        Pacote .zip com index.html + pasta audio/ + LEIA-ME-WEB.txt.
        Menor que o standalone, mas a pessoa precisa EXTRAIR o zip antes de
        abrir (duplo-clique dentro do zip não funciona).

Uso:
    python build.py      # (rode antes) gera o index.html a partir do template
    python package.py     # gera release/Fazenda37C-standalone.html + .zip

Pré-requisito: `index.html` já buildado (este script NÃO roda o build.py
automaticamente para você poder revisar o index.html antes de empacotar).
"""

from __future__ import annotations

import base64
import mimetypes
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "jogo.html"        # o JOGO (fonte do standalone). O portal do site é index.html.
PORTAL = ROOT / "index.html"      # portal/landing do site (Professor/Aluno)
PROFESSOR = ROOT / "professor.html"
AUDIO_DIR = ROOT / "audio"
RELEASE = ROOT / "release"

STANDALONE = RELEASE / "Fazenda37C-standalone.html"
ZIP_OUT = RELEASE / "Fazenda37C-web.zip"

# Referências de áudio no HTML têm a forma: audio/nome.ogg  (entre aspas)
AUDIO_REF = re.compile(r"audio/([A-Za-z0-9_\-]+\.ogg)")


def _fmt_size(num: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if num < 1024.0 or unit == "GB":
            return f"{num:.0f} {unit}" if unit == "B" else f"{num:.2f} {unit}"
        num /= 1024.0
    return f"{num:.2f} GB"


def load_audio_data_uris(required: set[str]) -> dict[str, str]:
    """Mapeia nome.ogg -> data:audio/ogg;base64,....  para cada arquivo presente."""
    uris: dict[str, str] = {}
    if not AUDIO_DIR.is_dir():
        return uris
    for f in sorted(AUDIO_DIR.glob("*.ogg")):
        if f.name not in required:
            continue
        mime = mimetypes.guess_type(f.name)[0] or "audio/ogg"
        b64 = base64.b64encode(f.read_bytes()).decode("ascii")
        uris[f.name] = f"data:{mime};base64,{b64}"
    return uris


def build_standalone(html: str, uris: dict[str, str]) -> tuple[str, int, int]:
    """Substitui cada audio/nome.ogg pelo respectivo data-URI. Retorna (html, embutidos, faltando)."""
    embedded = 0
    missing: set[str] = set()

    def repl(m: re.Match) -> str:
        nonlocal embedded
        name = m.group(1)
        if name in uris:
            embedded += 1
            return uris[name]
        missing.add(name)
        return m.group(0)  # mantém a referência original se o arquivo não existir

    new_html = AUDIO_REF.sub(repl, html)
    if missing:
        print(f"  ! AVISO: {len(missing)} áudio(s) referenciado(s) mas ausente(s): {', '.join(sorted(missing))}")
    return new_html, embedded, len(missing)


LEIA_ME_WEB = """\
FAZENDA 37 °C — versão para navegador
=====================================

COMO JOGAR
----------
1. EXTRAIA todo o conteúdo deste .zip para uma pasta (clique com o botão
   direito > "Extrair tudo..."). NÃO abra o jogo de dentro do zip.
2. Abra a pasta extraída e dê duplo-clique em "index.html".
3. O jogo abre no seu navegador padrão (Chrome, Edge ou Firefox). Pronto!

IMPORTANTE
----------
- Mantenha os arquivos do site juntos. O áudio atual é gerado pelo jogo;
  não precisa de pasta de sons nem de internet.
- O som só toca depois do primeiro clique/tecla (regra dos navegadores).
- O progresso é salvo automaticamente no próprio navegador.

DICA
----
Se preferir um único arquivo (sem pasta), use a versão
"Fazenda37C-standalone.html", que já contém o código do áudio — basta
dar duplo-clique nela.

Bom jogo!
"""


def build_zip(uris_present: list[str]) -> None:
    manual = RELEASE / "MANUAL.txt"
    with zipfile.ZipFile(ZIP_OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        # Site completo: portal (index.html) + jogo (jogo.html) + painel do professor
        if PORTAL.is_file():
            z.write(PORTAL, "Fazenda37C/index.html")
        z.write(INDEX, "Fazenda37C/jogo.html")
        if PROFESSOR.is_file():
            z.write(PROFESSOR, "Fazenda37C/professor.html")
        # ilustrações vetoriais originais (hero, corte da pele, termorregulação)
        art = ROOT / "site" / "art"
        if art.is_dir():
            for f in sorted(art.glob("*.svg")):
                z.write(f, f"Fazenda37C/site/art/{f.name}")
        # capturas reais do jogo (galeria de biomas)
        shots = ROOT / "site" / "shots"
        if shots.is_dir():
            for f in sorted(shots.glob("site_*.png")):
                z.write(f, f"Fazenda37C/site/shots/{f.name}")
        # Só distribui arquivos efetivamente referenciados. A versão com banco
        # procedural não inclui as gravações históricas sem licença confirmada.
        for name in sorted(uris_present):
            f = AUDIO_DIR / name
            if f.is_file():
                z.write(f, f"Fazenda37C/audio/{f.name}")
        for name in ["README.md", "LEIA-ME.txt", "CREDITOS-E-LICENCAS.md", "POLITICA-DE-PRIVACIDADE-LGPD.md", "REVISAO-QUESTOES-HISTOLOGIA.html"]:
            f = ROOT / name
            if f.is_file():
                z.write(f, f"Fazenda37C/{name}")
        for name in ["GUIA-APRESENTACAO.md", "CRITERIOS-ENTREGA.md", "HISTORIA-DO-VALE.md", "DIRECAO-ARTE.md", "ARTE-PERSONAGENS.md"]:
            f = ROOT / "analise" / name
            if f.is_file():
                z.write(f, f"Fazenda37C/apresentacao/{name}")
        z.writestr("Fazenda37C/LEIA-ME-WEB.txt", LEIA_ME_WEB)
        if manual.is_file():
            z.write(manual, "Fazenda37C/MANUAL.txt")


def main() -> int:
    if not INDEX.is_file():
        print("ERRO: jogo.html não encontrado. Rode `python build.py` primeiro.")
        return 1

    RELEASE.mkdir(exist_ok=True)
    html = INDEX.read_text(encoding="utf-8")

    required = set(AUDIO_REF.findall(html))
    uris = load_audio_data_uris(required)
    print(f"  {len(uris)} áudio(s) externos referenciados; banco original procedural incluído no jogo")

    # ---- 1) HTML standalone (áudio embutido) ----
    print("Gerando HTML standalone (jogo e código de áudio no mesmo arquivo)...")
    standalone_html, embedded, missing = build_standalone(html, uris)
    if missing:
        print("ERRO: há áudio referenciado sem arquivo. Corrija antes de distribuir.")
        return 1
    STANDALONE.write_text(standalone_html, encoding="utf-8")
    print(f"  -> {STANDALONE.name}  ({_fmt_size(STANDALONE.stat().st_size)}, {embedded} áudios embutidos)")

    # ---- 2) ZIP (html + pasta audio) ----
    print("Gerando ZIP (portal + jogo + documentação vigente)...")
    build_zip(list(uris.keys()))
    print(f"  -> {ZIP_OUT.name}  ({_fmt_size(ZIP_OUT.stat().st_size)})")

    print("\nPronto! Arquivos em:", RELEASE)
    print("  • Fazenda37C-standalone.html  — UM arquivo, duplo-clique e joga")
    print("  • Fazenda37C-web.zip          — extrair e abrir index.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
