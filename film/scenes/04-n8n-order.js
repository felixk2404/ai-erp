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
    C.light(tl, c13, n, at + 0.35, label, null, "right", true);
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

  // the chain follows the REAL graph edges; tags land on the narration phrases
  const G = ["When Executed by Another Workflow", "Validate", "Valid?", "Products", "Customer", "Last Customer", "Last Order", "Last Invoice", "Compute", "In Stock?", "New Customer?", "Create Customer", "Carry", "Create Order", "Create Invoice", "Has Stock Updates?", "Decrement Stock", "Email Customer", "Notify Manager", "Open Stock Tasks", "Build Tasks", "Has Tasks?", "Create Tasks"];
  const upTo = (name) => G.slice(0, G.indexOf(name) + 1);
  let drawn = 1; // how many nodes of G already have their incoming edge drawn
  const advance = (name, at) => { const idx = G.indexOf(name); if (idx > drawn - 1) { C.chain(tl, c10, G.slice(drawn - 1, idx + 1), at - 0.45, 0.16); drawn = idx + 1; } };
  const step = (key, def, node, label, scale, color) => {
    const at = t(q(key, def));
    C.cam(tl, c10, node, scale || 1.5, at - 0.55, 0.9, "power2.inOut");
    advance(node, at);
    C.light(tl, c10, node, at, label, color);
    return at;
  };
  step("validates", 15.7, "Validate", "validate the cart");
  step("decrements", 17.1, "In Stock?", "stock check");
  step("customer", 18.7, "Create Customer", "new customer → Customers");
  step("order", 20.5, "Create Order", `Orders · ${HERO.orderNumber}`);
  step("invoice", 22.0, "Create Invoice", `Invoices · ${HERO.invoiceNumber}`);
  step("invoice", 23.6, "Decrement Stock", "stock −1 · Products");
  // "it opens a task" → amber
  const tTask = t(q("task", 25.6));
  C.camSpan(tl, c10, "Build Tasks", "Create Tasks", 1.45, tTask - 0.6, 1.0, "power2.inOut");
  C.chain(tl, c10, G.slice(G.indexOf("Decrement Stock"), G.indexOf("Has Tasks?") + 1), tTask - 0.7, 0.16);
  C.flow(tl, c10, "Has Tasks?", "Create Tasks", tTask + 0.1, 0.3, "amber");
  C.light(tl, c10, "Create Tasks", tTask + 0.4, `human task · לשלוח ${HERO.orderNumber} ל${HERO.city}`, "amber");
  // "on a list for a human" → push in on the amber node, breathe
  C.cam(tl, c10, "Create Tasks", 1.9, t(q("human", 34.0)), 1.4, "power2.inOut");
  tl.to(c10.hits["Create Tasks"], { scale: 1.14, duration: 0.9, yoyo: true, repeat: 1, ease: "sine.inOut" }, t(q("human", 34.0)));

  // "Send the same checkout twice ... No duplicates" ≈ 32.5 → back to Last Order / Compute
  const tDup = t(q("twice", 35.2));
  C.fadeFlows(tl, c10, tDup - 0.4);
  C.camSpan(tl, c10, "Last Order", "Compute", 1.6, tDup - 0.4, 1.1, "power2.inOut");
  C.light(tl, c10, "Last Order", tDup + 0.5, "same email · same cart · < 5 min");
  C.light(tl, c10, "Compute", tDup + 1.3, "→ existing order");

  // ≈ 37.5 execution proof: cut to the executions capture, bracket on "Succeeded"
  const tEx = t(q("noDuplicates", 39.6));
  tl.to(s + " .vp-10", { scale: 1.25, opacity: 0, filter: "blur(8px)", duration: 0.4, ease: "power3.in" }, tEx);
  tl.to(s + " .wfname", { opacity: 0, y: -20, duration: 0.3 }, tEx);
  tl.set(s + " .wfname", { opacity: 0, visibility: "hidden" }, tEx + 0.35);
  tl.fromTo(s + " .vp-exec", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, tEx + 0.2);
  tl.fromTo(s + " .proof", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out" }, tEx + 0.7);
  tl.fromTo(s + " .proof-tag", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, tEx + 0.95);
};
