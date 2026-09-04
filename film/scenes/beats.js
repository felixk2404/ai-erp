// Beat table. Durations are PLACEHOLDERS until script/narration.json exists
// (Task 2); then `start` is recomputed from the measured narration files.
// Keep ids in sync with the scene <div id="s-NN"> containers in index.html.
window.BEATS = [
  { id: "01", name: "cold-open", dur: 12 },
  { id: "02", name: "logo", dur: 8 },
  { id: "03", name: "storefront", dur: 18 },
  { id: "04", name: "n8n-order", dur: 38 },
  { id: "05", name: "airtable", dur: 20 },
  { id: "06", name: "invoice", dur: 27 },
  { id: "07", name: "admin-orders", dur: 20 },
  { id: "08", name: "agents", dur: 47 },
  { id: "09", name: "morning", dur: 14 },
  { id: "10", name: "architecture", dur: 18 },
  { id: "11", name: "end", dur: 11 },
];
(function () {
  let t = 0;
  for (const b of window.BEATS) { b.start = t; t += b.dur; }
  window.BEATS.total = t;
  window.beat = (id) => window.BEATS.find((b) => b.id === id);
})();
// Scene builders register here: window.SCENES["10"] = (tl, b) => { ... }
window.SCENES = window.SCENES || {};
