// Beats 05 (Airtable), 06 (invoice pipeline), 07 (admin orders), 09 (morning).
(function () {
  const Q = (id) => { const c = window.CUES && window.CUES[id] ? window.CUES[id] : {}; return (k, d) => (c[k] != null ? c[k] : d); };

  // ---- Beat 05: six real tables rise on their names; IDs link them -------------
  window.SCENES["05"] = function (tl, b) {
    const s = "#s-05", t = (x) => b.start + x, q = Q("05"), HERO = window.HERO;
    const cards = ["orders", "invoices", "customers", "products", "leads", "tasks"];
    tl.set([s + " .head > *", s + " .tcard", s + " .links path", s + " .idchip", s + " .note"], { opacity: 0 }, b.start);
    tl.fromTo(s + " .head .kicker", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(0.3));
    tl.fromTo(s + " .head .title", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, t(q("lands", 0.8)));
    // "Six tables": the grid tilts in as one plane, then each card lands on its name
    tl.set(s + " .grid", { transformPerspective: 2600, rotationX: 14, rotationY: -8 }, b.start);
    tl.to(s + " .grid", { rotationX: 6, rotationY: -3, duration: 6, ease: "sine.inOut" }, t(2));
    cards.forEach((name, i) => {
      const at = t(q(name, 3.8 + i * 0.6));
      const from = [{ y: 160, rotationX: 40 }, { x: 200, rotationY: -35 }, { y: -160, rotationX: -40 }, { x: -220, rotationY: 35 }, { y: 180, scale: 0.6 }, { scale: 0.4, rotation: -8 }][i];
      tl.fromTo(s + ` .tcard[data-t='${name}']`, Object.assign({ opacity: 0 }, from), { opacity: 1, x: 0, y: 0, rotationX: 0, rotationY: 0, rotation: 0, scale: 1, duration: 0.7, ease: "back.out(1.9)" }, at);
      tl.fromTo(s + ` .tcard[data-t='${name}'] .chip`, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(3)" }, at + 0.25);
    });
    // "Every status is a plain word": rings around the status cells (rowring), "Every relation is an ID": flashes + links
    tl.fromTo(s + " .tcard .rowring", { opacity: 0, scaleX: 0.6 }, { opacity: 1, scaleX: 1, duration: 0.4, ease: "power3.out", stagger: 0.12 }, t(q("status", 7.8)));
    tl.to(s + " .tcard .rowring", { opacity: 0, duration: 0.3 }, t(q("relation", 10.2)));
    ["orders", "invoices", "customers", "tasks"].forEach((name, i) => {
      tl.fromTo(s + ` .tcard[data-t='${name}'] .rowflash`, { opacity: 0 }, { opacity: 1, duration: 0.12, yoyo: true, repeat: 1 }, t(q("relation", 10.2) + 0.3 + i * 0.35));
    });
    tl.set(s + " .links path", { strokeDasharray: 1400, strokeDashoffset: 1400, opacity: 1 }, t(q("relation", 10.2)));
    tl.to(s + " .links path", { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.25 }, t(q("relation", 10.2) + 0.4));
    tl.fromTo(s + " .idchip", { opacity: 0, scale: 0.5, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(2.5)", stagger: 0.25 }, t(q("relation", 10.2) + 0.9));
    // "boring on purpose"
    tl.fromTo(s + " .note", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, t(q("boring", 13.2)));
    // "Fifteen workflows read and write these tables": a ripple across the cards, twice
    tl.to(s + " .tcard .device", { boxShadow: "0 0 0 4px #5ad1ff, 0 0 70px rgba(90,209,255,.6)", duration: 0.25, yoyo: true, repeat: 1, stagger: { each: 0.12, repeat: 1, repeatDelay: 0.9 } }, t(q("fifteen", 15.0)));
  };

  // ---- Beat 06: WF1 validates, WF8 renders the PDF, the loop closes ------------
  window.SCENES["06"] = function (tl, b) {
    const s = "#s-06", t = (x) => b.start + x, q = Q("06"), C = window.Canvas, N = window.NODES, HERO = window.HERO;
    const c1 = C.build(document.querySelector(s + " .pan-1"), N.wf1, "captures/n8n-wf1-canvas.png");
    const c8 = C.build(document.querySelector(s + " .pan-8"), N.wf8, "captures/n8n-wf8-canvas.png");
    tl.set([s + " .vp-8", s + " .docs", s + " .doc", s + " .trk", s + " .trk-br", s + " .phone", s + " .doclabel", s + " .wfname > *"], { opacity: 0 }, b.start);
    C.cam(tl, c1, "Airtable Trigger", 1.5, b.start, 0);
    tl.fromTo(s + " .wfname .kicker", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(0.3));
    tl.fromTo(s + " .wfname .t1", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, t(0.5));
    // "wakes up workflow one" → trigger lights, chain to Compute (VAT)
    C.light(tl, c1, "Airtable Trigger", t(q("wakes", 1.3)), `Invoices · ${HERO.invoiceNumber}`);
    const chain1 = ["Is New", "Loop Over Items", "Find Customer", "Is Valid", "Numbered Invoices", "Aggregate", "Compute"];
    let prev = "Airtable Trigger";
    chain1.forEach((n, i) => { const at = t(q("wakes", 1.3) + 0.5 + i * 0.32); C.flow(tl, c1, prev, n, at, 0.3); prev = n; });
    C.cam(tl, c1, "Compute", 1.5, t(q("vat", 4.6) - 0.6, ), 0.9, "power2.inOut");
    C.light(tl, c1, "Compute", t(q("vat", 4.6)), "VAT 18% · 295.76 + 53.24 = 349.00");
    C.flow(tl, c1, "Compute", "Mark Validated", t(q("vat", 4.6) + 0.8), 0.3);
    C.light(tl, c1, "Mark Validated", t(q("vat", 4.6) + 1.1), "status → validated", null, "right");
    // "Workflow eight then renders" → zoom-through to WF8
    const T8 = t(q("wf8", 6.9));
    tl.to(s + " .vp-1", { scale: 2.2, opacity: 0, filter: "blur(10px)", duration: 0.45, ease: "power3.in" }, T8);
    tl.fromTo(s + " .vp-8", { scale: 0.6, opacity: 0, filter: "blur(10px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }, T8 + 0.2);
    tl.to(s + " .wfname .t1", { opacity: 0, y: -16, duration: 0.3 }, T8);
    tl.fromTo(s + " .wfname .t8", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, T8 + 0.4);
    C.cam(tl, c8, "Claim Invoice", 1.45, b.start, 0);
    C.light(tl, c8, "Validated Invoices", T8 + 0.6, "validated → claim", null, "right");
    C.flow(tl, c8, "Validated Invoices", "Claim Invoice", T8 + 0.9, 0.3);
    C.flow(tl, c8, "Claim Invoice", "Customer", T8 + 1.2, 0.3);
    C.flow(tl, c8, "Customer", "Build HTML", T8 + 1.5, 0.3);
    C.cam(tl, c8, "Build HTML", 1.5, t(q("html", 11.0)) - 0.5, 0.8, "power2.inOut");
    C.light(tl, c8, "Build HTML", t(q("html", 11.0)), "Hebrew · RTL · HTML");
    C.flow(tl, c8, "Build HTML", "HTML File", t(q("html", 11.0)) + 0.5, 0.25);
    C.flow(tl, c8, "HTML File", "Gotenberg PDF", t(q("gotenberg", 11.9)) - 0.1, 0.3);
    C.cam(tl, c8, "Gotenberg PDF", 1.55, t(q("gotenberg", 11.9)) - 0.3, 0.8, "power2.inOut");
    C.light(tl, c8, "Gotenberg PDF", t(q("gotenberg", 11.9)) + 0.2, "HTML → PDF · container");
    C.flow(tl, c8, "Gotenberg PDF", "Upload to Drive", t(q("drive", 14.7)) - 0.4, 0.3);
    C.cam(tl, c8, "Upload to Drive", 1.5, t(q("drive", 14.7)) - 0.5, 0.8, "power2.inOut");
    C.light(tl, c8, "Upload to Drive", t(q("drive", 14.7)), "Google Drive");
    C.flow(tl, c8, "Upload to Drive", "Mark Generated", t(q("drive", 14.7)) + 0.5, 0.25);
    C.flow(tl, c8, "Mark Generated", "Share Public", t(q("drive", 14.7)) + 0.8, 0.25);
    C.light(tl, c8, "Share Public", t(q("drive", 14.7)) + 1.0, "public link", null, "right");
    // "The customer gets an email with a tracking link" → the document folds out, tracking page, phone
    const TD = t(q("email", 16.8));
    tl.to(s + " .vp-8", { opacity: 0.18, filter: "blur(6px)", scale: 1.04, duration: 0.6, ease: "power2.inOut" }, TD);
    tl.set(s + " .docs", { opacity: 1 }, TD);
    tl.fromTo(s + " .doc", { opacity: 0, clipPath: "inset(0 0 100% 0)", rotationX: -30, transformPerspective: 1800 }, { opacity: 1, clipPath: "inset(0 0 0% 0)", rotationX: 0, duration: 0.9, ease: "power3.out" }, TD + 0.1);
    tl.fromTo(s + " .doc .fold", { y: -700 }, { y: 700, duration: 0.9, ease: "power2.inOut" }, TD + 0.1);
    tl.fromTo(s + " .doclabel", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, TD + 0.9);
    tl.fromTo(s + " .trk", { opacity: 0, x: 160, rotationY: -25, transformPerspective: 2000 }, { opacity: 1, x: 0, rotationY: 0, duration: 0.8, ease: "power4.out" }, t(q("tracking", 17.8)));
    tl.fromTo(s + " .trk-br", { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out" }, t(q("orderPage", 20.3)));
    tl.to(s + " .trk-br", { boxShadow: "0 0 60px rgba(90,209,255,.9)", duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, t(q("orderPage", 20.3)) + 0.4);
    // "I get a Telegram. That's the message you saw." → the phone from the cold open returns
    tl.to(s + " .trk", { x: -420, scale: 0.85, opacity: 0.6, duration: 0.7, ease: "power3.inOut" }, t(q("telegram", 21.3)));
    tl.to(s + " .trk-br", { opacity: 0, duration: 0.3 }, t(q("telegram", 21.3)));
    tl.fromTo(s + " .phone", { opacity: 0, y: 200, scale: 1.2 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power4.out" }, t(q("telegram", 21.3)) + 0.1);
    tl.to(s + " .phone", { scale: 1.06, duration: 1.4, ease: "sine.inOut" }, t(q("saw", 23.5)));
  };

  // ---- Beat 07: admin orders, mark shipped, task closes, stock LEDs -------------
  window.SCENES["07"] = function (tl, b) {
    const s = "#s-07", t = (x) => b.start + x, q = Q("07");
    tl.set([s + " .br", s + " .side", s + " .layer.l-video", s + " .layer.l-stock"], { opacity: 0 }, b.start);
    tl.set(s + " .device", { transformPerspective: 2600, rotationY: 12, rotationX: 4 }, b.start);
    tl.fromTo(s + " .stage", { opacity: 0, x: 200, scale: 0.94 }, { opacity: 1, x: 0, scale: 1, duration: 1.0, ease: "power4.out" }, t(0.2));
    tl.to(s + " .device", { rotationY: 4, rotationX: 2, duration: 5, ease: "sine.inOut" }, t(0.5));
    // "already waiting for me": bracket on the brief line
    tl.fromTo(s + " .br.brief", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out" }, t(q("waiting", 2.6)));
    // "flags anything unshipped": amber bracket on the attention panel
    tl.to(s + " .br.brief", { opacity: 0, duration: 0.3 }, t(q("flags", 4.3)));
    tl.fromTo(s + " .br.attn", { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out" }, t(q("flags", 4.3)));
    // "I open the order, mark it shipped": the recording (status change happens inside it)
    const TV = t(q("open", 7.5));
    tl.to(s + " .br.attn", { opacity: 0, duration: 0.3 }, TV);
    tl.set(s + " .layer.l-video", { opacity: 1 }, TV);
    tl.set(s + " .redact", { opacity: 1 }, TV);
    tl.set(s + " .layer.l-attn", { opacity: 0 }, TV);
    tl.fromTo(s + " .device", { rotationY: 4 }, { rotationY: -6, scale: 1.03, duration: 1.2, ease: "power2.inOut" }, TV);
    tl.fromTo(s + " .br.status", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power4.out" }, t(q("shipped", 9.0)));
    // "the task closes itself": the tasks page slides in bottom-left, done row bracketed
    tl.to(s + " .br.status", { opacity: 0, duration: 0.3 }, t(q("closes", 10.4)));
    tl.fromTo(s + " .side.tasks", { opacity: 0, x: -300, rotationY: 30, transformPerspective: 2000 }, { opacity: 1, x: 0, rotationY: 0, duration: 0.8, ease: "power4.out" }, t(q("closes", 10.4)));
    tl.fromTo(s + " .side.tasks .br", { opacity: 0, scaleX: 0.3 }, { opacity: 1, scaleX: 1, duration: 0.45, ease: "power3.out" }, t(q("closes", 10.4)) + 0.6);
    // "Stock is live ... warning light": products page with LEDs
    tl.to(s + " .side.tasks", { opacity: 0, x: -200, duration: 0.4, ease: "power2.in" }, t(q("stock", 12.0)));
    tl.set(s + " .layer.l-stock", { opacity: 1 }, t(q("stock", 12.0)) + 0.2);
    tl.set(s + " .layer.l-video", { opacity: 0 }, t(q("stock", 12.0)) + 0.2);
    tl.set(s + " .redact", { opacity: 0 }, t(q("stock", 12.0)) + 0.2);
    tl.fromTo(s + " .device", { rotationY: -6, scale: 1.03 }, { rotationY: 6, scale: 1, duration: 1.0, ease: "power2.inOut" }, t(q("stock", 12.0)));
    tl.fromTo(s + " .br.led", { opacity: 0, scale: 2 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out" }, t(q("warning", 14.0)));
    tl.to(s + " .br.led", { boxShadow: "0 0 60px rgba(240,180,41,.9)", duration: 0.45, yoyo: true, repeat: 3, ease: "sine.inOut" }, t(q("warning", 14.0)) + 0.4);
  };

  // ---- Beat 09: the morning brief writes itself, live feed, ⌘K ------------------
  window.SCENES["09"] = function (tl, b) {
    const s = "#s-09", t = (x) => b.start + x, q = Q("09");
    tl.set([s + " .feed", s + " .head > *"], { opacity: 0 }, b.start);
    tl.set(s + " .device", { transformPerspective: 2600, rotationY: -10, rotationX: 5 }, b.start);
    tl.fromTo(s + " .stage", { opacity: 0, y: 120, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "power4.out" }, t(0.2));
    tl.to(s + " .device", { rotationY: 6, rotationX: 2, duration: 8, ease: "sine.inOut" }, t(0.4));
    tl.fromTo(s + " .head .kicker", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(q("brief", 1.7)));
    tl.fromTo(s + " .head .tag", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2.5)", stagger: 0.3 }, t(q("revenue", 4.3)));
    // "a feed of every workflow run": the live feed card slides up over the dashboard
    tl.fromTo(s + " .feed", { opacity: 0, y: 160, rotationX: 30, transformPerspective: 2000 }, { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: "power4.out" }, t(q("feed", 6.7)));
    // "a chat with the manager agent one keystroke away": ⌘K recording takes over
    const TK = t(q("chat", 8.9));
    tl.to(s + " .feed", { opacity: 0, y: 80, duration: 0.4, ease: "power2.in" }, TK);
    tl.set(s + " .l-cmdk", { opacity: 1 }, TK + 0.1);
    tl.set(s + " .l-dash", { opacity: 0 }, TK + 0.1);
    tl.to(s + " .device", { rotationY: 0, rotationX: 0, scale: 1.08, y: -20, duration: 1.2, ease: "power3.inOut" }, TK);
  };
})();
