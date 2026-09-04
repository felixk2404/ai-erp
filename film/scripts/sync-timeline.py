#!/usr/bin/env python3
"""Single source of truth for timing.
Reads audio/narration/beat-NN.mp3 durations → writes scenes/beats.js and script/narration.json,
rewrites the narration/music <audio> tags and every <video data-beat data-cue-offset|data-cue>
data-start in index.html, sets the root data-duration, then regenerates cues (scripts/cues.py)."""
import json, re, subprocess, pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
TAIL = {1: 0.8, 2: 2.5, 3: 0.8, 4: 0.8, 5: 0.8, 6: 1.0, 7: 0.8, 8: 0.8, 9: 0.8, 10: 2.0, 11: 3.5}
NAMES = {1: "cold-open", 2: "logo", 3: "storefront", 4: "n8n-order", 5: "airtable", 6: "invoice", 7: "admin-orders", 8: "agents", 9: "morning", 10: "architecture", 11: "end"}
def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).decode().strip())

nar = json.load(open(root / "script/narration.json"))
beats, t = [], 0.0
for i in range(1, 12):
    d = dur(root / f"audio/narration/beat-{i:02d}.mp3")
    nar["beats"][i - 1]["duration"] = round(d, 2)
    beats.append({"id": f"{i:02d}", "name": NAMES[i], "dur": round(d + TAIL[i], 1), "narr": round(d, 2), "start": round(t, 2)})
    t += d + TAIL[i]
total = round(t, 1)
json.dump(nar, open(root / "script/narration.json", "w"), indent=2, ensure_ascii=False)

# cues first (words may have changed)
subprocess.run([sys.executable, str(root / "scripts/cues.py")], check=True, stdout=subprocess.DEVNULL)
cues = json.loads(re.search(r"window\.CUES = (\{.*\});", (root / "scenes/cues.js").read_text()).group(1))

# beats.js
lines = [f'  {{ id: "{b["id"]}", name: "{b["name"]}", dur: {b["dur"]}, narration: "audio/narration/beat-{b["id"]}.mp3" }},' for b in beats]
src = (root / "scenes/beats.js").read_text()
src = re.sub(r"window\.BEATS = \[.*?\];", "window.BEATS = [\n" + "\n".join(lines) + "\n];", src, flags=re.S)
(root / "scenes/beats.js").write_text(src)

# index.html
html = (root / "index.html").read_text()
html = re.sub(r'(<div id="root"[^>]*data-duration=")[0-9.]+(")', rf"\g<1>{total}\g<2>", html)
for b in beats:
    html = re.sub(rf'(<audio id="vo-{b["id"]}" data-start=")[0-9.]+(" data-duration=")[0-9.]+(")', rf'\g<1>{b["start"]}\g<2>{b["narr"]}\g<3>', html)
html = re.sub(r'(<audio id="music" data-start="0" data-duration=")[0-9.]+(")', rf"\g<1>{total}\g<2>", html)
def fix_video(m):
    tag = m.group(0)
    beat = re.search(r'data-beat="(\d\d)"', tag).group(1)
    b = next(x for x in beats if x["id"] == beat)
    off = 0.0
    mc = re.search(r'data-cue="([a-zA-Z]+)"', tag)
    if mc: off = cues.get(beat, {}).get(mc.group(1), 0.0)
    mo = re.search(r'data-cue-offset="(-?[0-9.]+)"', tag)
    if mo: off += float(mo.group(1))
    start = round(b["start"] + off, 2)
    return re.sub(r'data-start="[0-9.]+"', f'data-start="{start}"', tag)
html = re.sub(r"<video [^>]*data-beat=\"\d\d\"[^>]*>", fix_video, html)
(root / "index.html").write_text(html)
print("total", total, "| beats:", ", ".join(f'{b["id"]}@{b["start"]}' for b in beats))
