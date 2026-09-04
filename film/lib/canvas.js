// Canvas overlay helpers: a "camera" over a wide n8n capture, node lights, flow lines, tags.
// Used by beats 4, 6 and 8. Everything is added to the scene timeline (seekable).
window.Canvas = (function () {
  const W = 1920, H = 1080;

  // Build overlay DOM inside a .pan element for one capture. Returns handles.
  // pan: element sized to the capture (data-w/data-h), contains <img>, an <svg> and node hits.
  function build(pan, nodes, imgSrc) {
    const w = +pan.dataset.w, h = +pan.dataset.h;
    pan.style.width = w + "px"; pan.style.height = h + "px";
    const img = document.createElement("img"); img.src = imgSrc; img.alt = ""; pan.appendChild(img);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`); svg.setAttribute("width", w); svg.setAttribute("height", h); svg.classList.add("flows");
    pan.appendChild(svg);
    const hits = {};
    for (const [name, [x, y, bw, bh]] of Object.entries(nodes)) {
      const d = document.createElement("div"); d.className = "hit"; d.dataset.name = name;
      d.style.left = x - 6 + "px"; d.style.top = y - 6 + "px"; d.style.width = bw + 12 + "px"; d.style.height = bh + 12 + "px";
      const tag = document.createElement("div"); tag.className = "tag ntag"; d.appendChild(tag);
      pan.appendChild(d); hits[name] = d;
    }
    const vp = pan.parentElement; const vw = (vp && vp.offsetWidth) || W, vh = (vp && vp.offsetHeight) || H;
    return { pan, svg, hits, nodes, w, h, vw, vh };
  }

  // Camera: move/scale the pan so that box (x,y,w,h in capture px) is centered at `scale`.
  function cam(tl, c, box, scale, at, dur, ease) {
    const [x, y, w, h] = Array.isArray(box) ? box : c.nodes[box];
    const cx = x + w / 2, cy = y + h / 2;
    const VW = c.vw || W, VH = c.vh || H;
    let tx = VW / 2 - scale * cx, ty = VH / 2 - scale * cy;
    tx = Math.min(tx, 0); tx = Math.max(tx, VW - c.w * scale);
    ty = Math.min(ty, -120 * scale); ty = Math.max(ty, VH - c.h * scale);
    const vars = { x: tx, y: ty, scale, duration: dur == null ? 1.2 : dur, ease: ease || "power3.inOut" };
    if (dur === 0) tl.set(c.pan, vars, at); else tl.to(c.pan, vars, at);
  }
  // Center between two nodes at a scale.
  function camSpan(tl, c, a, b, scale, at, dur, ease) {
    const A = c.nodes[a], B = c.nodes[b];
    const x = Math.min(A[0], B[0]), y = Math.min(A[1], B[1]);
    const w = Math.max(A[0] + A[2], B[0] + B[2]) - x, h = Math.max(A[1] + A[3], B[1] + B[3]) - y;
    cam(tl, c, [x, y, w, h], scale, at, dur, ease);
  }

  // Light a node: glow + pop; optional tag text; color "cyan" | "amber".
  function light(tl, c, name, at, text, color, side) {
    const el = c.hits[name]; if (!el) return;
    // only one tag at a time per canvas: fade every other tag out
    for (const [n, h] of Object.entries(c.hits)) { if (n !== name) tl.to(h.querySelector(".ntag"), { opacity: 0, duration: 0.25 }, at); }
    const glow = color === "amber" ? "rgba(240,180,41,.7)" : "rgba(90,209,255,.75)";
    const stroke = color === "amber" ? "#f0b429" : "#5ad1ff";
    tl.fromTo(el, { boxShadow: `0 0 0 0px ${stroke}, 0 0 0px ${glow}`, scale: 1 },
      { boxShadow: `0 0 0 4px ${stroke}, 0 0 60px ${glow}`, scale: 1.16, duration: 0.45, ease: "back.out(3)" }, at);
    tl.to(el, { scale: 1.06, duration: 0.5, ease: "power2.out" }, at + 0.45);
    if (text) {
      const tag = el.querySelector(".ntag"); tag.textContent = text;
      if (color === "amber") tag.classList.add("amber");
      if (side === "right") tag.classList.add("side");
      tl.fromTo(tag, { opacity: 0, y: 18, scale: 0.7 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(2)" }, at + 0.15);
    }
  }
  // Dim a node back (keeps a faint ring so the path stays visible).
  function dim(tl, c, name, at) {
    const el = c.hits[name]; if (!el) return;
    tl.to(el, { boxShadow: "0 0 0 2px rgba(90,209,255,.35), 0 0 16px rgba(90,209,255,.25)", scale: 1, duration: 0.4, ease: "power2.out" }, at);
    tl.to(el.querySelector(".ntag"), { opacity: 0, duration: 0.3 }, at);
  }

  // Flow: draw a glowing line from node a to node b, then a packet travels it.
  function flow(tl, c, a, b, at, dur, color) {
    const A = c.nodes[a], B = c.nodes[b]; if (!A || !B) return;
    const x1 = A[0] + A[2], y1 = A[1] + A[3] / 2, x2 = B[0], y2 = B[1] + B[3] / 2;
    const dx = Math.max(40, (x2 - x1) / 2);
    const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d); p.setAttribute("class", "flow" + (color === "amber" ? " amber" : "")); c.svg.appendChild(p);
    const len = Math.hypot(x2 - x1, y2 - y1) * 1.3;
    tl.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 }, at);
    tl.to(p, { strokeDashoffset: 0, duration: dur || 0.5, ease: "power2.inOut" }, at);
    const pk = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pk.setAttribute("r", 10); pk.setAttribute("class", "pk" + (color === "amber" ? " amber" : "")); c.svg.appendChild(pk);
    tl.set(pk, { opacity: 0 }, 0);
    tl.set(pk, { opacity: 1 }, at);
    tl.to(pk, { motionPath: { path: p, align: p, alignOrigin: [0.5, 0.5] }, duration: (dur || 0.5) + 0.15, ease: "power1.inOut" }, at);
    tl.set(pk, { opacity: 0 }, at + (dur || 0.5) + 0.2);
  }

  // Chain: draw consecutive graph edges quickly (only real neighbours, never long jumps).
  function chain(tl, c, names, at, perEdge, color) {
    let t = at; const d = perEdge || 0.22;
    for (let i = 0; i < names.length - 1; i++) { flow(tl, c, names[i], names[i + 1], t, d, color); t += d * 0.85; }
    return t;
  }
  // Fade all drawn flows on a canvas (before the camera jumps somewhere else).
  function fadeFlows(tl, c, at, to) {
    tl.to(c.svg.querySelectorAll(".flow"), { opacity: to == null ? 0.18 : to, duration: 0.4 }, at);
  }
  return { build, cam, camSpan, light, dim, flow, chain, fadeFlows };
})();
