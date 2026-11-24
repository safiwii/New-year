/* «Полночный выпуск» — слой атмосферы. Подключить в index.html одной строкой перед app.js:
   <script src="atmosphere.js"></script>                                                        */
(() => {
  // Стили подключаем сами, после style.css, чтобы они его перекрывали
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "atmosphere.css";
  document.head.appendChild(link);

  const reduced = () => document.body.classList.contains("reduced-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function burst(x, y, kind, count) {
    if (reduced()) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("b");
      const a = Math.random() * Math.PI * 2;
      const r = 26 + Math.random() * (kind === "wax" ? 70 : 46);
      p.className = "fx" + (kind === "wax" ? " wax" : "");
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--dx", Math.cos(a) * r + "px");
      p.style.setProperty("--dy", Math.sin(a) * r + 22 + "px");
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1050);
    }
  }

  function buildGarland() {
    const colors = ["#F0D6A0", "#C8324B", "#FFF3D1", "#F0D6A0", "#E0566D", "#FFE9B8"];
    const bulbs = 12;
    const box = document.createElement("div");
    box.className = "garland";
    box.setAttribute("aria-hidden", "true");

    // Нить: провисающие дуги между огоньками
    let d = "M0 4";
    const step = 100 / (bulbs / 2);
    for (let x = 0; x < 100; x += step) d += ` Q ${x + step / 2} 44 ${x + step} 4`;
    box.innerHTML = `<svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="${d}"/></svg>`;

    for (let i = 0; i < bulbs; i++) {
      const b = document.createElement("i");
      const c = colors[i % colors.length];
      b.style.setProperty("--c", c);
      b.style.left = ((i + 0.5) / bulbs) * 100 + "%";
      b.style.top = (i % 2 ? 26 : 22) + "px";
      b.style.animationDelay = (i * 0.37) % 3.4 + "s";
      box.appendChild(b);
    }
    document.body.appendChild(box);
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildGarland();

    // Конверт: клапан раскрывается, печать трескается и разлетается осколками сургуча
    const card = document.getElementById("open-envelope-btn");
    const seal = document.getElementById("env-wax-seal");
    if (seal && !seal.querySelector(".seal-crack")) {
      const crack = document.createElement("div");
      crack.className = "seal-crack";
      seal.prepend(crack);
    }
    if (card) {
      card.addEventListener("click", () => {
        card.classList.add("flap-open");
        if (seal) {
          const r = seal.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, "wax", 12);
          burst(r.left + r.width / 2, r.top + r.height / 2, "gold", 14);
        }
      });
    }

    // Золотые искры под пальцем (на кнопках и шарах тоже)
    document.addEventListener("pointerdown", (e) => burst(e.clientX, e.clientY, "gold", 7));

    // Печать на обложке трескается в 00:00: сыплем осколки, когда на ней появится класс broken
    const coverSeal = document.getElementById("cover-wax-seal");
    if (coverSeal) {
      new MutationObserver(() => {
        if (coverSeal.classList.contains("broken")) {
          const r = coverSeal.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, "wax", 16);
        }
      }).observe(coverSeal, { attributes: true, attributeFilter: ["class"] });
    }
  });
})();
