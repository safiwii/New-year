document.addEventListener("DOMContentLoaded", () => {
  const cfg = ISSUE_CONFIG;
  const STORAGE_KEY = `midnight_issue_${cfg.heroName}`;

  // Состояние прогресса в localStorage
  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {
    stars: Array(12).fill(false), // 0..9 за 10 рубрик, 10..11 спрятаны
    unlocked: false,
    selectedGoals: [],
    futureLetter: "",
    claimedCoupons: []
  };

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // Начисление звезды с колокольчиком
  function earnStar(index) {
    if (index < 0 || index > 11 || state.stars[index]) return;
    state.stars[index] = true;
    saveState();
    soundFX.playStarChime();
    renderStarsUI();
  }

  function renderStarsUI() {
    const count = state.stars.filter(Boolean).length;
    document.getElementById("stars-count-text").textContent = `${count} / 12`;

    const board = document.getElementById("toc-stars-board");
    board.innerHTML = "";
    state.stars.forEach((earned, idx) => {
      const slot = document.createElement("div");
      slot.className = `star-slot ${earned ? "earned" : ""}`;
      slot.title = idx < 10 ? `Звезда за рубрику ${idx + 1}` : "Тайная звезда со страниц";
      slot.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="${earned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.5"><path d="M12 2L14.8 8.8L22 9.5L16.5 14.2L18.2 21.3L12 17.5L5.8 21.3L7.5 14.2L2 9.5L9.2 8.8L12 2Z"/></svg>`;
      board.appendChild(slot);
    });

    // Обновляем бонусный блок в финале
    const bonusCard = document.getElementById("bonus-stars-card");
    if (count === 12) {
      bonusCard.classList.remove("hidden");
      document.getElementById("bonus-title").textContent = cfg.finale.bonusTitle;
      document.getElementById("bonus-text").textContent = cfg.finale.bonusText;
    }
  }

  // --- ЗАПОЛНЕНИЕ КОНВЕРТА И ОБЛОЖКИ ---
  document.getElementById("env-recipient-name").textContent = `Для ${cfg.heroNameDative || cfg.heroName}`;
  document.getElementById("env-monogram").textContent = cfg.heroMonogram;
  document.getElementById("cover-photo").src = cfg.cover.photo;
  document.getElementById("cover-subtitle").textContent = cfg.issueSubtitle;
  document.getElementById("cover-masthead").textContent = cfg.magazineTitle;
  document.getElementById("cover-hero-name").textContent = cfg.heroName;
  document.getElementById("cover-monogram").textContent = cfg.heroMonogram;
  document.getElementById("finale-lock-monogram").textContent = cfg.heroMonogram;
  document.getElementById("flash-monogram").textContent = cfg.heroMonogram;
  document.getElementById("editorial-stamp").textContent = cfg.heroMonogram;
  document.getElementById("cover-seal-label").textContent = cfg.cover.sealText;

  const teasersList = document.getElementById("cover-teasers");
  cfg.cover.teasers.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    teasersList.appendChild(li);
  });

  if (cfg.demoMode) {
    document.getElementById("demo-unlock-btn").classList.remove("hidden");
  }

  // Открытие конверта
  const envBtn = document.getElementById("open-envelope-btn");
  envBtn.addEventListener("click", () => {
    document.getElementById("env-wax-seal").classList.add("broken");
    soundFX.startAmbient();
    soundFX.playPageFlip();
    setTimeout(() => {
      document.getElementById("envelope-screen").classList.add("opening");
      document.getElementById("magazine-stage").classList.remove("hidden");
    }, 350);
  });

  // --- УПРАВЛЕНИЕ ЗВУКОМ И АНИМАЦИЕЙ ---
  document.getElementById("sound-toggle-btn").addEventListener("click", () => {
    const muted = soundFX.toggleMute();
    document.getElementById("sound-icon-on").classList.toggle("hidden", muted);
    document.getElementById("sound-icon-off").classList.toggle("hidden", !muted);
  });

  document.getElementById("motion-toggle-btn").addEventListener("click", () => {
    document.body.classList.toggle("reduced-motion");
  });

  // --- НАВИГАЦИЯ ПО СТРАНИЦАМ (ТАП / СВАЙП / КНОПКИ) ---
  const pages = Array.from(document.querySelectorAll(".page"));
  let currentPage = 0;

  function goToPage(index) {
    if (index < 0 || index >= pages.length || index === currentPage) return;
    soundFX.playPageFlip();

    pages.forEach((p, idx) => {
      p.classList.remove("active", "flipped-out");
      if (idx < index) p.classList.add("flipped-out");
      if (idx === index) p.classList.add("active");
    });

    currentPage = index;
    document.getElementById("prev-page-btn").disabled = currentPage === 0;
    document.getElementById("next-page-btn").disabled = currentPage === pages.length - 1;
    document.getElementById("page-indicator").textContent = pages[currentPage].dataset.rubric;

    // Триггеры при входе на конкретную страницу
    if (currentPage === 5) startTypewriter();
    if (currentPage === 6) animateStatLine();
    if (currentPage === 12 && state.unlocked) renderStoriesCard();
  }

  document.getElementById("prev-page-btn").addEventListener("click", () => goToPage(currentPage - 1));
  document.getElementById("next-page-btn").addEventListener("click", () => goToPage(currentPage + 1));
  document.getElementById("toc-jump-btn").addEventListener("click", () => goToPage(1));

  // Свайп на сенсорных экранах
  let touchStartX = 0;
  let touchStartY = 0;
  const bookEl = document.getElementById("magazine-book");
  bookEl.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  bookEl.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) goToPage(currentPage + 1);
      else goToPage(currentPage - 1);
    }
  }, { passive: true });

  // --- СТРАНИЦА 1: СОДЕРЖАНИЕ ---
  const rubricsMeta = [
    { title: "Фотосессия года", page: 2 },
    { title: "Голоса и лица", page: 3 },
    { title: "Саундтрек года", page: 4 },
    { title: "Колонка редактора", page: 5 },
    { title: "Год в цифрах", page: 6 },
    { title: "Найди пару", page: 7 },
    { title: "Квиз номера", page: 8 },
    { title: "Банка с печеньками", page: 9 },
    { title: "Адвент-календарь", page: 10 },
    { title: "Желание на 2027", page: 11 }
  ];

  const tocList = document.getElementById("toc-list");
  rubricsMeta.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "toc-item";
    li.innerHTML = `<span class="toc-item-title">${idx + 1}. ${item.title}</span><span class="toc-item-page">0${item.page}</span>`;
    li.addEventListener("click", () => goToPage(item.page));
    tocList.appendChild(li);
  });

  // --- РУБРИКА 1: ЁЛКА И ШАРЫ ---
  const ornamentPositions = [
    { x: 50, y: 22 }, { x: 38, y: 34 }, { x: 62, y: 35 },
    { x: 32, y: 50 }, { x: 50, y: 48 }, { x: 68, y: 52 },
    { x: 26, y: 68 }, { x: 44, y: 66 }, { x: 60, y: 69 },
    { x: 75, y: 71 }, { x: 36, y: 82 }, { x: 64, y: 82 }
  ];

  const ornamentsLayer = document.getElementById("ornaments-layer");
  const openedOrnaments = new Set();

  cfg.gallery.slice(0, 12).forEach((photo, idx) => {
    const pos = ornamentPositions[idx];
    const btn = document.createElement("button");
    btn.className = "ornament-ball";
    btn.style.left = `${pos.x}%`;
    btn.style.top = `${pos.y}%`;
    btn.setAttribute("aria-label", photo.caption);
    btn.innerHTML = `<img src="${photo.src}" alt="" />`;

    btn.addEventListener("click", () => {
      document.getElementById("polaroid-img").src = photo.src;
      document.getElementById("polaroid-date").textContent = photo.date;
      document.getElementById("polaroid-text").textContent = photo.caption;
      document.getElementById("photo-modal").classList.remove("hidden");

      openedOrnaments.add(idx);
      if (openedOrnaments.size >= Math.min(3, cfg.gallery.length)) {
        earnStar(0);
      }
    });
    ornamentsLayer.appendChild(btn);
  });

  document.getElementById("close-photo-modal").addEventListener("click", () => {
    document.getElementById("photo-modal").classList.add("hidden");
  });

  // --- РУБРИКА 2: ГОЛОСА И ЛИЦА ---
  const voicesAvatars = document.getElementById("voices-avatars");
  const voiceCard = document.getElementById("voice-player-card");

  cfg.voices.forEach((person, idx) => {
    const btn = document.createElement("button");
    btn.className = "voice-avatar-btn";
    btn.innerHTML = `<img src="${person.avatar}" alt="${person.name}" /><span>${person.name}</span>`;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".voice-avatar-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      earnStar(1);

      if (person.type === "video" && person.src) {
        voiceCard.innerHTML = `
          <video class="voice-video" src="${person.src}" controls autoplay playsinline></video>
          <p><strong>${person.name}</strong> · ${person.role}</p>
          <p style="margin-top:6px; font-style:italic;">«${person.transcript}»</p>
        `;
      } else {
        voiceCard.innerHTML = `
          <p><strong>${person.name}</strong> · ${person.role}</p>
          <div class="voice-wave" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          ${person.src ? `<audio src="${person.src}" controls autoplay style="width:100%; margin-bottom:10px;"></audio>` : ""}
          <p style="font-style:italic;">«${person.transcript}»</p>
        `;
      }
    });
    voicesAvatars.appendChild(btn);
  });

  // --- РУБРИКА 3: ВИНИЛОВЫЙ ПЛЕЕР ---
  const tracklistEl = document.getElementById("tracklist");
  const vinylDisc = document.getElementById("vinyl-disc");
  let activeAudio = null;

  function selectTrack(idx) {
    const track = cfg.soundtrack[idx];
    document.getElementById("vinyl-cover-img").src = track.cover;
    document.getElementById("vinyl-track-title").textContent = track.title;
    document.getElementById("vinyl-track-artist").textContent = track.artist;
    document.getElementById("vinyl-track-why").textContent = `«${track.why}»`;

    document.querySelectorAll(".track-row").forEach((r, i) => r.classList.toggle("active", i === idx));
    vinylDisc.classList.add("spinning");
    earnStar(2);

    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }
    if (track.audioSrc) {
      activeAudio = new Audio(track.audioSrc);
      activeAudio.play().catch(() => {});
    }
  }

  cfg.soundtrack.forEach((track, idx) => {
    const li = document.createElement("li");
    li.className = "track-row";
    li.innerHTML = `
      <div class="track-meta">
        <strong>${track.title}</strong>
        <span>${track.artist}</span>
      </div>
      <span style="color:var(--foil); font-size:14px;">Слушать</span>
    `;
    li.addEventListener("click", () => selectTrack(idx));
    tracklistEl.appendChild(li);
  });
  if (cfg.soundtrack.length) {
    document.getElementById("vinyl-cover-img").src = cfg.soundtrack[0].cover;
  }

  // --- РУБРИКА 4: КОЛОНКА РЕДАКТОРА (ПЕЧАТНАЯ МАШИНКА) ---
  let typewriterDone = false;
  function startTypewriter() {
    if (typewriterDone) return;
    typewriterDone = true;

    document.getElementById("editorial-salutation").textContent = cfg.editorial.salutation;
    document.getElementById("editorial-sign").textContent = cfg.editorial.signature;
    const bodyEl = document.getElementById("editorial-body");
    const fullText = cfg.editorial.text;

    if (document.body.classList.contains("reduced-motion")) {
      bodyEl.textContent = fullText;
      earnStar(3);
      return;
    }

    let pos = 0;
    const timer = setInterval(() => {
      bodyEl.textContent = fullText.slice(0, pos + 2);
      if (pos % 8 === 0) soundFX.playTypeClick();
      pos += 2;
      if (pos >= fullText.length) {
        clearInterval(timer);
        earnStar(3);
      }
    }, 24);
  }

  // --- РУБРИКА 5: ГОД В ЦИФРАХ ---
  let currentStat = 0;
  const statDots = document.getElementById("stat-dots");

  function showStat(idx) {
    currentStat = idx;
    const item = cfg.stats[idx];
    document.getElementById("stat-number").textContent = item.number;
    document.getElementById("stat-label").textContent = item.label;
    document.getElementById("stat-detail").textContent = item.detail;

    const line = document.getElementById("stat-gold-line");
    line.classList.remove("drawn");
    requestAnimationFrame(() => line.classList.add("drawn"));

    document.querySelectorAll(".stat-dot-btn").forEach((d, i) => d.classList.toggle("active", i === idx));
    if (idx === cfg.stats.length - 1) earnStar(4);
  }

  function animateStatLine() {
    showStat(currentStat);
  }

  cfg.stats.forEach((_, idx) => {
    const dot = document.createElement("button");
    dot.className = "stat-dot-btn";
    dot.setAttribute("aria-label", `Факт ${idx + 1}`);
    dot.addEventListener("click", () => showStat(idx));
    statDots.appendChild(dot);
  });
  showStat(0);

  // --- РУБРИКА 6: НАЙДИ ПАРУ ---
  const memoryGrid = document.getElementById("memory-grid");
  const pairPhotos = cfg.gallery.slice(0, cfg.memoryPairsCount);
  const deck = [...pairPhotos, ...pairPhotos]
    .map((item, idx) => ({ ...item, pairId: idx % pairPhotos.length }))
    .sort(() => Math.random() - 0.5);

  let flippedCards = [];
  let matchedPairs = 0;

  deck.forEach((cardData) => {
    const card = document.createElement("button");
    card.className = "memory-card";
    card.innerHTML = `<img src="${cardData.src}" alt="" />`;

    card.addEventListener("click", () => {
      if (card.classList.contains("open") || card.classList.contains("matched") || flippedCards.length === 2) return;
      card.classList.add("open");
      flippedCards.push({ el: card, pairId: cardData.pairId });

      if (flippedCards.length === 2) {
        const [a, b] = flippedCards;
        if (a.pairId === b.pairId) {
          a.el.classList.add("matched");
          b.el.classList.add("matched");
          flippedCards = [];
          matchedPairs++;
          if (matchedPairs === pairPhotos.length) {
            document.getElementById("memory-status").textContent = "Все пары найдены! Звезда ваша.";
            earnStar(5);
            launchConfetti(false);
          }
        } else {
          setTimeout(() => {
            a.el.classList.remove("open");
            b.el.classList.remove("open");
            flippedCards = [];
          }, 650);
        }
      }
    });
    memoryGrid.appendChild(card);
  });

  // --- РУБРИКА 7: КВИЗ ---
  const quizBox = document.getElementById("quiz-box");
  let quizIdx = 0;
  let quizScore = 0;

  function renderQuiz() {
    if (quizIdx >= cfg.quiz.length) {
      const res = [...cfg.quizResults].reverse().find((r) => quizScore >= r.minScore) || cfg.quizResults[0];
      quizBox.innerHTML = `
        <div class="quiz-result-plaque">
          <p class="cert-kicker">Результат: ${quizScore} из ${cfg.quiz.length}</p>
          <h3 class="cert-title foil-text">${res.title}</h3>
          <p>${res.desc}</p>
        </div>
      `;
      earnStar(6);
      return;
    }

    const q = cfg.quiz[quizIdx];
    quizBox.innerHTML = `
      <p style="font-size:14px; opacity:0.7; margin-bottom:6px;">Вопрос ${quizIdx + 1} из ${cfg.quiz.length}</p>
      <h3 class="quiz-question">${q.question}</h3>
      <div class="quiz-options"></div>
      <div class="quiz-feedback hidden" id="quiz-fb"></div>
    `;

    const optsWrap = quizBox.querySelector(".quiz-options");
    q.options.forEach((optText, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-opt-btn";
      btn.textContent = optText;
      btn.addEventListener("click", () => {
        if (optsWrap.dataset.answered) return;
        optsWrap.dataset.answered = "1";

        const fb = document.getElementById("quiz-fb");
        fb.classList.remove("hidden");
        if (i === q.correctIndex) {
          btn.classList.add("correct");
          quizScore++;
          fb.textContent = "Точно в цель! Золотая галочка.";
        } else {
          btn.classList.add("wrong");
          optsWrap.children[q.correctIndex].classList.add("correct");
          fb.textContent = q.roast;
        }
        setTimeout(() => {
          quizIdx++;
          renderQuiz();
        }, 1350);
      });
      optsWrap.appendChild(btn);
    });
  }
  renderQuiz();

  // --- РУБРИКА 8: БАНКА С ПЕЧЕНЬКАМИ ---
  let cookiePointer = 0;
  const fortuneSlip = document.getElementById("fortune-slip");
  const savedCouponsWrap = document.getElementById("saved-coupons");

  document.getElementById("crack-cookie-btn").addEventListener("click", () => {
    soundFX.playCookieCrack();
    const jb = document.getElementById("crack-cookie-btn");
    jb.classList.remove("cracking"); void jb.offsetWidth; jb.classList.add("cracking");
    earnStar(7);

    const item = cfg.cookies[cookiePointer % cfg.cookies.length];
    cookiePointer++;

    fortuneSlip.classList.remove("hidden");
    fortuneSlip.style.animation = "none"; void fortuneSlip.offsetWidth; fortuneSlip.style.animation = "";
    if (item.type === "coupon") {
      fortuneSlip.innerHTML = `<strong>Купон: ${item.title}</strong><p style="margin-top:4px;">${item.text}</p>`;
      if (!state.claimedCoupons.includes(item.title)) {
        state.claimedCoupons.push(item.title);
        saveState();
        renderCoupons();
      }
    } else {
      fortuneSlip.innerHTML = `<p>${item.text}</p>`;
    }
  });

  function renderCoupons() {
    savedCouponsWrap.innerHTML = "";
    state.claimedCoupons.forEach((title) => {
      const found = cfg.cookies.find((c) => c.title === title);
      if (!found) return;
      const div = document.createElement("div");
      div.className = "coupon-ticket";
      div.innerHTML = `<strong>${found.title}</strong><span>${found.text}</span>`;
      savedCouponsWrap.appendChild(div);
    });
  }
  renderCoupons();

  // --- РУБРИКА 9: АДВЕНТ-КАЛЕНДАРЬ ---
  const adventGrid = document.getElementById("advent-grid");
  const adventCard = document.getElementById("advent-detail-card");
  const todayDate = new Date();
  const currentMonth = todayDate.getMonth(); // 11 = декабрь
  const currentDay = todayDate.getDate();

  cfg.advent.forEach((door) => {
    const btn = document.createElement("button");
    // В декабре блокируем будущие числа; в остальные месяцы (для демо) открыты все
    const isFuture = currentMonth === 11 && door.day > currentDay && !cfg.demoMode;
    const isToday = currentMonth === 11 && door.day === currentDay;

    btn.className = `advent-door ${isToday ? "today" : ""} ${isFuture ? "locked" : ""}`;
    btn.innerHTML = `<span>${door.day}</span><small style="font-size:11px; font-family:var(--font-sans);">дек</small>`;

    btn.addEventListener("click", () => {
      if (isFuture) return;
      earnStar(8);
      adventCard.classList.remove("hidden");
      adventCard.innerHTML = `
        <span class="polaroid-date">${door.title} · ${door.kind}</span>
        <p style="margin-top:6px; font-size:17px;">${door.content}</p>
      `;
    });
    adventGrid.appendChild(btn);
  });

  // --- ТАЙНЫЕ ЗВЁЗДЫ (№11 и №12) ---
  document.querySelectorAll(".hidden-star-btn").forEach((btn) => {
    const starIdx = Number(btn.dataset.secretStar);
    if (state.stars[starIdx]) btn.classList.add("found");
    btn.addEventListener("click", () => {
      btn.classList.add("found");
      earnStar(starIdx);
    });
  });

  // --- РУБРИКА 10: ЦЕЛИ НА 2027 И ПИСЬМО В БУДУЩЕЕ ---
  const goalsWrap = document.getElementById("goals-stickers");
  const letterInput = document.getElementById("future-letter-input");
  letterInput.value = state.futureLetter || "";

  cfg.goals2027.forEach((goal) => {
    const chip = document.createElement("button");
    chip.className = `goal-chip ${state.selectedGoals.includes(goal) ? "selected" : ""}`;
    chip.textContent = goal;

    chip.addEventListener("click", () => {
      if (state.selectedGoals.includes(goal)) {
        state.selectedGoals = state.selectedGoals.filter((g) => g !== goal);
      } else if (state.selectedGoals.length < 3) {
        state.selectedGoals.push(goal);
      }
      saveState();
      document.querySelectorAll(".goal-chip").forEach((c) => {
        c.classList.toggle("selected", state.selectedGoals.includes(c.textContent));
      });
    });
    goalsWrap.appendChild(chip);
  });

  document.getElementById("seal-future-btn").addEventListener("click", () => {
    state.futureLetter = letterInput.value.trim();
    saveState();
    earnStar(9);

    const dataUrl = generatePngCard({
      kicker: "Капсула времени · 2027",
      title: cfg.heroName,
      lines: state.selectedGoals.length ? state.selectedGoals : ["Три главные мечты нового года"],
      footer: state.futureLetter ? "Письмо себе запечатано до декабря 2027" : cfg.magazineTitle
    });

    document.getElementById("capsule-card-preview").src = dataUrl;
    document.getElementById("download-capsule-btn").href = dataUrl;
    document.getElementById("capsule-result").classList.remove("hidden");
  });

  // --- ТАЙМЕР ДО 00:00 И ВСКРЫТИЕ ПЕЧАТИ ---
  const targetTimestamp = new Date(cfg.unlockDate).getTime();

  function triggerMidnightUnlock() {
    if (state.unlocked) return;
    state.unlocked = true;
    saveState();

    document.getElementById("cover-wax-seal").classList.add("broken");
    document.getElementById("countdown-digits").textContent = "00:00:00";

    const flash = document.getElementById("midnight-flash");
    flash.classList.remove("hidden");
    soundFX.playChimes12();
    launchConfetti(true);

    setTimeout(() => {
      flash.classList.add("hidden");
      applyUnlockedFinale();
      goToPage(12);
    }, 3400);
  }

  function applyUnlockedFinale() {
    document.getElementById("cover-wax-seal").classList.add("broken");
    document.getElementById("finale-locked").classList.add("hidden");
    document.getElementById("finale-unlocked").classList.remove("hidden");

    document.getElementById("finale-heading").textContent = cfg.finale.heading;
    document.getElementById("finale-message").textContent = cfg.finale.message;
    document.getElementById("finale-gift-title").textContent = cfg.finale.giftTitle;
    document.getElementById("finale-gift-subtitle").textContent = cfg.finale.giftSubtitle;
    document.getElementById("finale-gift-code").textContent = cfg.finale.giftCode;

    if (cfg.finale.videoSrc) {
      const wrap = document.getElementById("finale-video-wrap");
      wrap.classList.remove("hidden");
      document.getElementById("finale-video").src = cfg.finale.videoSrc;
    }

    renderStoriesCard();
    renderStarsUI();
  }

  function renderStoriesCard() {
    const starsTotal = state.stars.filter(Boolean).length;
    const url = generatePngCard({
      kicker: "Полночный выпуск · 2027",
      title: `Героиня номера: ${cfg.heroName}`,
      lines: [
        `Собрано звёзд выпуска: ${starsTotal} из 12`,
        cfg.finale.giftTitle
      ],
      footer: "Специальное коллекционное издание"
    });
    document.getElementById("hero-story-preview").src = url;
    document.getElementById("download-story-btn").href = url;
  }

  document.getElementById("demo-unlock-btn").addEventListener("click", triggerMidnightUnlock);

  setInterval(() => {
    if (state.unlocked) return;
    const diff = targetTimestamp - Date.now();
    if (diff <= 0) {
      triggerMidnightUnlock();
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    const word = d % 10 === 1 && d % 100 !== 11 ? "день" : [2, 3, 4].includes(d % 10) && ![12, 13, 14].includes(d % 100) ? "дня" : "дней";
    const formatted = (d > 0 ? `<span class="cd-days">${d} ${word}</span>` : "") + `${h}:${m}:${s}`;
    document.getElementById("countdown-digits").innerHTML = formatted;
    document.getElementById("finale-countdown").innerHTML = formatted;
  }, 1000);

  if (state.unlocked) {
    applyUnlockedFinale();
  }

  // --- ГЕНЕРАТОР PNG-ОТКРЫТОК (ДЛЯ КАПСУЛЫ И ДЛЯ СТОРИС) ---
  function generatePngCard({ kicker, title, lines, footer }) {
    const hero = title.startsWith("Героиня");
    return window.drawStoryCard({
      variant: hero ? "hero" : "capsule",
      kicker: hero ? "Специальный новогодний номер" : kicker,
      masthead: cfg.magazineTitle, name: cfg.heroName, mono: cfg.heroMonogram,
      sub: hero ? "Героиня номера" : "Мои три цели на 2027",
      goals: hero ? [] : lines, stars: state.stars,
      note: hero ? lines[1] : footer
    });
  }

  // --- ТИХИЙ СНЕГ НА НОЧНЫХ СТРАНИЦАХ И САЛЮТ ---
  const snowCanvas = document.getElementById("snow-canvas");
  const sCtx = snowCanvas.getContext("2d");
  let snowflakes = [];

  function resizeCanvases() {
    snowCanvas.width = window.innerWidth;
    snowCanvas.height = window.innerHeight;
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;
  }

  for (let i = 0; i < 42; i++) {
    snowflakes.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 1 + Math.random() * 2.2,
      vy: 0.35 + Math.random() * 0.65,
      vx: -0.25 + Math.random() * 0.5
    });
  }

  const fwCanvas = document.getElementById("fireworks-canvas");
  const fCtx = fwCanvas.getContext("2d");
  let particles = [];

  function launchConfetti(isBigFirework) {
    if (document.body.classList.contains("reduced-motion")) return;
    const bursts = isBigFirework ? 6 : 2;
    for (let b = 0; b < bursts; b++) {
      const cx = window.innerWidth * (0.2 + Math.random() * 0.6);
      const cy = window.innerHeight * (0.2 + Math.random() * 0.4);
      for (let i = 0; i < 48; i++) {
        const angle = (Math.PI * 2 * i) / 48;
        const speed = 2 + Math.random() * 5.5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: i % 3 === 0 ? "#C8324B" : "#F0D6A0"
        });
      }
    }
  }

  function animationLoop() {
    sCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    const isNightPage = pages[currentPage]?.classList.contains("page-night");
    if (isNightPage && !document.body.classList.contains("reduced-motion")) {
      sCtx.fillStyle = "rgba(255, 247, 234, 0.45)";
      snowflakes.forEach((f) => {
        f.y += f.vy;
        f.x += f.vx;
        if (f.y > snowCanvas.height) f.y = -5;
        if (f.x > snowCanvas.width) f.x = 0;
        if (f.x < 0) f.x = snowCanvas.width;
        sCtx.beginPath();
        sCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        sCtx.fill();
      });
    }

    fCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
    particles = particles.filter((p) => p.alpha > 0.02);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.alpha *= 0.965;
      fCtx.globalAlpha = p.alpha;
      fCtx.fillStyle = p.color;
      fCtx.fillRect(p.x, p.y, 5, 5);
    });
    fCtx.globalAlpha = 1;

    requestAnimationFrame(animationLoop);
  }

  window.addEventListener("resize", resizeCanvases);
  resizeCanvases();
  renderStarsUI();
  animationLoop();
});
