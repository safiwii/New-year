(() => {
  const calm = () => document.body.classList.contains("reduced-motion") ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Гирлянда: провод со слегка провисающей дугой и тёплыми лампочками
  function buildGarland() {
    const w = Math.max(360, innerWidth), n = Math.round(w / 64);
    const hues = ["#F0D6A0", "#FFF3D1", "#F0D6A0", "#FFE7B0", "#C8324B"];
    let bulbs = "", d = "M0 4";
    for (let i = 0; i <= n; i++) {
      const x = (w / n) * i, y = 6 + Math.sin((i / n) * Math.PI * 4) * 5 + 10;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      if (i % 1 === 0 && i > 0 && i < n) {
        const c = hues[i % hues.length];
        bulbs += `<g class="bulb" style="--d:${(i * 0.37).toFixed(2)}s">` +
          `<circle cx="${x}" cy="${y + 11}" r="11" fill="${c}" opacity=".16"/>` +
          `<ellipse cx="${x}" cy="${y + 8}" rx="3.2" ry="5" fill="${c}"/></g>`;
      }
    }
    const el = document.createElement("div");
    el.className = "garland-wire";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<svg viewBox="0 0 ${w} 56" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="#D9B26F" stroke-opacity=".55" stroke-width="1"/>${bulbs}</svg>`;
    document.body.appendChild(el);
  }

  // Искры фольги: короткий всплеск из точки касания
  function sparks(x, y, count = 9) {
    if (calm()) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("i");
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const r = 26 + Math.random() * 34;
      s.className = "spark";
      s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
  }

  function shards(x, y) {
    if (calm()) return;
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("i"), t = Math.random() * 6.28, r = 40 + Math.random() * 70;
      s.className = "fx wax";
      s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(t) * r}px;--dy:${Math.sin(t) * r + 40}px`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1050);
    }
  }

  const tappable = ".ornament-ball,.star-slot,.glass-jar-btn,.advent-door,.memory-card,.voice-avatar-btn,.hidden-star-btn,.goal-chip";
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest(tappable)) sparks(e.clientX, e.clientY, 7);
    const seal = e.target.closest("#open-envelope-btn");
    if (seal) {
      const r = document.getElementById("env-wax-seal").getBoundingClientRect();
      sparks(r.left + r.width / 2, r.top + r.height / 2, 18);
      shards(r.left + r.width / 2, r.top + r.height / 2);
    }
  });

  // Взлом печати в полночь: золотая россыпь из центра
  new MutationObserver(() => {
    const f = document.getElementById("midnight-flash");
    if (f && !f.classList.contains("hidden")) {
      sparks(innerWidth / 2, innerHeight / 2, 28);
      setTimeout(() => sparks(innerWidth / 2, innerHeight / 2, 28), 700);
    }
  }).observe(document.getElementById("midnight-flash"), { attributes: true, attributeFilter: ["class"] });

  buildGarland();
})();
