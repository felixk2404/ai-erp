// Beat 10 — architecture diagram assembles in narration order.
// Narration: "Under the hood: fifteen n8n workflows. Six Airtable tables. Three agents,
// two Telegram bots, two Next.js apps on Vercel, a vector store, a PDF engine, and a
// test suite that runs before anything ships."
window.SCENES["10"] = function (tl, b) {
  const s = "#s-10";
  const t = (sec) => b.start + sec;
  const D = b.dur;

  // --- 15 node dots along the ring (deterministic positions) --------------------
  const ring = document.querySelector(s + " #ring");
  const dots = document.querySelector(s + " .node-dots");
  const len = ring.getTotalLength();
  for (let i = 0; i < 15; i++) {
    const p = ring.getPointAtLength((len * i) / 15);
    const d = document.createElement("div");
    d.className = "dot";
    d.style.left = p.x + "px";
    d.style.top = p.y + "px";
    dots.appendChild(d);
  }

  // --- static end state is the CSS; everything below animates INTO it ----------
  const hide = { opacity: 0 };
  tl.set([s + " .arch-left > *", s + " .node", s + " .edge", s + " .packet", s + " .dot"], hide, b.start);
  tl.set(s + " .edge", { strokeDasharray: 600, strokeDashoffset: 600 }, b.start);
  tl.set(s + " #ring", { strokeDasharray: 3000, strokeDashoffset: 3000 }, b.start);

  // Left column
  tl.fromTo(s + " .kicker", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(0.2));
  tl.fromTo(s + " .arch-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }, t(0.35));
  tl.fromTo(s + " .counters", { opacity: 0 }, { opacity: 1, duration: 0.3 }, t(0.9));

  // Ring + n8n (≈1.5s "fifteen n8n workflows")
  tl.to(s + " #ring", { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, t(1.2));
  tl.fromTo(s + " .ring-label", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.5)" }, t(1.5));
  tl.fromTo(s + " .dot", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(3)", stagger: 0.06 }, t(1.6));
  counter("workflows", 15, t(1.5));

  // Airtable lands (≈3.0s "Six Airtable tables") — exaggerated overshoot + glow flash
  tl.fromTo(s + " .airtable", { opacity: 0, scale: 0.5, y: 120, rotationX: 35, transformPerspective: 1600 },
    { opacity: 1, scale: 1.12, y: 0, rotationX: 0, duration: 0.55, ease: "power4.out" }, t(3.0));
  tl.to(s + " .airtable", { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.45)" }, t(3.55));
  tl.fromTo(s + " .airtable", { boxShadow: "0 0 0px rgba(90,209,255,0)" }, { boxShadow: "0 0 90px rgba(90,209,255,0.7)", duration: 0.25, ease: "power2.out" }, t(3.4));
  tl.to(s + " .airtable", { boxShadow: "0 0 48px rgba(90,209,255,0.45)", duration: 0.8, ease: "power2.out" }, t(3.65));
  tl.fromTo(s + " .chip", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out", stagger: 0.07 }, t(3.5));
  counter("tables", 6, t(3.2));

  // Agents counter (≈4.6s "Three agents") — pulse the OpenAI + bots region later; number now
  counter("agents", 3, t(4.6));

  // Bots (≈5.5s "two Telegram bots") — slide in from the right, edges draw
  land(s + " [data-node='bot-support']", { x: 200 }, t(5.4), "expo.out");
  land(s + " [data-node='bot-manager']", { x: 200 }, t(5.6), "expo.out");
  draw("bot-support", t(5.8)); draw("bot-manager", t(6.0));
  counter("bots", 2, t(5.6));

  // Apps (≈7.0s "two Next.js apps on Vercel") — drop from the top
  land(s + " [data-node='store']", { y: -160, rotation: -6 }, t(6.9), "back.out(1.6)");
  land(s + " [data-node='admin']", { y: -160, rotation: 6 }, t(7.1), "back.out(1.6)");
  draw("store", t(7.3)); draw("admin", t(7.5));
  counter("apps", 2, t(7.1));

  // Services rise from the bottom, in narration order
  land(s + " [data-node='supabase']", { y: 120 }, t(8.8), "power3.out"); draw("supabase", t(9.1));     // vector store
  land(s + " [data-node='gotenberg']", { y: 120 }, t(10.2), "power3.out"); draw("gotenberg", t(10.5)); // PDF engine
  land(s + " [data-node='drive']", { y: 120 }, t(10.5), "power3.out"); draw("drive", t(10.8));
  land(s + " [data-node='gmail']", { y: 120 }, t(10.9), "power3.out"); draw("gmail", t(11.2));
  land(s + " [data-node='openai']", { y: 120 }, t(11.2), "power3.out"); draw("openai", t(11.5));

  // Tests (≈12.5s "a test suite that runs before anything ships")
  counter("tests", 138, t(12.4), 1.2); // placeholder: replace with the real count on capture day

  // Packets orbit the ring from 8s to the end (finite repeats, seekable)
  const packets = document.querySelectorAll(s + " .packet");
  const cycle = 4;
  const reps = Math.max(0, Math.ceil((D - 8) / cycle) - 1);
  packets.forEach((p, i) => {
    tl.set(p, { opacity: 1 }, t(8 + i * 0.9));
    tl.to(p, {
      motionPath: { path: s + " #ring", align: s + " #ring", alignOrigin: [0.5, 0.5], start: i / 4, end: 1 + i / 4 },
      duration: cycle, ease: "none", repeat: reps,
    }, t(8 + i * 0.9));
  });

  // Breathe: the ring glow pulses slowly (finite)
  tl.to(s + " #ring", { stroke: "#3e5c76", duration: 2, yoyo: true, repeat: Math.ceil(D / 2), ease: "sine.inOut" }, b.start);

  // --- helpers -----------------------------------------------------------------
  function land(sel, from, at, ease) {
    tl.fromTo(sel, Object.assign({ opacity: 0, scale: 0.7 }, from), { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0, duration: 0.6, ease }, at);
    tl.fromTo(sel, { borderColor: "rgba(90,209,255,1)" }, { borderColor: "rgba(255,255,255,0.2)", duration: 1.2, ease: "power2.out" }, at + 0.3);
  }
  function draw(name, at) {
    tl.to(s + " [data-edge='" + name + "']", { opacity: 1, strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, at);
  }
  function counter(name, to, at, dur) {
    const el = document.querySelector(s + " [data-counter='" + name + "'] .num");
    const obj = { v: 0 };
    tl.to(obj, { v: to, duration: dur || 0.8, ease: "power2.out", snap: { v: 1 }, onUpdate: () => { el.textContent = Math.round(obj.v); } }, at);
    tl.fromTo(s + " [data-counter='" + name + "']", { x: -16, opacity: 0.2 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, at);
  }
};
