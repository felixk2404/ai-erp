// Beat 04 — the order travels WF13 → WF10 on the real n8n canvases, then the execution proof.
// Cue times below are seconds into beat-04.mp3 (40.7 s). Refined from the word-level transcript
// in captions/words-04.json when present; otherwise the estimates here.
window.SCENES["04"] = function (tl, b) {
  const s = "#s-04", t = (x) => b.start + x;
  const C = window.Canvas, N = window.NODES, HERO = window.HERO;
  const cue = window.CUES && window.CUES["04"] ? window.CUES["04"] : {};
  const q = (k, d) => (cue[k] != null ? cue[k] : d);

  const c13 = C.build(document.querySelector(s + " .pan-13"), N.wf13, "captures/n8n-wf13-canvas.png");
  const c10 = C.build(document.querySelector(s + " .pan-10"), N.wf10, "captures/n8n-wf10-canvas.png");

  // initial state: WF13 visible, WF10 + execution hidden
  tl.set(s + " .vp-10", { opacity: 0 }, b.start);
  tl.set(s + " .vp-exec", { opacity: 0 }, b.start);
  tl.set([s + " .wfname > *", s + " .payload4", s + " .proof"], { opacity: 0 }, b.start);
  C.cam(tl, c13, "Webhook", 2.4, b.start, 0);

  // 0.0 the payload lands on the Webhook node (continuity from beat 3)
  tl.fromTo(s + " .payload4", { opacity: 0, x: 900, scale: 0.6, rotationY: -40 }, { opacity: 1, x: 0, scale: 1, rotationY: 0, duration: 0.55, ease: "power4.out" }, t(0.05));
  tl.to(s + " .payload4", { scale: 0.2, opacity: 0, duration: 0.35, ease: "power3.in" }, t(0.9));
  C.light(tl, c13, "Webhook", t(1.1), "POST /webhook/erp");
  tl.fromTo(s + " .wfname .kicker", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(0.3));
  tl.fromTo(s + " .wfname .t13", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, t(0.5));

  // "Workflow thirteen is the front door" ≈ 2.5 → Route lights, camera widens over all branches
  C.flow(tl, c13, "Webhook", "Route", t(q("route", 2.6)), 0.5);
  C.dim(tl, c13, "Webhook", t(q("route", 2.6) + 0.3));
  C.light(tl, c13, "Route", t(q("route", 2.6) + 0.4), "front door · x-erp-secret", null, "right");
  C.cam(tl, c13, [3459, 148, 900, 840], 1.15, t(q("everyAction", 5.2)), 1.6, "power2.inOut");
  // "routed by name": the five branches fan out
  const branches = [["Support Input", "support"], ["Update Record", "update"], ["Payload", "create"], ["Chat Input", "chat"], ["Order Input", "order"], ["Find Order", "order_status"]];
  branches.forEach(([n, label], i) => {
    const at = t(q("routedByName", 8.6) + i * 0.22);
    C.flow(tl, c13, "Route", n, at, 0.45);
    C.light(tl, c13, n, at + 0.35, label, null, "right");
  });
  // "Order hands off to workflow ten" ≈ 11.2 → zoom onto the order branch, Place Order lit amber-ish cyan
  branches.forEach(([n]) => { if (n !== "Order Input") C.dim(tl, c13, n, t(q("handsOff", 11.4))); });
  C.camSpan(tl, c13, "Order Input", "Place Order", 2.2, t(q("handsOff", 11.4)), 1.0);
  C.flow(tl, c13, "Order Input", "Place Order", t(q("handsOff", 11.4) + 0.6), 0.45);
  C.light(tl, c13, "Place Order", t(q("handsOff", 11.4) + 1.0), "→ WF10");

  // zoom-through into WF10 ≈ 13.3
  const T10 = t(q("wf10", 13.3));
  tl.to(s + " .vp-13", { scale: 2.4, opacity: 0, filter: "blur(10px)", duration: 0.5, ease: "power3.in" }, T10);
  tl.fromTo(s + " .vp-10", { scale: 0.6, opacity: 0, filter: "blur(10px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }, T10 + 0.2);
  tl.to(s + " .wfname .t13", { opacity: 0, y: -16, duration: 0.3 }, T10);
  tl.fromTo(s + " .wfname .t10", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, T10 + 0.4);
  C.cam(tl, c10, "Validate", 1.5, b.start, 0);
  C.light(tl, c10, "When Executed by Another Workflow", T10 + 0.5, "order payload");

  // the chain, each on its phrase; the camera glides right as it goes
  const steps = [
    ["validates", 14.0, "Validate", "validate", "Valid?"],
    ["decrements", 15.6, "Decrement Stock", "stock −1", null],
    ["customer", 17.3, "Create Customer", "new customer", null],
    ["order", 19.6, "Create Order", `${HERO.orderNumber}`, null],
    ["invoice", 20.8, "Create Invoice", `${HERO.invoiceNumber}`, null],
  ];
  let prev = "When Executed by Another Workflow";
  for (const [key, def, node, label, extra] of steps) {
    const at = t(q(key, def));
    C.cam(tl, c10, node, 1.5, at - 0.5, 0.9, "power2.inOut");
    C.flow(tl, c10, prev, node, at - 0.25, 0.45);
    C.light(tl, c10, node, at, label);
    if (extra) { C.flow(tl, c10, node, extra, at + 0.4, 0.3); C.light(tl, c10, extra, at + 0.6); }
    prev = node;
  }
  // "it opens a task" ≈ 23.5 → amber
  const tTask = t(q("task", 23.6));
  C.camSpan(tl, c10, "Build Tasks", "Create Tasks", 1.45, tTask - 0.6, 1.0, "power2.inOut");
  C.flow(tl, c10, "Create Invoice", "Open Stock Tasks", tTask - 0.5, 0.5);
  C.flow(tl, c10, "Open Stock Tasks", "Build Tasks", tTask - 0.1, 0.3);
  C.flow(tl, c10, "Build Tasks", "Has Tasks?", tTask + 0.15, 0.25);
  C.flow(tl, c10, "Has Tasks?", "Create Tasks", tTask + 0.35, 0.25, "amber");
  C.light(tl, c10, "Create Tasks", tTask + 0.6, `human task · לשלוח ${HERO.orderNumber} ל${HERO.city}`, "amber");
  // "on a list for a human" ≈ 29 → push in on the amber node, breathe
  C.cam(tl, c10, "Create Tasks", 1.9, t(q("human", 29.0)), 1.4, "power2.inOut");
  tl.to(c10.hits["Create Tasks"], { scale: 1.14, duration: 0.9, yoyo: true, repeat: 3, ease: "sine.inOut" }, t(q("human", 29.0)));

  // "Send the same checkout twice ... No duplicates" ≈ 32.5 → back to Last Order / Compute
  const tDup = t(q("twice", 32.6));
  C.camSpan(tl, c10, "Last Order", "Compute", 1.6, tDup - 0.4, 1.1, "power2.inOut");
  C.light(tl, c10, "Last Order", tDup + 0.5, "same email · same cart · < 5 min");
  C.light(tl, c10, "Compute", tDup + 1.3, "→ existing order");

  // ≈ 37.5 execution proof: cut to the executions capture, bracket on "Succeeded"
  const tEx = t(q("noDuplicates", 37.6));
  tl.to(s + " .vp-10", { scale: 1.25, opacity: 0, filter: "blur(8px)", duration: 0.4, ease: "power3.in" }, tEx);
  tl.fromTo(s + " .vp-exec", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, tEx + 0.2);
  tl.fromTo(s + " .proof", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out" }, tEx + 0.7);
  tl.fromTo(s + " .proof-tag", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, tEx + 0.95);
};
