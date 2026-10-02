"""
Fazenda 37 °C — verificação pré-entrega (somente leitura)
==========================================================

Roda um conjunto de checagens estruturais no projeto SEM abrir navegador e SEM
rebuildar nada. Serve para pegar, em segundos, a classe de erro que já apareceu
neste projeto e que passa despercebida numa revisão visual.

    py verificar.py

Sai com código 1 se alguma checagem falhar (serve para automação).

O que NÃO faz: não substitui jogar o jogo. Bugs visuais (a Visão da Pele
achatada, a abertura sobrevoando a montanha) só aparecem olhando a tela.
"""

from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEMPLATE = ROOT / "src" / "index.template.html"
BUILT = ROOT / "jogo.html"
MODULES = ROOT / "src" / "modules"
AUDIO = ROOT / "audio"

falhas: list[str] = []
avisos: list[str] = []


def ok(msg: str) -> None:
    print(f"  \033[92mOK\033[0m   {msg}")


def erro(msg: str) -> None:
    falhas.append(msg)
    print(f"  \033[91mFALHA\033[0m {msg}")


def aviso(msg: str) -> None:
    avisos.append(msg)
    print(f"  \033[93mAVISO\033[0m {msg}")


def secao(t: str) -> None:
    print(f"\n\033[1m{t}\033[0m")


# ---------------------------------------------------------------- ids duplicados
def _sem_comentarios(html: str) -> str:
    """Remove comentários antes de procurar ids. Sem isto o checker acusa
    duplicata quando um comentário CSS/JS apenas MENCIONA `<aside id="x">` —
    falso positivo que aconteceu na primeira execução."""
    html = re.sub(r"<!--.*?-->", "", html, flags=re.S)   # comentário HTML
    html = re.sub(r"/\*.*?\*/", "", html, flags=re.S)    # comentário CSS/JS em bloco
    html = re.sub(r"^\s*//.*$", "", html, flags=re.M)    # comentário JS de linha
    return html


def checar_ids_duplicados(html: str, nome: str) -> None:
    """IDs repetidos num HTML de 14 mil linhas quebram getElementById de forma
    silenciosa — o JS pega o primeiro e o segundo vira elemento morto."""
    ids = re.findall(r'<[a-zA-Z][^>]*?\bid="([^"]+)"', _sem_comentarios(html))
    dup = [i for i, n in Counter(ids).items() if n > 1]
    if dup:
        erro(f"{nome}: {len(dup)} id(s) duplicado(s): {', '.join(sorted(dup)[:8])}")
    else:
        ok(f"{nome}: nenhum id duplicado ({len(ids)} ids)")


# ------------------------------------------------------------- save / restore
def checar_save_restore(js: str) -> None:
    """ctx.save() sem restore() correspondente desalinha TODOS os frames
    seguintes — o sintoma aparece longe da causa."""
    saves = len(re.findall(r"\bctx\.save\(\)", js))
    restores = len(re.findall(r"\bctx\.restore\(\)", js))
    if saves != restores:
        erro(f"ctx.save() x ctx.restore() desbalanceados: {saves} save, {restores} restore")
    else:
        ok(f"ctx.save()/restore() balanceados ({saves} pares)")


# ------------------------------------------------------------------ áudio
def checar_audio(html: str) -> None:
    refs = set(re.findall(r"audio/([A-Za-z0-9_\-]+\.ogg)", html))
    if not refs:
        if "FarmOriginalAudio.createSound" in html and (MODULES / "71-original-audio.js").is_file():
            ok("áudio original procedural, sem referência de gravação externa")
        else:
            aviso("nenhuma referência de áudio encontrada")
        return
    faltando = sorted(r for r in refs if not (AUDIO / r).is_file())
    if faltando:
        erro(f"{len(faltando)} áudio(s) referenciado(s) e ausente(s): {', '.join(faltando[:5])}")
    else:
        ok(f"{len(refs)} referências de áudio, todas presentes")


# ----------------------------------------------------------------- módulos
def checar_modulos() -> None:
    build = (ROOT / "build.py").read_text(encoding="utf-8")
    listados = re.findall(r'"([0-9]{2}-[^"]+\.js)"', build)
    presentes = {p.name for p in MODULES.glob("*.js")}
    ausentes = [m for m in listados if m not in presentes]
    orfaos = sorted(presentes - set(listados))
    if ausentes:
        aviso(f"{len(ausentes)} módulo(s) na ordem do build mas inexistente(s): {', '.join(ausentes)}")
    if orfaos:
        erro(f"{len(orfaos)} módulo(s) existe(m) mas NÃO entram no build: {', '.join(orfaos)}")
    if not ausentes and not orfaos:
        ok(f"{len(listados)} módulos listados e presentes")


# --------------------------------------------------------------- build atual
def checar_build_atualizado() -> None:
    """Se o template for mais novo que o jogo.html, alguém esqueceu de buildar —
    e o que seria distribuído é a versão anterior."""
    if not BUILT.is_file():
        erro("jogo.html não existe — rode `py build.py`")
        return
    fontes = [TEMPLATE] + sorted(MODULES.glob("*.js"))
    mais_nova = max(f.stat().st_mtime for f in fontes)
    if mais_nova > BUILT.stat().st_mtime + 1:
        erro("jogo.html está DESATUALIZADO em relação a src/ — rode `py build.py`")
    else:
        ok("jogo.html mais novo que os fontes")


# ---------------------------------------------------------------- release
def checar_release() -> None:
    rel = ROOT / "release"
    if not rel.is_dir():
        aviso("pasta release/ não existe")
        return
    if not BUILT.is_file():
        return
    velhos = [
        p.name
        for p in rel.glob("Fazenda37C*.*")
        if p.stat().st_mtime < BUILT.stat().st_mtime - 1
    ]
    if velhos:
        aviso(f"release desatualizado ({', '.join(velhos)}) — rode package.py")
    else:
        ok("pacotes de release mais novos que o jogo.html")


# ------------------------------------------------------------------ backend
def checar_backend_seguro() -> None:
    """Regressão que já aconteceu: um guia antigo liberava SELECT para 'anon',
    o que vazaria as respostas de toda a turma."""
    suspeitos = []
    for p in list(ROOT.glob("*.md")) + list(ROOT.glob("*.txt")) + list((ROOT / "supabase").glob("*.sql")):
        txt = p.read_text(encoding="utf-8", errors="ignore").lower()
        for m in re.finditer(r"for\s+select[^;]{0,120}?to\s+anon", txt, re.S):
            # So acusa SQL DE VERDADE. Sem isto, um documento que apenas
            # DESCREVE o padrao perigoso (inclusive este verificador sendo
            # explicado) era acusado. Falso positivo treina a pessoa a ignorar
            # o alerta, que e o pior resultado possivel para um verificador.
            if "create policy" not in txt[max(0, m.start() - 240) : m.start()]:
                continue
            linha = txt[: m.start()].count("\n") + 1
            suspeitos.append(f"{p.name}:{linha}")
    if suspeitos:
        erro(f"policy de SELECT para 'anon' encontrada em: {', '.join(suspeitos)}")
    else:
        ok("nenhuma policy de leitura para 'anon' na documentação")


def main() -> int:
    print("\033[1mFazenda 37 °C — verificação pré-entrega\033[0m")
    if not TEMPLATE.is_file():
        print("ERRO: src/index.template.html não encontrado.")
        return 1

    tpl = TEMPLATE.read_text(encoding="utf-8")

    secao("Estrutura do HTML")
    checar_ids_duplicados(tpl, "template")

    secao("Render")
    checar_save_restore(tpl)

    secao("Assets")
    checar_audio(tpl)

    secao("Build")
    checar_modulos()
    checar_build_atualizado()
    checar_release()

    secao("Backend")
    checar_backend_seguro()

    print()
    if falhas:
        print(f"\033[91m{len(falhas)} falha(s)\033[0m, {len(avisos)} aviso(s).")
        return 1
    print(f"\033[92mTudo certo\033[0m ({len(avisos)} aviso(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
