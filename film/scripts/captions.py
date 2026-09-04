#!/usr/bin/env python3
"""Burned captions: group whisper words (captions/words-NN.json) into short lines and write them
as timed clips inside <div id="captions"> in index.html. Called by sync-timeline.py."""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src_beats = re.search(r"window\.BEATS = (\[.*?\]);", (root / "scenes/beats.js").read_text(), re.S).group(1)
beats = [{"id": m.group(1), "dur": float(m.group(2))} for m in re.finditer(r'id: "(\d\d)", name: "[^"]*", dur: ([0-9.]+)', src_beats)]
starts, t = {}, 0.0
for b in beats:
    starts[b["id"]] = t; t += b["dur"]
MAXW, MAXCH = 7, 42
FIX = [("air table","Airtable"),("Air table","Airtable"),("Gothenburg","Gotenberg"),("market shipped","mark it shipped"),
       ("Superbase's","Supabase's"),("superbase","Supabase"),("Versal","Vercel"),("versal","Vercel"),("Kranovich","Kreinovich"),
       ("12.21","12:21"),("lands an Airtable","lands in Airtable"),("Vercel","Vercel"),("ersal","ercel"),("ersaL","ercel"),("VersaL","Vercel"),("N8N","n8n"),("n-eight-n","n8n"),("N-eight-N","n8n"),("Next JS","Next.js"),("JSON","JSON")]
def fixtext(t):
    for a,b in FIX: t = t.replace(a,b)
    return t
lines = []
for b in beats:
    words = json.load(open(root / "captions" / f"words-{b['id']}.json"))
    cur = []
    def flush():
        if not cur: return
        text = fixtext(" ".join(w["text"] for w in cur))
        s = starts[b["id"]] + cur[0]["start"]; e = starts[b["id"]] + cur[-1]["end"]
        lines.append((round(s, 2), round(max(0.6, e - s + 0.25), 2), text)); cur.clear()
    for w in words:
        cur.append(w)
        txt = " ".join(x["text"] for x in cur)
        if len(cur) >= MAXW or len(txt) >= MAXCH or re.search(r"[.!?]$", w["text"]):
            flush()
    flush()
# avoid overlaps: a line ends when the next begins
for i in range(len(lines) - 1):
    s, d, txt = lines[i]; ns = lines[i + 1][0]
    if s + d > ns - 0.05: lines[i] = (s, round(ns - 0.05 - s, 2), txt)
html = "".join(f'\n        <div class="clip line" data-start="{s}" data-duration="{d}" data-track-index="20">{txt}</div>' for s, d, txt in lines)
src = (root / "index.html").read_text()
src = re.sub(r'<!-- captions:start -->.*?<!-- captions:end -->', f'<!-- captions:start -->{html}\n      <!-- captions:end -->', src, count=1, flags=re.S)
(root / "index.html").write_text(src)
print(f"captions: {len(lines)} lines")
