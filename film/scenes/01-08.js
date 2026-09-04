// Beats 01 (cold open) and 08 (three agents).
(function () {
  const Q = (id) => { const c = window.CUES && window.CUES[id] ? window.CUES[id] : {}; return (k, d) => (c[k] != null ? c[k] : d); };

  // ---- Beat 01: black, a phone, one notification ------------------------------
  window.SCENES["01"] = function (tl, b) {
    const s = "#s-01", t = (x) => b.start + x, q = Q("01");
    tl.set([s + " .phone1", s + " .readouts > *", s + " .flash"], { opacity: 0 }, b.start);
    tl.set(s + " .glow1", { opacity: 0 }, b.start);
    // 1.5 s: the notification (SFX at 1.5 on the sfx track), the phone lights up
    tl.fromTo(s + " .phone1", { opacity: 0, scale: 0.9, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power3.out" }, t(1.2));
    tl.fromTo(s + " .flash", { opacity: 0 }, { opacity: 0.9, duration: 0.08, yoyo: true, repeat: 1 }, t(1.5));
    tl.to(s + " .glow1", { opacity: 0.7, duration: 1.4, ease: "power2.out" }, t(1.55));
    // slow push-in for the whole beat
    tl.to(s + " .phone1", { scale: 1.18, y: -30, duration: b.dur - 1.8, ease: "sine.inOut" }, t(1.8));
    // readouts on the left, one per phrase
    tl.fromTo(s + " .r1", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(0.4));
    tl.fromTo(s + " .r2", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(q("customer", 2.9)));
    tl.fromTo(s + " .r3", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(q("customer", 2.9) + 1.2));
    tl.fromTo(s + " .r4", { opacity: 0, letterSpacing: "0.4em" }, { opacity: 1, letterSpacing: "0.18em", duration: 0.8, ease: "power3.out" }, t(q("nobody", 6.2)));
    tl.fromTo(s + " .r5", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, t(q("four", 10.0)));
    tl.to(s + " .r5 .num", { textShadow: "0 0 40px rgba(90,209,255,1)", duration: 0.5, yoyo: true, repeat: 3 }, t(q("four", 10.0)) + 0.3);
  };

  // ---- Beat 08: three agents, one data set --------------------------------------
  window.SCENES["08"] = function (tl, b) {
    const s = "#s-08", t = (x) => b.start + x, q = Q("08"), C = window.Canvas, N = window.NODES;
    const c5 = C.build(document.querySelector(s + " .pan-5"), N.wf5, "captures/n8n-wf5-canvas.png");
    const ch = C.build(document.querySelector(s + " .pan-h"), N.wf5handoff, "captures/n8n-wf5handoff-canvas.png");
    const c3 = C.build(document.querySelector(s + " .pan-3"), N.wf3, "captures/n8n-wf3-canvas.png");
    const panels = [s + " .p-menu", s + " .p-handoff", s + " .p-widget", s + " .p-supabase", s + " .p-cmdk", s + " .p-gmail", s + " .p-manager"];
    tl.set([s + " .rail > *", s + " .vp-5", s + " .vp-h", s + " .vp-3", ...panels, s + " .counter"], { opacity: 0 }, b.start);
    // rail
    tl.fromTo(s + " .rail .kicker", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, t(0.05));
    tl.fromTo(s + " .rail .title", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, t(0.25));
    tl.fromTo(s + " .rail .agent", { opacity: 0, x: -60, scale: 0.8 }, { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "back.out(2)", stagger: 0.18 }, t(q("three", 2.6)));
    const focus = (which, at) => {
      tl.to(s + " .rail .agent", { opacity: 0.35, scale: 0.94, x: 0, duration: 0.4 }, at);
      tl.to(s + ` .rail .agent[data-a='${which}']`, { opacity: 1, scale: 1.08, x: 18, duration: 0.5, ease: "back.out(2)" }, at);
      tl.fromTo(s + ` .rail .agent[data-a='${which}'] .led`, { boxShadow: "0 0 0px #34d17a" }, { boxShadow: "0 0 18px #34d17a", duration: 0.4 }, at);
    };
    const show = (sel, at, from) => tl.fromTo(sel, Object.assign({ opacity: 0 }, from || { y: 60, scale: 0.94 }), { opacity: 1, y: 0, x: 0, scale: 1, rotationY: 0, duration: 0.7, ease: "power4.out" }, at);
    const hide = (sel, at) => tl.to(sel, { opacity: 0, duration: 0.25, ease: "power2.in" }, at);

    // --- support agent (5.7 → 38)
    focus("support", t(q("support", 5.7)));
    // "browse the catalog with buttons": WF5 canvas, Route → Render Menu → Send Menu
    show(s + " .vp-5", t(q("support", 5.7)) + 0.2, { x: 120, rotationY: -20, transformPerspective: 2200 });
    C.camSpan(tl, c5, "Classify", "Find Lead", 0.95, b.start, 0);
    C.light(tl, c5, "Telegram Trigger", t(q("support", 5.7)) + 0.6, "@aielec_support_bot");
    C.flow(tl, c5, "Telegram Trigger", "Classify", t(q("support", 5.7)) + 1.0, 0.3);
    C.flow(tl, c5, "Classify", "Route", t(q("support", 5.7)) + 1.3, 0.3);
    C.camSpan(tl, c5, "Products", "Send Menu", 1.0, t(q("buttons", 10.6)) - 0.5, 0.9, "power2.inOut");
    C.flow(tl, c5, "Route", "Products", t(q("buttons", 10.6)) - 0.2, 0.3);
    C.flow(tl, c5, "Products", "Render Menu", t(q("buttons", 10.6)) + 0.1, 0.3);
    C.light(tl, c5, "Render Menu", t(q("buttons", 10.6)) + 0.3, "category → product → מעוניין");
    // "tap interested, leave a phone number, a lead lands": Create Lead → Ask Phone → Notify Owner
    C.camSpan(tl, c5, "Is Lead?", "Notify Owner", 1.0, t(q("interested", 11.7)) - 0.3, 0.9, "power2.inOut");
    C.chain(tl, c5, ["Is Lead?", "Lead Exists?", "Has Lead?", "Create Lead"], t(q("interested", 11.7)) - 0.2, 0.22);
    C.light(tl, c5, "Create Lead", t(q("interested", 11.7)) + 0.5, "Leads · Source = telegram");
    C.chain(tl, c5, ["Create Lead", "Create Task", "Notify Owner", "Confirm Lead", "Ask Phone"], t(q("phone", 13.4)) - 0.5, 0.2);
    C.light(tl, c5, "Ask Phone", t(q("phone", 13.4)) + 0.3, "one-tap phone share");
    C.light(tl, c5, "Notify Owner", t(q("lead", 14.4)) + 0.3, "alert → owner", "amber");
    show(s + " .p-menu", t(q("buttons", 10.6)) + 0.4, { x: 200, scale: 0.9 });
    // "Or they can just talk to it": the website widget conversation
    hide(s + " .vp-5", t(q("talk", 18.5)));
    hide(s + " .p-menu", t(q("talk", 18.5)));
    show(s + " .p-widget", t(q("talk", 18.5)) + 0.2, { y: 80, scale: 0.9 });
    // "embedded into Supabase's vector store": the embeddings table rises behind the widget
    show(s + " .p-supabase", t(q("vector", 23.9)), { y: -120, scale: 0.85 });
    tl.fromTo(s + " .p-supabase .tag", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, t(q("vector", 23.9)) + 0.5);
    hide(s + " .p-supabase", t(q("discount", 28.4)));
    // "Ask for a discount, and it politely refuses": bracket the refusal
    tl.fromTo(s + " .p-widget .br", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out" }, t(q("refuses", 30.6)) + 0.5);
    // "Ask for a human, and it hands you off": WF5-handoff canvas
    hide(s + " .p-widget", t(q("humanAsk", 31.7)));
    show(s + " .vp-h", t(q("humanAsk", 31.7)) + 0.45, { x: -120, rotationY: 20, transformPerspective: 2200 });
    C.cam(tl, ch, "Has Contact?", 1.5, b.start, 0);
    C.light(tl, ch, "When Executed by Another Workflow", t(q("humanAsk", 31.7)) + 0.5, "handoff tool");
    C.flow(tl, ch, "When Executed by Another Workflow", "Has Contact?", t(q("humanAsk", 31.7)) + 0.9, 0.3);
    C.camSpan(tl, ch, "Create Lead", "Notify Owner", 1.25, t(q("hands", 33.4)) - 0.4, 0.9, "power2.inOut");
    C.flow(tl, ch, "Has Contact?", "Create Lead", t(q("hands", 33.4)), 0.3); C.light(tl, ch, "Create Lead", t(q("hands", 33.4)) + 0.3, "a lead");
    C.flow(tl, ch, "Create Lead", "Create Task", t(q("hands", 33.4)) + 0.7, 0.3); C.light(tl, ch, "Create Task", t(q("hands", 33.4)) + 1.0, "a task", "amber");
    C.flow(tl, ch, "Create Task", "Notify Owner", t(q("hands", 33.4)) + 1.4, 0.3); C.light(tl, ch, "Notify Owner", t(q("hands", 33.4)) + 1.7, "a message to me", null, "right");
    show(s + " .p-handoff", t(q("hands", 33.4)) + 0.6, { x: 200, scale: 0.9 });

    // --- manager agent (38.4 → 45.4): the real ⌘K answer
    hide(s + " .vp-h", t(q("manager", 38.4)));
    hide(s + " .p-handoff", t(q("manager", 38.4)));
    focus("manager", t(q("manager", 38.4)));
    show(s + " .p-cmdk", t(q("manager", 38.4)) + 0.2, { y: 80, scale: 0.92 });
    show(s + " .p-manager", t(q("manager", 38.4)) + 0.5, { x: 200, scale: 0.9 });
    tl.fromTo(s + " .p-cmdk .tag", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)", stagger: 0.6 }, t(q("revenue", 40.8)));

    // --- sales agent (45.4 → end): WF3 canvas, Sales Agent → Send Email → Mark Contacted
    hide(s + " .p-cmdk", t(q("sales", 45.4)));
    hide(s + " .p-manager", t(q("sales", 45.4)));
    focus("sales", t(q("sales", 45.4)));
    show(s + " .vp-3", t(q("sales", 45.4)) + 0.2, { x: 120, rotationY: -20, transformPerspective: 2200 });
    C.camSpan(tl, c3, "Next New Lead", "Send Email", 1.0, b.start, 0);
    C.light(tl, c3, "Every 3 Hours", t(q("sales", 45.4)) + 0.5, "every 3 hours");
    C.chain(tl, c3, ["Every 3 Hours", "Next New Lead", "Has Lead?", "Sales Agent"], t(q("sales", 45.4)) + 0.9, 0.25);
    C.light(tl, c3, "Sales Agent", t(q("sales", 45.4)) + 1.8, "drafts Hebrew outreach");
    C.chain(tl, c3, ["Sales Agent", "Mark Contacted", "Send Email"], t(q("sales", 45.4)) + 2.7, 0.3);
    C.light(tl, c3, "Send Email", t(q("sales", 45.4)) + 3.4, "Gmail");
    C.light(tl, c3, "Mark Contacted", t(q("reply", 50.2)) - 0.3, "contacted · WF4 watches");
    show(s + " .p-gmail", t(q("sales", 45.4)) + 3.2, { y: -100, scale: 0.9 });
    // counter
    tl.fromTo(s + " .counter", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t(q("grounded", 20.0)));
    const obj = { v: 0 }; const el = document.querySelector(s + " .counter .num");
    tl.to(obj, { v: 34, duration: 1.0, ease: "power2.out", snap: { v: 1 }, onUpdate: () => { el.textContent = Math.round(obj.v); } }, t(q("grounded", 20.0)) + 0.2);
  };
})();
