"""Lokálny náhľad. Spusti: python3 serve.py  →  http://localhost:4321"""
import functools
import http.server
import os
import socketserver

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 4321

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("http://localhost:%d" % PORT)
    httpd.serve_forever()
