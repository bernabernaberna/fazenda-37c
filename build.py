"""
Fazenda 37 °C — build script

Lê os módulos JS em src/modules/*.js e injeta-os no index.html no ponto
marcado com `<!-- MODULES:BEGIN -->` ... `<!-- MODULES:END -->`.

Por que não usar `<script type="module">` directamente?
  O launcher.py do projeto carrega o jogo via `file:///` no Edge WebView.
  Edge aplica políticas same-origin estritas a `file://` e recusa-se a
  carregar módulos ES6 desse esquema. Para evitar HTTP server local
  (que adiciona uma porta TCP a precisar de ficar livre + complicações
  com antivírus), concatenamos os módulos no momento do build.

  Os ficheiros em src/modules/ devem ser válidos como código top-level
  (não usar `export`/`import` — declarar funções e atribuir a window/
  globais conforme já é o estilo do projeto). Cada ficheiro vira um
  bloco IIFE quando é incluído via tag «script» — mas como queremos
  acesso global rápido, concatenamos como um único script sem IIFE.

Uso:
    python build.py                  # produz index.html
    python build.py --watch          # recompila ao gravar src/**/*
    python build.py --clean          # remove blocos injetados e devolve
                                     # o índice ao estado do template

Saída:
    index.html (gerado)
    src/index.template.html (fonte) — alterações manuais devem ir aqui
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
TEMPLATE = SRC / "index.template.html"
MODULES_DIR = SRC / "modules"
OUTPUT = ROOT / "jogo.html"   # o jogo é servido em jogo.html; index.html é o portal do site

# Markers in the template that the build replaces with concatenated modules
MARKER_BEGIN = "<!-- MODULES:BEGIN -->"
MARKER_END = "<!-- MODULES:END -->"

# Order matters: utilities first, then systems that depend on them.
# Add new modules to this list as you extract them.
MODULE_ORDER = [
    "00-constants.js",        # CONSTANTS, T tile codes, audio key, etc.
    "10-thermal-ui.js",       # CSS thermal feedback overlay driver
    "11-thermal-feedback.js", # tendência e causas do balanço térmico real
    "12-learning-journey.js", # recompensas e objetivos renováveis por estação
    "13-activity-report.js",  # progresso local, prática e exportação opcional
    "14-story-world.js",      # personagens, capítulos, escolhas e pedidos do vale
    "15-story-ui.js",         # diálogos com retratos e diário da comunidade
    "16-story-integration.js", # ponte com ações, saves, mundo e rotina dos NPCs
    "17-world-map.js",        # minimapa, mapa completo e destino de orientação
    "18-object-queries.js",   # listas reutilizáveis por tipo para as consultas do mundo
    "19-rest-visual.js",      # transição de descanso; dados visuais fora dos saves
    "20-achievements.js",     # achievement system (example extraction)
    "21-tile-themes.js",      # Fatia B: repaginação dos tiles (registerTileDrawer)
    "22-biome-mountain.js",   # Fatia C: bioma montanha nevada (cena via FarmBiomes)
    "23-biome-desert.js",     # Fatia D: bioma deserto árido (cena via FarmBiomes)
    "24-farm-expansion.js",   # Fatia E: conteúdo/atividades das novas áreas da fazenda
    "26-terrain-edges.js",    # acabamento original das bordas do terreno
    "27-world-art.js",        # direção de arte: materiais, vegetação e arquitetura
    "28-character-art.js",    # personagens maiores, animação e retratos originais
    "29-world-depth.js",      # volumes, relevo, colisão compartilhada e Casa das Sementes
    "30-dynamic-lighting.js", # point lights from fires, sun god-rays, sparks
    "31-interior-art.js",    # paredes, marcenaria, tecidos e vidro dos interiores
    "32-animal-life.js",     # anatomia, comportamento e movimento dos animais
    "34-story-cinematics.js", # cenas do vale, falas animadas e galeria de reprises
    "35-valley-saga.js",      # mistério do vale, escolhas e arcos pessoais
    "36-farm-life.js",        # projetos, produção, receitas e pistas
    "37-valley-panels.js",    # caderno de Alex e gestão das atividades
    "38-skin-learning.js",    # tecidos da pele e investigações de Lia
    "40-grass-sway.js",       # animated grass blades + wind streaks
    "50-window-glow.js",      # warm halos from house/barn windows at night
    "60-histology-annotations.js", # realtime science labels over the player
    "70-synth-sfx.js",        # procedural UI/feedback sounds via Web Audio API
    "71-original-audio.js",   # banco sonoro original: 23 chaves sem gravações
    "80-teacher-mode.js",     # teacher telemetry: quiz performance to Supabase/local
    "90-ambient-synth.js",    # synthesized river water + night crickets ambience
    # add more modules here as the file is split further
]


def banner(s: str) -> str:
    line = "=" * len(s)
    return f"\n/* {line}\n   {s}\n   {line} */\n"


def read_modules() -> str:
    """Read every JS module in MODULE_ORDER and concatenate.

    Modules not present are silently skipped so the build keeps working
    while extraction is in progress.
    """
    chunks: list[str] = []
    chunks.append("/* ==========================================\n"
                  "   Fazenda 37 °C — concatenated module bundle\n"
                  "   AUTO-GENERATED by build.py — do not edit by\n"
                  "   hand. Edit src/modules/*.js instead.\n"
                  "   ========================================== */\n")
    found = 0
    for name in MODULE_ORDER:
        p = MODULES_DIR / name
        if not p.exists():
            continue
        chunks.append(banner(f"src/modules/{name}"))
        chunks.append(p.read_text(encoding="utf-8").rstrip() + "\n")
        found += 1
    if found == 0:
        chunks.append("/* (no modules yet — fully in-file build) */\n")
    return "".join(chunks)


def build() -> tuple[bool, str]:
    if not TEMPLATE.exists():
        return False, f"template not found: {TEMPLATE}"

    src = TEMPLATE.read_text(encoding="utf-8")

    if MARKER_BEGIN not in src or MARKER_END not in src:
        return False, (
            f"template missing markers {MARKER_BEGIN} ... {MARKER_END}; "
            "the build script needs both to know where to inject the bundle."
        )

    # Replace everything between the markers (inclusive of marker comments to
    # keep them in the output, so re-running build is idempotent).
    pattern = re.compile(
        re.escape(MARKER_BEGIN) + r".*?" + re.escape(MARKER_END),
        re.DOTALL,
    )
    bundle = read_modules()
    replacement = (
        f"{MARKER_BEGIN}\n<script>\n{bundle}</script>\n{MARKER_END}"
    )
    # Usa função de substituição: assim o re.sub NÃO interpreta escapes
    # (\n, \t, \\, \1, \g...) no código JS injetado. Antes, uma regex como
    # /[...\r\n...]/ no bundle era corrompida (os \n viravam quebras de linha
    # reais, partindo o literal). Com lambda, o texto é inserido literalmente.
    out = pattern.sub(lambda _m: replacement, src)

    # Atomic write so a crashed build doesn't leave a half-written index.
    tmp = OUTPUT.with_suffix(".html.tmp")
    tmp.write_text(out, encoding="utf-8")
    tmp.replace(OUTPUT)

    digest = hashlib.sha1(out.encode("utf-8")).hexdigest()[:10]
    return True, f"built {OUTPUT.name} ({len(out):,} bytes, sha1:{digest})"


def clean() -> tuple[bool, str]:
    if not TEMPLATE.exists():
        return False, f"template not found: {TEMPLATE}"
    src = TEMPLATE.read_text(encoding="utf-8")
    # Strip the bundle but keep markers so a future build can re-inject
    pattern = re.compile(
        re.escape(MARKER_BEGIN) + r".*?" + re.escape(MARKER_END),
        re.DOTALL,
    )
    out = pattern.sub(f"{MARKER_BEGIN}\n{MARKER_END}", src)
    OUTPUT.write_text(out, encoding="utf-8")
    return True, "cleaned index.html (modules removed)"


def watch() -> None:
    print("[watch] starting — Ctrl+C to stop")
    last_sig = None
    while True:
        files = [TEMPLATE] + sorted(MODULES_DIR.glob("*.js"))
        sig = tuple((p.name, p.stat().st_mtime) for p in files if p.exists())
        if sig != last_sig:
            ok, msg = build()
            ts = time.strftime("%H:%M:%S")
            print(f"[{ts}] {'OK' if ok else 'ERR'} {msg}")
            last_sig = sig
        time.sleep(0.6)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--watch", action="store_true", help="rebuild on file change")
    ap.add_argument("--clean", action="store_true", help="remove modules from index.html")
    args = ap.parse_args()

    if args.clean:
        ok, msg = clean()
        print(msg)
        return 0 if ok else 1
    if args.watch:
        try:
            watch()
        except KeyboardInterrupt:
            print("\n[watch] stopped")
        return 0

    ok, msg = build()
    print(msg)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
