// Beats 02 (logo), 03 (storefront) and 11 (end card).

// ---- Beat 02: logo assembles from four shards, bloom on the music hit -------
window.SCENES["02"] = function (tl, b) {
  const s = "#s-02", t = (x) => b.start + x;
  tl.set([s + " .bloom", s + " .shards", s + " .shard", s + " .wordmark", s + " .kicker2", s + " .ring-lite"], { opacity: 0 }, b.start);
  const from = [{ x: -700, y: -420, rotation: -40 }, { x: 760, y: -380, rotation: 35 }, { x: -640, y: 460, rotation: 28 }, { x: 700, y: 520, rotation: -32 }];
  tl.set(s + " .shards", { opacity: 1 }, t(0.1));
  from.forEach((f, i) => {
    tl.fromTo(s + ` .shard:nth-child(${i + 1})`, Object.assign({ opacity: 0, scale: 1.6 }, f),
      { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0, duration: 1.1, ease: "expo.out" }, t(0.15 + i * 0.08));
  });
  // hit: bloom flash + ring expands
  tl.fromTo(s + " .bloom", { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.3, duration: 0.35, ease: "power4.out" }, t(1.15));
  tl.to(s + " .bloom", { opacity: 0.55, scale: 1, duration: 1.6, ease: "power2.out" }, t(1.5));
  tl.fromTo(s + " .ring-lite", { opacity: 0, scale: 0.2 }, { opacity: 0.6, scale: 1, duration: 1.4, ease: "expo.out" }, t(1.2));
  tl.fromTo(s + " .shards", { scale: 1 }, { scale: 1.08, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 }, t(1.15));
  // wordmark + kicker
  tl.fromTo(s + " .wordmark", { opacity: 0, letterSpacing: "0.3em", y: 30 }, { opacity: 1, letterSpacing: "-0.02em", y: 0, duration: 0.9, ease: "power3.out" }, t(1.7));
  tl.fromTo(s + " .kicker2", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.6, ease: "expo.out" }, t(2.4));
  // breathe: logo slow float until the beat ends
  tl.to(s + " .shards", { y: -12, duration: 2.2, yoyo: true, repeat: Math.ceil((b.dur - 3) / 2.2), ease: "sine.inOut" }, t(3));
};

// ---- Beat 03: storefront in a 3D device; JSON payload lifts off ---------------
// Narration cues (beat-03, 16.0 s): "showroom" 0.6 · "thirty-four products" 3.4 · "live search" 5.0 ·
// "real stock" 6.0 · "checks out" 8.2 · "does one thing" 10.0 · "single JSON payload" 12.0 · "single endpoint" 14.2
window.SCENES["03"] = function (tl, b) {
  const s = "#s-03", t = (x) => b.start + x;
  tl.set([s + " .col > *", s + " .stage", s + " .bracket", s + " .payload", s + " .floor", s + " .layer"], { opacity: 0 }, b.start);
  tl.set(s + " .device", { transformPerspective: 2400, rotationY: -16, rotationX: 5 }, b.start);
  tl.set(s + " .layer.l-product", { opacity: 1 }, b.start);

  tl.fromTo(s + " .floor", { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.9, ease: "expo.out" }, t(0.2));
  tl.fromTo(s + " .stage", { opacity: 0, x: -220, rotationY: -40 }, { opacity: 1, x: 0, rotationY: 0, duration: 1.1, ease: "power4.out" }, t(0.4));
  tl.fromTo(s + " .kicker", { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(0.7));
  tl.fromTo(s + " .big", { opacity: 0, y: 50, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.7)" }, t(3.2));
  tl.fromTo(s + " .tags", { opacity: 0 }, { opacity: 1, duration: 0.2 }, t(4.8));
  tl.fromTo(s + " .tags .tag", { opacity: 0, scale: 0.4, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "elastic.out(1.1, 0.5)", stagger: 0.55 }, t(4.9));
  // "real stock": bracket on the במלאי badge (product page coordinates inside the device: ~ (700,290) of 1920x1080 → scaled to 1060x700)
  // device slow drift while product shows
  tl.to(s + " .device", { rotationY: -8, y: -10, duration: 7, ease: "sine.inOut" }, t(0.6));
  // "checks out": cart video, then the checkout form
  tl.set(s + " .layer.l-cart", { opacity: 1 }, t(8.0));
  tl.set(s + " .layer.l-product", { opacity: 0 }, t(8.0));
  tl.set(s + " .layer.l-checkout", { opacity: 1 }, t(10.2));
  tl.set(s + " .layer.l-cart", { opacity: 0 }, t(10.2));
  tl.to(s + " .device", { rotationY: 6, rotationX: 2, scale: 1.04, duration: 2.5, ease: "power2.inOut" }, t(8.0));
  // "single JSON payload": card materializes over the form, then flies off right (its landing is beat 4 t=0)
  tl.fromTo(s + " .payload", { opacity: 0, scale: 0, rotation: -8 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: "elastic.out(1.2, 0.45)" }, t(11.8));
  tl.to(s + " .payload", { x: 1500, rotationY: 45, scale: 0.7, opacity: 0, duration: 0.9, ease: "power4.in" }, t(14.6));
  tl.to(s + " .device", { rotationY: 18, x: -40, duration: 0.6, ease: "power3.out" }, t(14.7)); // recoil
  tl.to(s + " .device", { rotationY: 4, x: 0, duration: 1.0, ease: "elastic.out(1, 0.5)" }, t(15.3));
};

// ---- Beat 11: end card, fades to black (only scene allowed to exit) ----------
window.SCENES["11"] = function (tl, b) {
  const s = "#s-11", t = (x) => b.start + x;
  tl.set([s + " .lockup", s + " .built", s + " .links span"], { opacity: 0 }, b.start);
  tl.fromTo(s + " .lockup", { opacity: 0, scale: 0.85, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 1.0, ease: "power3.out" }, t(0.3));
  tl.fromTo(s + " .built", { opacity: 0, letterSpacing: "0.2em" }, { opacity: 1, letterSpacing: "0", duration: 1.0, ease: "power2.out" }, t(2.2));
  tl.fromTo(s + " .links span", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.2 }, t(3.2));
  tl.to(s + " .fade", { opacity: 1, duration: 1.6, ease: "power2.in" }, b.start + b.dur - 1.8);
};
