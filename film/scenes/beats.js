// Beat table. dur = measured narration length (script/narration.json) + a tail.
// Keep ids in sync with the scene <div id="s-NN"> containers in index.html.
window.BEATS = [
  { id: "01", name: "cold-open", dur: 11.8, narration: "audio/narration/beat-01.mp3" },
  { id: "02", name: "logo", dur: 7.7, narration: "audio/narration/beat-02.mp3" },
  { id: "03", name: "storefront", dur: 15.9, narration: "audio/narration/beat-03.mp3" },
  { id: "04", name: "n8n-order", dur: 41.5, narration: "audio/narration/beat-04.mp3" },
  { id: "05", name: "airtable", dur: 20.8, narration: "audio/narration/beat-05.mp3" },
  { id: "06", name: "invoice", dur: 25.4, narration: "audio/narration/beat-06.mp3" },
  { id: "07", name: "admin-orders", dur: 17.0, narration: "audio/narration/beat-07.mp3" },
  { id: "08", name: "agents", dur: 51.9, narration: "audio/narration/beat-08.mp3" },
  { id: "09", name: "morning", dur: 12.8, narration: "audio/narration/beat-09.mp3" },
  { id: "10", name: "architecture", dur: 17.9, narration: "audio/narration/beat-10.mp3" },
  { id: "11", name: "end", dur: 11.3, narration: "audio/narration/beat-11.mp3" },
];
(function () {
  let t = 0;
  for (const b of window.BEATS) { b.start = t; t += b.dur; }
  window.BEATS.total = t;
  window.beat = (id) => window.BEATS.find((b) => b.id === id);
})();
// Scene builders register here: window.SCENES["10"] = (tl, b) => { ... }
window.SCENES = window.SCENES || {};
