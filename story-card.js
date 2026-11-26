(() => {
  const W = 1080, H = 1920;
  const F = '"Bodoni Moda","Prata",Georgia,serif', S = '"Manrope",system-ui,sans-serif';

  // Шрифты и фото нужны заранее: canvas не ждёт их загрузки
  document.fonts && ['italic 400 80px "Bodoni Moda"', 'italic 500 80px "Bodoni Moda"', '500 30px Manrope'].forEach((f) => document.fonts.load(f));
  const photo = new Image();
  let photoOk = false;
  if (typeof ISSUE_CONFIG !== "undefined" && ISSUE_CONFIG.cover.photo) {
    photo.crossOrigin = "anonymous";
    photo.onload = () => (photoOk = true);
    photo.src = ISSUE_CONFIG.cover.photo;
  }

  const foil = (c, x, w) => {
    const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    [[0, "#B98A45"], [.3, "#F0D6A0"], [.5, "#FFF6DA"], [.7, "#D9B26F"], [1, "#B98A45"]].forEach(([o, k]) => g.addColorStop(o, k));
    return g;
  };
  const fit = (c, text, font, max, size) => {
    while (size > 28) { c.font = font(size); if (c.measureText(text).width <= max) break; size -= 4; }
    return size;
  };
  const wrap = (c, text, max) => {
    const out = []; let line = "";
    String(text).split(" ").forEach((w) => {
      const t = line ? line + " " + w : w;
      if (c.measureText(t).width > max && line) { out.push(line); line = w; } else line = t;
    });
    return line ? out.concat(line) : out;
  };
  const star = (c, x, y, r, on) => {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? r * .45 : r;
      i ? c.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k) : c.moveTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
    }
    c.closePath();
    if (on) { c.shadowColor = "rgba(240,214,160,.8)"; c.shadowBlur = 16; c.fillStyle = "#F0D6A0"; c.fill(); c.shadowBlur = 0; }
    else { c.strokeStyle = "rgba(184,179,217,.55)"; c.lineWidth = 2; c.stroke(); }
  };
  const seal = (c, x, y, r, mono, cracked) => {
    c.save(); c.translate(x, y);
    c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 40; c.shadowOffsetY = 16;
    c.beginPath();
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * Math.PI * 2, k = 1 + .035 * Math.sin(a * 5 + 1) + .02 * Math.sin(a * 9);
      const px = Math.cos(a) * r * k, py = Math.sin(a) * r * k;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    const g = c.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r);
    g.addColorStop(0, "#EE5D74"); g.addColorStop(.5, "#C8324B"); g.addColorStop(1, "#6E1425");
    c.fillStyle = g; c.fill();
    c.shadowColor = "transparent";
    c.strokeStyle = "rgba(240,214,160,.55)"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r * .78, 0, 7); c.stroke();
    c.fillStyle = "#F0D6A0"; c.font = `italic 500 ${r}px ${F}`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(mono, 0, r * .05);
    if (cracked) {
      c.strokeStyle = "#FFF6DA"; c.lineWidth = 3; c.beginPath(); c.moveTo(-r * .08, -r * 1.02);
      [[.06, -.55], [-.07, -.2], [.08, .2], [-.05, .58], [.04, 1.02]].forEach(([dx, dy]) => c.lineTo(r * dx, r * dy));
      c.stroke();
    }
    c.restore(); c.textBaseline = "alphabetic";
  };

  window.drawStoryCard = (o) => {
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");

    // Ночь, тёплый свет сверху, звёзды и зерно
    let g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1B2468"); g.addColorStop(.5, "#0B1030"); g.addColorStop(1, "#05071A");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createRadialGradient(W / 2, 0, 0, W / 2, 0, 900);
    g.addColorStop(0, "rgba(240,214,160,.28)"); g.addColorStop(1, "rgba(240,214,160,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,247,234,${.15 + rnd() * .5})`; c.beginPath(); c.arc(rnd() * W, rnd() * H * .8, .6 + rnd() * 1.6, 0, 7); c.fill(); }
    for (let i = 0; i < 3500; i++) { c.fillStyle = `rgba(${rnd() > .5 ? "255,247,234" : "0,0,0"},${rnd() * .05})`; c.fillRect(rnd() * W, rnd() * H, 2, 2); }

    // Двойная золотая рамка с ромбами по углам
    c.strokeStyle = foil(c, W / 2, W); c.lineWidth = 5; c.strokeRect(56, 56, W - 112, H - 112);
    c.lineWidth = 1.5; c.strokeRect(80, 80, W - 160, H - 160);
    [[80, 80], [W - 80, 80], [80, H - 80], [W - 80, H - 80]].forEach(([x, y]) => {
      c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillStyle = "#F0D6A0"; c.fillRect(-9, -9, 18, 18); c.restore();
    });

    // Шапка
    c.textAlign = "center";
    c.fillStyle = "#B8B3D9"; c.font = `500 30px ${S}`; c.fillText(o.kicker, W / 2, 196);
    const ms = fit(c, o.masthead, (z) => `italic 500 ${z}px ${F}`, 820, 88);
    c.font = `italic 500 ${ms}px ${F}`;
    c.fillStyle = foil(c, W / 2, c.measureText(o.masthead).width); c.fillText(o.masthead, W / 2, 300);

    // Арка: фото героини или список целей
    const ax = 190, ay = 380, aw = 700, ah = 800, r = aw / 2;
    const arch = (p) => {
      c.beginPath(); c.moveTo(ax - p, ay + ah + p); c.lineTo(ax - p, ay + r);
      c.arc(ax + r, ay + r, r + p, Math.PI, 0); c.lineTo(ax + aw + p, ay + ah + p); c.closePath();
    };
    arch(0); c.save(); c.clip();
    g = c.createLinearGradient(0, ay, 0, ay + ah);
    g.addColorStop(0, "#1B2468"); g.addColorStop(1, "#0B1030"); c.fillStyle = g; c.fillRect(ax, ay, aw, ah);
    if (o.variant === "hero" && photoOk) {
      try {
        const k = Math.max(aw / photo.naturalWidth, ah / photo.naturalHeight), pw = photo.naturalWidth * k, ph = photo.naturalHeight * k;
        c.filter = "sepia(.16) saturate(.9) contrast(.96) brightness(.95)";
        c.drawImage(photo, ax + (aw - pw) / 2, ay + (ah - ph) / 2, pw, ph);
        c.filter = "none";
        g = c.createLinearGradient(0, ay + ah * .55, 0, ay + ah); g.addColorStop(0, "rgba(11,16,48,0)"); g.addColorStop(1, "rgba(11,16,48,.85)");
        c.fillStyle = g; c.fillRect(ax, ay, aw, ah);
      } catch (e) { /* фото без CORS: остаётся ночная арка */ }
    } else if (o.variant === "capsule") {
      c.fillStyle = "#FFF7EA"; c.font = `italic 400 52px ${F}`;
      let y = ay + 250;
      (o.goals.length ? o.goals : [""]).slice(0, 3).forEach((goal) => {
        star(c, W / 2, y - 62, 15, true);
        wrap(c, goal, 520).slice(0, 3).forEach((ln, i) => c.fillText(ln, W / 2, y + i * 62));
        y += 188;
      });
    }
    c.restore();
    c.strokeStyle = foil(c, W / 2, aw); c.lineWidth = 4; arch(14); c.stroke();
    c.lineWidth = 1.5; arch(28); c.stroke();

    // Печать на нижнем крае арки
    seal(c, W / 2, ay + ah + 14, 84, o.mono, o.variant === "hero");

    // Имя, подпись, звёзды, подарок
    const ns = fit(c, o.name, (z) => `italic 400 ${z}px ${F}`, 800, 170);
    c.font = `italic 400 ${ns}px ${F}`;
    c.fillStyle = foil(c, W / 2, c.measureText(o.name).width);
    c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 20; c.fillText(o.name, W / 2, 1430); c.shadowBlur = 0;
    c.fillStyle = "#FFF7EA"; c.font = `italic 400 54px ${F}`; c.fillText(o.sub, W / 2, 1510);
    if (o.variant === "hero") {
      o.stars.forEach((on, i) => star(c, W / 2 - 5.5 * 62 + i * 62, 1590, 21, on));
      c.fillStyle = "#B8B3D9"; c.font = `500 28px ${S}`;
      c.fillText(`Собрано звёзд: ${o.stars.filter(Boolean).length} из 12`, W / 2, 1655);
    }
    c.fillStyle = "#F0D6A0"; c.font = `italic 400 42px ${F}`;
    wrap(c, o.note || "", 780).slice(0, 2).forEach((ln, i) => c.fillText(ln, W / 2, 1730 + i * 54));
    c.fillStyle = "#D9B26F"; c.font = `500 26px ${S}`;
    c.fillText(`${o.masthead} · 2027`, W / 2, 1830);

    try { return cv.toDataURL("image/png"); } catch (e) { return ""; }
  };

  // На телефоне открываем системное меню «Поделиться»: оттуда в сторис, а на компьютере остаётся скачивание
  document.addEventListener("click", (e) => {
    const a = e.target.closest("#download-story-btn,#download-capsule-btn");
    if (!a || !navigator.canShare || !String(a.href).startsWith("data:")) return;
    const bin = atob(a.href.split(",")[1]), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const file = new File([u], a.getAttribute("download") || "card.png", { type: "image/png" });
    if (!navigator.canShare({ files: [file] })) return;
    e.preventDefault();
    navigator.share({ files: [file], title: document.title }).catch(() => {});
  });
})();
