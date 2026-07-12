#!/usr/bin/env python3
"""Dev server for the site at the repo root (avoids http.server CLI's os.getcwd call)."""
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


print("Serving repo root at http://127.0.0.1:5173", flush=True)
ThreadingHTTPServer(("127.0.0.1", 5173), Handler).serve_forever()
