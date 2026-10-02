"""Servidor local de captura para verificacao visual do jogo.

    py tools/capsrv.py [porta]        (padrao 8766)

Serve a pasta do projeto e aceita POST /shot?name=X com um dataURL no corpo,
salvando em site/shots/X.png. Existe porque o screenshot da Browser pane falha
de forma intermitente — e bugs visuais reais (Visao da Pele achatada, abertura
sobrevoando a montanha) so aparecem OLHANDO a imagem.

No navegador:
    canvas.toDataURL('image/png') -> fetch('/shot?name=x', {method:'POST', body: url})
Depois use Read no PNG para ver o resultado.
"""
import base64, os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "site", "shots")
os.makedirs(SHOTS, exist_ok=True)

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def do_POST(self):
        p = urlparse(self.path)
        if p.path != "/shot":
            self.send_response(404); self.end_headers(); return
        name = parse_qs(p.query).get("name", ["shot"])[0]
        n = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(n).decode("utf-8", "ignore")
        if body.startswith("data:"):
            body = body.split(",", 1)[1]
        out = os.path.join(SHOTS, os.path.basename(name) + ".png")
        with open(out, "wb") as f:
            f.write(base64.b64decode(body))
        self.send_response(200); self.end_headers(); self.wfile.write(b"ok")
    def log_message(self, *a):
        pass

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    print("servindo", ROOT, "em http://127.0.0.1:%d" % port)
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
