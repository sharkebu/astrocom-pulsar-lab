(() => {
  "use strict";

  // Catalog values: ATNF PSR J0056+4756. Geometry below is an adjustable model.
  const CATALOG = Object.freeze({
    periodMs: 472.037,
    pdotE15: 3.3284924,
    distanceKpc: 1.123,
    alpha: 42,
    zeta: 43,
    rho: 12,
  });
  const limits = {
    periodMs: [20, 2000], pdotE15: [0.001, 100], distanceKpc: [0.01, 30],
    alpha: [0, 90], zeta: [0, 180], rho: [3, 35],
  };
  const model = { ...CATALOG, cycles: 0, running: !matchMedia("(prefers-reduced-motion: reduce)").matches };
  const $ = (id) => document.getElementById(id);
  const deg = Math.PI / 180;
  const TAU = Math.PI * 2;
  const nfmt = (value, digits = 3) => new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // A small precise input keeps the catalog's fractional millisecond value intact.
  $("period").insertAdjacentHTML("afterend", `
    <div class="precise-row"><span>Hassas değer</span>
      <div><input id="period-number" aria-label="Periyot, milisaniye" type="number" min="20" max="2000" step="0.001" value="472.037"><span>ms</span></div>
    </div>`);
  document.querySelector(".stage-footer").insertAdjacentHTML("afterend", `
    <div class="quick-period"><label for="quick-period">Periyodu değiştir <output id="quick-period-value">472,037 ms</output></label>
      <input id="quick-period" type="range" min="20" max="2000" step="1" value="472" aria-label="Periyodu değiştir">
    </div>`);
  document.querySelector(".controls-actions").insertAdjacentHTML("beforebegin", `
    <div class="control numeric-control"><label for="pdot-number">Periyot türevi Ṗ <span class="model-tag" id="pdot-tag">KATALOG</span></label>
      <div class="numeric-field"><input id="pdot-number" type="number" min="0.001" max="100" step="0.001" value="3.3284924"><span>× 10⁻¹⁵ s/s</span></div>
    </div>
    <div class="control numeric-control"><label for="distance-number">Uzaklık <span class="model-tag" id="distance-tag">DM TAHMİNİ</span></label>
      <div class="numeric-field"><input id="distance-number" type="number" min="0.01" max="30" step="0.001" value="1.123"><span>kpc</span></div>
    </div>
    <div class="geometry-note">α, ζ ve ρ katalogda ölçülmüş değerler değil; ışının gözlemciye göre yönünü kuran model açılardır.</div>`);
  document.querySelector(".stat-grid").insertAdjacentHTML("beforeend", `
    <div class="stat"><span>Dağılım ölçüsü DM</span><strong>18,1354</strong><small>pc cm⁻³ · katalog değeri</small></div>
    <div class="stat"><span>Gökyüzü konumu</span><strong>00sa 56dk</strong><small>+47° 56′ · J2000</small></div>`);
  document.head.insertAdjacentHTML("beforeend", `<style>
    .precise-row{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--muted);font-size:.78rem;margin:3px 0 7px}
    .precise-row>div,.numeric-field{display:flex;align-items:center;gap:8px}.precise-row input,.numeric-field input{color:var(--text);background:#071924;border:1px solid #3a6071;border-radius:7px;padding:6px 8px;font:500 .9rem ui-monospace,SFMono-Regular,Consolas,monospace;min-width:0}
    .precise-row input{width:102px}.precise-row span:last-child,.numeric-field span{color:var(--muted);font-size:.75rem;white-space:nowrap}.numeric-control label{align-items:center}.numeric-field{margin-top:12px}.numeric-field input{width:130px}.model-tag{font:600 .62rem ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.08em;color:var(--amber);border:1px solid #70563d;border-radius:4px;padding:3px 5px}.geometry-note{padding:12px 24px;color:var(--muted);font-size:.78rem;border-top:1px solid var(--line)}
    input:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid var(--amber);outline-offset:3px}
    .quick-period{display:none;border-top:1px solid var(--line);padding:10px 16px 12px}.quick-period label{display:flex;justify-content:space-between;font-size:.82rem;font-weight:600}.quick-period output{font:500 .84rem ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--cyan)}.quick-period input{width:100%;accent-color:var(--cyan);margin:9px 0 0}
    @media(max-width:680px){.geometry-note{padding:12px 17px}.precise-row input{width:92px}.quick-period{display:block}.stage-wrap{height:270px}}
  </style>`);

  const stage = $("star"), stageCtx = stage.getContext("2d");
  const trace = $("trace"), traceCtx = trace.getContext("2d");
  const view = { stageW: 0, stageH: 0, traceW: 0, traceH: 0 };
  function resizeCanvas(canvas, ctx, wKey, hKey) {
    const box = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(box.width * pixelRatio));
    canvas.height = Math.max(1, Math.round(box.height * pixelRatio));
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    view[wKey] = box.width;
    view[hKey] = box.height;
  }
  const resize = () => {
    resizeCanvas(stage, stageCtx, "stageW", "stageH");
    resizeCanvas(trace, traceCtx, "traceW", "traceH");
  };
  new ResizeObserver(resize).observe(stage);
  new ResizeObserver(resize).observe(trace);
  resize();

  // Magnetic axis rotating around spin axis. The observer is fixed at azimuth 0.6 rad.
  const observerAzimuth = 0.6;
  function intensityAt(cycles) {
    const a = model.alpha * deg, z = model.zeta * deg;
    const cosTheta = clamp(
      Math.cos(a) * Math.cos(z) + Math.sin(a) * Math.sin(z) * Math.cos(TAU * cycles - observerAzimuth),
      -1, 1,
    );
    const theta = Math.acos(cosTheta);
    const opening = model.rho * deg;
    const shape = (angle) => angle >= opening ? 0 : Math.cos(angle / opening * Math.PI / 2) ** 4;
    return Math.max(shape(theta), shape(Math.PI - theta));
  }
  function hasPulse() {
    return Math.min(Math.abs(model.alpha - model.zeta), Math.abs(180 - model.alpha - model.zeta)) < model.rho;
  }

  const cameraAngle = 62 * deg;
  const camera = [Math.sin(cameraAngle), 0, Math.cos(cameraAngle)];
  function project(v) {
    return {
      x: v[1],
      y: -v[0] * Math.cos(cameraAngle) + v[2] * Math.sin(cameraAngle),
      depth: v[0] * camera[0] + v[1] * camera[1] + v[2] * camera[2],
    };
  }
  function vecFromAngles(inclination, azimuth) {
    const a = inclination * deg;
    return [Math.sin(a) * Math.cos(azimuth), Math.sin(a) * Math.sin(azimuth), Math.cos(a)];
  }
  const stars = Array.from({ length: 65 }, (_, i) => {
    const fract = (x) => x - Math.floor(x);
    return { x: fract(i * .61803398875 + .19), y: fract(i * .754877666 + .32), size: .5 + fract(i * .4389) * 1.1, alpha: .18 + fract(i * .367) * .4 };
  });
  const patches = Array.from({ length: 32 }, (_, i) => {
    const fract = (x) => x - Math.floor(x);
    return { lat: Math.asin(fract(i * .6180339 + .31) * 1.8 - .9), lon: TAU * fract(i * .75487766 + .23), size: .035 + fract(i * .4142) * .08 };
  });

  function drawBeam(ctx, cx, cy, radius, v, front, power) {
    const p = project(v);
    const reach = radius * 3.05;
    const endX = cx + p.x * reach;
    const endY = cy - p.y * reach;
    const dx = endX - cx, dy = endY - cy;
    const len = Math.hypot(dx, dy);
    if (len < 4) return;
    const spread = reach * Math.tan(model.rho * deg) * (0.48 + Math.abs(p.depth) * .25);
    const nx = -dy / len, ny = dx / len;
    ctx.save();
    ctx.globalAlpha = front ? .55 + power * .32 : .16;
    const gradient = ctx.createLinearGradient(cx, cy, endX, endY);
    gradient.addColorStop(0, "rgba(172,255,236,.5)");
    gradient.addColorStop(.36, "rgba(91,223,227,.24)");
    gradient.addColorStop(1, "rgba(56,186,207,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX + nx * spread, endY + ny * spread);
    ctx.quadraticCurveTo(endX + dx * .12, endY + dy * .12, endX - nx * spread, endY - ny * spread);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = front ? "rgba(145,244,237,.55)" : "rgba(145,244,237,.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();ctx.moveTo(cx, cy);ctx.lineTo(endX, endY);ctx.stroke();
    ctx.restore();
  }

  function drawStage() {
    const ctx = stageCtx, w = view.stageW, h = view.stageH;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const cx = w * .5, cy = h * .51;
    const r = Math.min(w * .18, h * .165, 80);
    const power = intensityAt(model.cycles);
    const phase = TAU * model.cycles;
    const m = vecFromAngles(model.alpha, phase);
    const opposite = m.map((x) => -x);
    const mProjected = project(m);
    const observer = vecFromAngles(model.zeta, observerAzimuth);
    const obsProjected = project(observer);

    // Quiet astronomical field and measurement rings.
    for (const star of stars) {
      const sx = star.x * w, sy = star.y * h;
      const fade = Math.min(1, Math.hypot(sx - cx, sy - cy) / (r * 1.5));
      ctx.fillStyle = `rgba(165,217,224,${star.alpha * fade})`;
      ctx.beginPath();ctx.arc(sx, sy, star.size, 0, TAU);ctx.fill();
    }
    ctx.strokeStyle = "rgba(112,169,185,.12)";
    ctx.lineWidth = 1;
    for (const mult of [1.55, 2.4]) {
      ctx.beginPath();ctx.arc(cx, cy, r * mult, 0, TAU);ctx.stroke();
    }
    ctx.strokeStyle = "rgba(139,233,223,.26)";
    ctx.setLineDash([5, 7]);
    ctx.beginPath();ctx.moveTo(cx, cy + r * 2.3);ctx.lineTo(cx, cy - r * 2.3);ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "11px ui-monospace,Consolas,monospace";
    ctx.fillStyle = "rgba(169,210,217,.68)";
    ctx.fillText("DÖNME EKSENİ", cx + 10, cy - r * 2.15);

    // A fixed sightline makes the emission geometry legible.
    const ox = cx + obsProjected.x * r * 2.8;
    const oy = cy - obsProjected.y * r * 2.8;
    ctx.strokeStyle = "rgba(225,170,104,.55)";
    ctx.setLineDash([3, 5]);ctx.beginPath();ctx.moveTo(cx, cy);ctx.lineTo(ox, oy);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle = `rgba(225,170,104,${.7 + power * .3})`;
    ctx.beginPath();ctx.arc(ox, oy, 4.1 + power * 3.5, 0, TAU);ctx.fill();
    ctx.fillStyle = "rgba(235,197,148,.9)";
    ctx.fillText("GÖZLEMCİ", ox + 10, oy + 4);

    const beams = [{ v: m, p: mProjected }, { v: opposite, p: project(opposite) }];
    beams.filter(({ p }) => p.depth <= 0).forEach(({ v }) => drawBeam(ctx, cx, cy, r, v, false, power));

    // Magnetic field loops are illustrative; their direction follows the magnetic axis.
    const tilt = Math.atan2(-mProjected.y, mProjected.x);
    ctx.save();ctx.translate(cx, cy);ctx.rotate(tilt);
    for (const k of [1.45, 1.9]) {
      ctx.beginPath();ctx.ellipse(0, 0, r * k, r * .6 * k, 0, 0, TAU);
      ctx.strokeStyle = "rgba(121,199,211,.17)";ctx.lineWidth = 1;ctx.stroke();
    }
    ctx.restore();

    const halo = ctx.createRadialGradient(cx, cy, r * .15, cx, cy, r * (2 + power * .35));
    halo.addColorStop(0, `rgba(151,244,226,${.18 + power * .18})`);
    halo.addColorStop(1, "rgba(82,204,217,0)");
    ctx.fillStyle = halo;ctx.beginPath();ctx.arc(cx, cy, r * (2 + power * .35), 0, TAU);ctx.fill();
    const body = ctx.createRadialGradient(cx - r * .32, cy - r * .38, 0, cx, cy, r * 1.02);
    body.addColorStop(0, "#effff2");body.addColorStop(.22, "#afdcd0");
    body.addColorStop(.55, "#4d8e96");body.addColorStop(.86, "#173e55");body.addColorStop(1, "#061827");
    ctx.fillStyle = body;ctx.beginPath();ctx.arc(cx, cy, r, 0, TAU);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(cx, cy, r - 1, 0, TAU);ctx.clip();
    for (const patch of patches) {
      const local = [Math.cos(patch.lat) * Math.cos(patch.lon + phase), Math.cos(patch.lat) * Math.sin(patch.lon + phase), Math.sin(patch.lat)];
      const p = project(local);
      if (p.depth <= .05) continue;
      const x = cx + p.x * r, y = cy - p.y * r;
      ctx.fillStyle = `rgba(221,255,231,${.08 + p.depth * .29})`;
      ctx.beginPath();ctx.ellipse(x, y, r * patch.size * (0.5 + p.depth), r * patch.size * .47, phase * .35, 0, TAU);ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(169,245,232,.62)";ctx.lineWidth = 1.5;
    ctx.beginPath();ctx.arc(cx, cy, r, 0, TAU);ctx.stroke();
    beams.filter(({ p }) => p.depth > 0).forEach(({ v }) => drawBeam(ctx, cx, cy, r, v, true, power));

    if (power > .02) {
      const flash = ctx.createRadialGradient(cx, cy, r * .15, cx, cy, r * 1.7);
      flash.addColorStop(0, `rgba(212,255,238,${power * .38})`);
      flash.addColorStop(1, "rgba(212,255,238,0)");
      ctx.fillStyle = flash;ctx.beginPath();ctx.arc(cx, cy, r * 1.7, 0, TAU);ctx.fill();
    }
  }

  function drawTrace() {
    const ctx = traceCtx, w = view.traceW, h = view.traceH;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const top = 13, baseline = h - 32, amplitude = baseline - top - 4;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const x = i / 6 * w;
      ctx.strokeStyle = i === 6 ? "rgba(225,170,104,.48)" : "rgba(119,166,181,.15)";
      ctx.beginPath();ctx.moveTo(x, 0);ctx.lineTo(x, h);ctx.stroke();
    }
    ctx.strokeStyle = "rgba(119,166,181,.3)";
    for (const y of [top, (top + baseline) / 2, baseline]) {
      ctx.beginPath();ctx.moveTo(0, y);ctx.lineTo(w, y);ctx.stroke();
    }
    const samples = Math.max(120, Math.round(w));
    const yAt = (x) => baseline - intensityAt(model.cycles - 6 + x / w * 6) * amplitude;
    const fill = ctx.createLinearGradient(0, top, 0, baseline);
    fill.addColorStop(0, "rgba(112,227,224,.24)");fill.addColorStop(1, "rgba(112,227,224,.015)");
    ctx.beginPath();ctx.moveTo(0, baseline);
    for (let i = 0; i <= samples; i++) { const x = i / samples * w; ctx.lineTo(x, yAt(x)); }
    ctx.lineTo(w, baseline);ctx.closePath();ctx.fillStyle = fill;ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) { const x = i / samples * w; i ? ctx.lineTo(x, yAt(x)) : ctx.moveTo(x, yAt(x)); }
    ctx.strokeStyle = "#a0f5ea";ctx.lineWidth = 2.1;ctx.shadowColor = "#52dbdc";ctx.shadowBlur = 8;ctx.stroke();ctx.shadowBlur = 0;
    ctx.fillStyle = "#e1aa68";ctx.beginPath();ctx.arc(w - 2, yAt(w), 3.5, 0, TAU);ctx.fill();
    ctx.fillStyle = "rgba(157,194,202,.7)";ctx.font = "11px ui-monospace,Consolas,monospace";
    ctx.fillText("GÖRECELİ SİNYAL", 12, h - 10);
  }

  function updateReadouts() {
    const p = model.periodMs / 1000;
    const pdot = model.pdotE15 * 1e-15;
    const b = 3.2e19 * Math.sqrt(p * pdot);
    const age = p / (2 * pdot) / (365.25 * 86400);
    $("period-readout").innerHTML = `${nfmt(model.periodMs)} <small>ms</small>`;
    $("corner-period").textContent = nfmt(model.periodMs);
    $("frequency-readout").innerHTML = `${nfmt(1 / p, 4)} <small>Hz</small>`;
    $("period-value").textContent = `${nfmt(model.periodMs)} ms`;
    $("quick-period-value").textContent = `${nfmt(model.periodMs)} ms`;
    $("alpha-value").textContent = `${model.alpha}°`;
    $("zeta-value").textContent = `${model.zeta}°`;
    $("rho-value").textContent = `${model.rho}°`;
    $("pdot-readout").textContent = `${nfmt(model.pdotE15)} × 10⁻¹⁵`;
    $("distance-readout").textContent = `${nfmt(model.distanceKpc)} kpc`;
    document.querySelector("#distance-readout + small").textContent = `≈ ${nfmt(model.distanceKpc * 3261.563777, 0)} ışık yılı · DM tahmini`;
    $("field-readout").textContent = `${nfmt(b / 1e12)} × 10¹²`;
    $("age-readout").textContent = `${nfmt(age / 1e6)} milyon`;
    $("window-label").textContent = nfmt(model.periodMs * 6 / 1000, 2);
    $("pulse-state").textContent = hasPulse() ? "ışın görüş hattını kesiyor" : "bu açıda atım görünmüyor";
    $("pulse-state").style.color = hasPulse() ? "var(--cyan)" : "var(--amber)";
    $("pdot-tag").textContent = Math.abs(model.pdotE15 - CATALOG.pdotE15) < 1e-8 ? "KATALOG" : "ÖZEL DEĞER";
    $("distance-tag").textContent = Math.abs(model.distanceKpc - CATALOG.distanceKpc) < 1e-8 ? "DM TAHMİNİ" : "ÖZEL DEĞER";
    $("rotation-readout").textContent = nfmt(Math.floor(model.cycles), 0);
  }
  function syncInputs() {
    $("period").value = String(model.periodMs);
    $("quick-period").value = String(model.periodMs);
    $("period-number").value = String(model.periodMs);
    $("pdot-number").value = String(model.pdotE15);
    $("distance-number").value = String(model.distanceKpc);
    for (const key of ["alpha", "zeta", "rho"]) $(key).value = String(model[key]);
    updateReadouts();
  }
  function setParam(key, value) {
    if (!Number.isFinite(value) || value < limits[key][0] || value > limits[key][1]) return false;
    model[key] = value;
    syncInputs();
    drawStage();drawTrace();
    return true;
  }
  $("period").addEventListener("input", (e) => setParam("periodMs", Number(e.target.value)));
  $("quick-period").addEventListener("input", (e) => setParam("periodMs", Number(e.target.value)));
  for (const key of ["alpha", "zeta", "rho"]) $(key).addEventListener("input", (e) => setParam(key, Number(e.target.value)));
  for (const [id, key] of [["period-number", "periodMs"], ["pdot-number", "pdotE15"], ["distance-number", "distanceKpc"]]) {
    $(id).addEventListener("input", (e) => {
      if (e.target.value === "") return;
      const value = Number(e.target.value);
      if (!Number.isFinite(value) || value < limits[key][0] || value > limits[key][1]) return;
      model[key] = value;
      if (key === "periodMs") {
        $("period").value = String(value);
        $("quick-period").value = String(value);
      }
      updateReadouts();drawStage();drawTrace();
    });
    $(id).addEventListener("change", (e) => { if (!setParam(key, Number(e.target.value))) syncInputs(); });
  }
  function updateButton() {
    $("toggle").textContent = model.running ? "⏸ Duraklat" : "▶ Oynat";
    document.querySelector(".live span").textContent = model.running ? "GERÇEK ZAMAN" : "DURAKLATILDI";
    document.querySelector(".live i").style.opacity = model.running ? "1" : ".35";
  }
  $("toggle").addEventListener("click", () => { model.running = !model.running;updateButton(); });
  $("reset").addEventListener("click", () => { Object.assign(model, CATALOG);model.cycles = 0;syncInputs();drawStage();drawTrace(); });
  syncInputs();updateButton();

  // Optional browser agent control; it changes the exact same state as the visible controls.
  if (document.modelContext?.registerTool) {
    try {
      void Promise.resolve(document.modelContext.registerTool({
        name: "set_pulsar_parameters",
        title: "Pulsar parametrelerini ayarla",
        description: "Görünür pulsar simülasyonunda periyot, periyot türevi, uzaklık ve ışın geometrisini ayarlar.",
        inputSchema: {
          type: "object",
          properties: Object.fromEntries(Object.entries(limits).map(([key, [minimum, maximum]]) => [key, { type: "number", minimum, maximum }])),
          additionalProperties: false,
          minProperties: 1,
        },
        annotations: { readOnlyHint: false },
        execute(input) {
          if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Parametreler nesne olmalıdır.");
          const entries = Object.entries(input);
          if (!entries.length || entries.some(([key, value]) => !limits[key] || !Number.isFinite(value) || value < limits[key][0] || value > limits[key][1])) {
            throw new Error("Parametre veya değer geçersiz.");
          }
          for (const [key, value] of entries) model[key] = value;
          syncInputs();drawStage();drawTrace();
          return Object.fromEntries(Object.keys(limits).map((key) => [key, model[key]]));
        },
      })).catch(() => {});
    } catch { /* Unsupported browser implementations are harmless. */ }
  }

  let previous = performance.now();
  function frame(now) {
    const delta = Math.max(0, now - previous);
    previous = now;
    if (model.running) model.cycles += delta / model.periodMs;
    $("rotation-readout").textContent = nfmt(Math.floor(model.cycles), 0);
    $("intensity-readout").textContent = nfmt(intensityAt(model.cycles) * 100, 0);
    drawStage();drawTrace();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
