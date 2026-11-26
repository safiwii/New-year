// Проверка заказа: откройте сайт с «?check» в конце адреса, например index.html?check
(() => {
  if (!/[?&]check\b/.test(location.search) || typeof ISSUE_CONFIG === "undefined") return;
  const c = ISSUE_CONFIG, bad = [], ok = [];
  const need = (arr, min, max, label) => ((arr && arr.length >= min && arr.length <= max) ? ok : bad).push(`${label}: ${arr ? arr.length : 0} (нужно ${min}–${max})`);
  need(c.gallery, 8, 12, "Фото в ёлке"); need(c.voices, 3, 6, "Голоса и лица"); need(c.soundtrack, 5, 7, "Треки");
  need(c.stats, 6, 6, "Цифры года"); need(c.quiz, 6, 8, "Вопросы квиза"); need(c.cookies, 12, 20, "Печеньки"); need(c.advent, 12, 12, "Дверцы адвента");
  if (c.demoMode) bad.push("demoMode: true. Выключите перед отправкой");
  if (!c.heroNameDative) bad.push("Нет heroNameDative («Для Алины»)");
  if (new Date(c.unlockDate) < new Date()) bad.push("Дата открытия уже прошла");
  const urls = [];
  (function walk(v) {
    if (typeof v === "string") { if (/^(https?:|assets\/|\.\/).*\.(jpe?g|png|webp|gif|mp4|mov|webm|mp3|m4a|ogg|wav)|unsplash/i.test(v)) urls.push(v); }
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(c);
  const demo = urls.filter((u) => /unsplash/i.test(u));
  if (demo.length) bad.push(`Остались демо-фото Unsplash: ${demo.length} шт.`);
  Promise.all(urls.filter((u) => !/^https?:/.test(u)).map((u) =>
    fetch(u, { method: "HEAD" }).then((r) => {
      if (!r.ok) bad.push("Файл не найден: " + u);
      else if (+r.headers.get("content-length") > 25 * 1048576) bad.push("Больше 25 МиБ (Cloudflare не пропустит): " + u);
    }).catch(() => bad.push("Не открывается: " + u))
  )).then(() => {
    const p = document.createElement("div");
    p.style.cssText = "position:fixed;inset:12px;z-index:9999;overflow:auto;background:#FFF7EA;color:#1B1740;border:2px solid #D9B26F;padding:18px;font:15px/1.5 sans-serif;border-radius:4px";
    p.innerHTML = `<b style="font-size:18px">Проверка заказа: ${bad.length ? "есть что исправить" : "всё в порядке"}</b><ul style="padding-left:18px">` +
      bad.map((t) => `<li style="color:#C8324B">✕ ${t}</li>`).join("") + ok.map((t) => `<li>✓ ${t}</li>`).join("") +
      `<li>Проверено файлов: ${urls.length}</li></ul><button style="min-height:44px;padding:0 18px" onclick="this.parentNode.remove()">Закрыть</button>`;
    document.body.appendChild(p);
  });
})();
