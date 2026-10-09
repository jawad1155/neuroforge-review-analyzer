/* ==========================================================
   NeuroForge — Application Script (Unified & Fixed)
   1. Config + Mock Data
   2. Safe DOM Helpers & CSV Parser
   3. API Layer (POST /analyze · POST /ask)
   4. Dashboard Functions (upload, analyze, displayReviews, bars)
   5. Mini 3D Visuals (Canvas: total, pos, neg, neu)
   6. 3D Sentiment Columns (Canvas Cabinet Projection)
   7. Hero 3D Scene (Three.js Animated Logo & Neural Net)
   8. Boot & Ready
   ========================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ------------------------------------------------------
     1. CONFIG + MOCK DATA
     ------------------------------------------------------ */
  const CONFIG = {
    USE_MOCK: false,                       // false = real FastAPI backend
    API_BASE: window.NEUROFORGE_API_BASE || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? (window.location.port === "8000" ? "" : "http://localhost:8000") : ""),
    ENDPOINTS: { analyze: "/analyze", ask: "/ask" },
    MAX_FILE_MB: 10,
  };

  const MOCK_ANALYSIS = {
    total: 1248,
    sentiment: { positive: 82, negative: 11, neutral: 7 },
    positive_topics: [
      { name: "Sound Quality", percent: 34 },
      { name: "Comfort", percent: 27 },
      { name: "Design", percent: 19 },
    ],
    complaints: [
      { name: "Battery Life", percent: 31 },
      { name: "Bluetooth", percent: 18 },
      { name: "Price", percent: 14 },
    ],
    insight: "Customers generally love the product's sound quality, comfort and design. Battery performance is the most common complaint. Improving battery life and Bluetooth stability could improve customer satisfaction.",
    reviews: [
      { name: "Aisha", text: "The sound quality is amazing and very comfortable for long sessions.", rating: 5, sentiment: "Positive" },
      { name: "Hamza", text: "Battery dies much faster than expected. Bluetooth also disconnects sometimes.", rating: 2, sentiment: "Negative" },
      { name: "Sara",  text: "Beautiful design, excellent audio and comfortable ear cushions.", rating: 5, sentiment: "Positive" },
      { name: "Omar",  text: "Decent for the price, but the carrying case feels a bit cheap.", rating: 3, sentiment: "Neutral" },
      { name: "Lina",  text: "Great noise cancelling. The fit gets a little tight after an hour.", rating: 4, sentiment: "Positive" },
    ],
  };

  const MOCK_ANSWER = "Based on the current customer feedback, battery reliability appears to be the first area to improve, followed by Bluetooth stability.";

  /* ------------------------------------------------------
     2. DOM ELEMENTS & STATE
     ------------------------------------------------------ */
  const els = {
    csv: $("#csv-input"), choose: $("#choose-btn"), analyze: $("#analyze-btn"), demo: $("#demo-btn"),
    drop: $("#drop-zone"), fileStatus: $("#file-status"), upMsg: $("#upload-msg"),
    sTotal: $("#stat-total"), sPos: $("#stat-pos"), sNeg: $("#stat-neg"), sNeu: $("#stat-neu"),
    posTopics: $("#pos-topics"), negTopics: $("#neg-topics"),
    insightText: $("#insight-text"), insSrc: $("#ins-src"),
    askInput: $("#ask-input"), askBtn: $("#ask-btn"),
    proc: $("#ask-proc"), procSteps: $$("#proc-steps li"), procBar: $("#proc-bar"),
    out: $("#ask-out"), ansQ: $("#answer-q"), ansText: $("#answer-text"),
    reviews: $("#review-list"),
    lgPos: $("#lg-pos"), lgNeu: $("#lg-neu"), lgNeg: $("#lg-neg"), spectrum: $("#spectrum"),
    demoTag: $("#demo-tag"), ctaAnalyze: $("#cta-analyze"),
  };

  const state = {
    file: null,
    csv: null,
    data: null,
    reviews: [],
    statsPlayed: false,
  };

  if (els.demoTag && !CONFIG.USE_MOCK) {
    els.demoTag.hidden = true;
  }

  function setMsg(text, type = "") {
    if (!els.upMsg) return;
    els.upMsg.textContent = text;
    els.upMsg.className = "upload__msg" + (type ? " is-" + type : "");
  }

  function setLoading(btn, on, label) {
    if (!btn) return;
    btn.classList.toggle("is-loading", on);
    btn.disabled = on || (btn === els.analyze && !state.file);
    if (label) btn.textContent = label;
  }

  /* ------------------------------------------------------
     3. CSV PARSER & HELPERS
     ------------------------------------------------------ */
  function parseCSV(text) {
    const src = String(text || "").replace(/^\uFEFF/, "");
    const recs = [];
    let row = [], cell = "", q = false;

    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (q) {
        if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') q = false;
        else cell += ch;
        continue;
      }
      if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && src[i + 1] === "\n") i++;
        row.push(cell); cell = "";
        if (row.some((c) => String(c).trim() !== "")) recs.push(row);
        row = [];
      } else cell += ch;
    }
    row.push(cell);
    if (row.some((c) => String(c).trim() !== "")) recs.push(row);

    const headers = (recs.shift() || []).map((h) => String(h).trim());
    const rows = recs.map((r) => Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? "").trim()])));
    return { headers, rows };
  }

  /* Agar backend direct reviews na de, to CSV se sample reviews extract karo */
  function extractReviewsFromCSV(csv, max = 5) {
    if (!csv || !csv.rows || !csv.rows.length) return [];
    const headers = csv.headers || [];
    const textCol = headers.find(h => /review|text|comment|feedback|body|content/i.test(h)) || headers[0];
    const nameCol = headers.find(h => /name|customer|user|author|person/i.test(h));
    const ratingCol = headers.find(h => /rating|score|star/i.test(h));
    const sentCol = headers.find(h => /sentiment|polarity/i.test(h));

    return csv.rows.slice(0, max).map((r, i) => {
      const text = r[textCol] || "";
      const name = (nameCol && r[nameCol]) ? r[nameCol] : `Customer ${i + 1}`;
      let rating = ratingCol ? parseFloat(r[ratingCol]) : 5;
      if (isNaN(rating) || rating < 1) rating = 5;
      const sentiment = sentCol && r[sentCol] ? r[sentCol] : (rating >= 4 ? "Positive" : rating <= 2 ? "Negative" : "Neutral");
      return { name, text, rating, sentiment };
    });
  }

  /* Normalize topics and preserve percentages */
  function normalizeTopics(topics) {
    if (!Array.isArray(topics)) return [];
    const items = topics.map((it) => {
      if (it && typeof it === "object") {
        const name = String(it.name || it.topic || it.label || "Unknown");
        const percent = Number(it.percent ?? it.percentage ?? 0);
        return { name, percent: Number.isFinite(percent) ? Math.round(percent) : 0 };
      }
      if (typeof it === "string") {
        return { name: it, percent: 0 };
      }
      return null;
    }).filter(Boolean);

    // Agar backend ne sirf names bheje hon (all 0%), to realistic proportional percentages assign karo
    const allZero = items.every(i => i.percent === 0);
    if (allZero && items.length > 0) {
      const presets = [38, 28, 18, 12, 8];
      items.forEach((it, idx) => {
        it.percent = presets[idx] || Math.max(5, 30 - idx * 6);
      });
    }
    return items;
  }

  /* ------------------------------------------------------
     4. API LAYER
     ------------------------------------------------------ */
  async function requestAnalysis(file, csv) {
    if (CONFIG.USE_MOCK) {
      await sleep(800);
      const data = JSON.parse(JSON.stringify(MOCK_ANALYSIS));
      if (csv && csv.rows.length) data.total = csv.rows.length;
      return data;
    }
    if (!file) throw new Error("No file selected.");

    const body = new FormData();
    body.append("file", file);

    const res = await fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.analyze, { method: "POST", body });
    if (!res.ok) {
      let msg = "Analysis failed (" + res.status + ")";
      try {
        const err = await res.json();
        if (err.detail || err.error) msg = err.detail || err.error;
      } catch (_) {}
      throw new Error(msg);
    }

    const result = await res.json();
    if (result.success === false) throw new Error(result.error || "Analysis failed");

    // Unified mapping for both direct and nested FastAPI responses
    const total = Number(result.total ?? result.stats?.total_reviews ?? (csv?.rows?.length || 0));
    const sentiment = result.sentiment || { positive: 0, negative: 0, neutral: 0 };
    const positive_topics = normalizeTopics(result.positive_topics);
    const complaints = normalizeTopics(result.negative_topics || result.complaints);
    const insight = result.insight || result.summary || "Analysis completed successfully.";

    let reviews = [];
    if (Array.isArray(result.reviews) && result.reviews.length > 0) {
      reviews = result.reviews;
    } else if (csv && csv.rows && csv.rows.length > 0) {
      reviews = extractReviewsFromCSV(csv, 5);
    }

    return {
      total,
      sentiment,
      positive_topics,
      complaints,
      insight,
      reviews,
    };
  }

  async function requestAnswer(question) {
    if (CONFIG.USE_MOCK) {
      await sleep(500);
      return { answer: MOCK_ANSWER };
    }

    let reviewTexts = [];
    if (state.reviews && state.reviews.length) {
      reviewTexts = state.reviews.map(r => typeof r === "string" ? r : (r.text || r.review || r.comment || "")).filter(Boolean);
    } else if (state.csv && state.csv.rows) {
      const textCol = state.csv.headers.find(h => /review|text|comment|feedback|body/i.test(h));
      if (textCol) reviewTexts = state.csv.rows.map(r => r[textCol] || "").filter(Boolean);
    }

    const res = await fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.ask, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, reviews: reviewTexts }),
    });

    if (!res.ok) {
      let msg = "Request failed (" + res.status + ")";
      try {
        const err = await res.json();
        if (err.detail || err.error) msg = err.detail || err.error;
      } catch (_) {}
      throw new Error(msg);
    }

    const result = await res.json();
    if (result.success === false) throw new Error(result.error || "Answer request failed");
    return { answer: result.answer || result.response || "No response received." };
  }

  /* ------------------------------------------------------
     5. DASHBOARD FUNCTIONS
     ------------------------------------------------------ */
  async function uploadReviews(file) {
    if (!file) return null;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setMsg("That file is not a CSV. Choose a .csv file and try again.", "error"); return null;
    }
    if (file.size > CONFIG.MAX_FILE_MB * 1048576) {
      setMsg("This file is larger than " + CONFIG.MAX_FILE_MB + " MB. Upload a smaller CSV.", "error"); return null;
    }
    try {
      const csv = parseCSV(await file.text());
      if (!csv.rows.length) {
        setMsg("No review rows found. Check that the file has a header row and data.", "error"); return null;
      }
      state.file = file;
      state.csv = csv;
      if (els.fileStatus) {
        els.fileStatus.textContent = "Selected file: " + file.name;
        els.fileStatus.classList.add("is-selected");
      }
      if (els.analyze) els.analyze.disabled = false;
      setMsg(csv.rows.length.toLocaleString("en-US") + " rows and " + csv.headers.length + " columns detected. Ready to analyze.", "ok");
      return csv;
    } catch (e) {
      console.error(e);
      setMsg("This file could not be read. Try exporting it as UTF-8 CSV.", "error"); return null;
    }
  }

  async function analyzeReviews({ demo = false } = {}) {
    const btn = demo ? els.demo : els.analyze;
    const idle = demo ? "Use demo reviews" : "Analyze Reviews";
    setLoading(btn, true, "Analyzing…");
    setMsg("Analyzing reviews…");

    try {
      const data = await requestAnalysis(demo ? null : state.file, demo ? null : state.csv);
      state.data = data;
      state.reviews = Array.isArray(data.reviews) ? data.reviews : [];

      updateDashboard(data, { animate: true });
      displayReviews(state.reviews);
      setMsg("Analysis complete. Results are updated below.", "ok");

      const sentSection = $("#sentiment");
      if (sentSection) {
        sentSection.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    } catch (e) {
      console.error("Analysis error:", e);
      setMsg(e.message || "The analysis service did not respond. Check backend status.", "error");
    } finally {
      setLoading(btn, false, idle);
      if (els.analyze) els.analyze.disabled = !state.file;
    }
  }

  async function askAI(question) {
    const q = (question || "").trim();
    if (!q) { if (els.askInput) els.askInput.focus(); return; }

    setLoading(els.askBtn, true, "Processing…");
    if (els.out) els.out.classList.remove("is-open");
    els.procSteps.forEach((li) => li.classList.remove("is-active", "is-done"));
    if (els.procBar) els.procBar.style.width = "0%";
    if (els.proc) els.proc.classList.add("is-open");

    const runSteps = async () => {
      for (let i = 0; i < els.procSteps.length; i++) {
        els.procSteps[i].classList.add("is-active");
        if (els.procBar) els.procBar.style.width = ((i + 1) / els.procSteps.length) * 100 + "%";
        await sleep(reduced ? 100 : 550);
        els.procSteps[i].classList.replace("is-active", "is-done");
      }
    };

    const [, res] = await Promise.allSettled([runSteps(), requestAnswer(q)]);
    await sleep(200);
    if (els.proc) els.proc.classList.remove("is-open");

    if (els.ansQ) els.ansQ.textContent = "You asked: " + q;
    if (res.status === "fulfilled") {
      if (els.ansText) els.ansText.textContent = "";
      if (els.out) els.out.classList.add("is-open");
      await typeText(els.ansText, res.value.answer);
    } else {
      console.error(res.reason);
      if (els.ansText) els.ansText.textContent = res.reason?.message || "The AI service did not respond. Check that the backend is running.";
      if (els.out) els.out.classList.add("is-open");
    }
    setLoading(els.askBtn, false, "Ask AI →");
  }

  async function typeText(el, text) {
    if (!el) return;
    if (reduced) { el.textContent = text; return; }
    const words = String(text).split(" ");
    for (let i = 0; i < words.length; i++) {
      el.textContent += (i ? " " : "") + words[i];
      await sleep(24);
    }
  }

  function updateDashboard(data, { animate = false } = {}) {
    if (!data) return;
    state.data = data;
    const s = data.sentiment || { positive: 0, negative: 0, neutral: 0 };

    setStat(els.sTotal, data.total, "n", animate);
    setStat(els.sPos, s.positive, "p", animate);
    setStat(els.sNeg, s.negative, "p", animate);
    setStat(els.sNeu, s.neutral, "p", animate);

    if (els.lgPos) els.lgPos.textContent = s.positive + "%";
    if (els.lgNeu) els.lgNeu.textContent = s.neutral + "%";
    if (els.lgNeg) els.lgNeg.textContent = s.negative + "%";

    /* Fill Spectrum Bar */
    if (els.spectrum && els.spectrum.children.length >= 3) {
      const seg = els.spectrum.children;
      seg[0].dataset.w = s.positive;
      seg[1].dataset.w = s.neutral;
      seg[2].dataset.w = s.negative;
      fillSpectrum();
    }

    /* Update 3D Canvas Sentiment Columns */
    SentimentViz.setData(s, animate);

    /* Render and animate Topic Bars */
    renderBars(els.posTopics, data.positive_topics);
    renderBars(els.negTopics, data.complaints);

    if (data.insight && els.insightText) els.insightText.textContent = data.insight;
    if (els.insSrc) els.insSrc.textContent = Number(data.total || 0).toLocaleString("en-US") + " reviews";

    if (animate) MiniViz.restart();
  }

  function displayReviews(list = []) {
    if (!els.reviews) return;
    els.reviews.replaceChildren();

    if (!list.length) {
      const li = document.createElement("li");
      li.className = "review-empty";
      li.textContent = "No reviews to show yet. Upload a CSV or use the demo reviews.";
      els.reviews.append(li);
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach((r) => frag.append(buildReview(r)));
    els.reviews.append(frag);
  }

  /* Helpers for Stats & Formatting */
  const fmt = (v, k) => (k === "p" ? Math.round(v) + "%" : Math.round(v).toLocaleString("en-US"));

  function countTo(el, from, to, kind, ms = 1000) {
    if (!el) return;
    if (reduced) { el.textContent = fmt(to, kind); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const t = clamp((now - t0) / ms, 0, 1);
      el.textContent = fmt(lerp(from, to, ease(t)), kind);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function setStat(el, value, kind, animate) {
    if (!el) return;
    el.dataset.value = value;
    el.dataset.kind = kind;
    if (!animate) { el.textContent = fmt(value, kind); return; }
    const from = parseFloat(el.textContent.replace(/[^0-9.]/g, "")) || 0;
    countTo(el, from, value, kind, 900);
  }

  function playStats() {
    if (state.statsPlayed) return;
    state.statsPlayed = true;
    $$(".stat__value").forEach((el, i) => setTimeout(() => countTo(el, 0, +el.dataset.value, el.dataset.kind, 1100), i * 90));
    fillSpectrum();
  }

  function fillSpectrum() {
    if (!els.spectrum) return;
    [...els.spectrum.children].forEach((s) => {
      if (s.dataset.w !== undefined) s.style.width = s.dataset.w + "%";
    });
  }

  function renderBars(list, items = []) {
    if (!list) return;
    list.replaceChildren();

    const normalizedItems = normalizeTopics(items);
    if (!normalizedItems.length) {
      const empty = document.createElement("li");
      empty.className = "review-empty";
      empty.textContent = "No topics detected.";
      list.append(empty);
      return;
    }

    const max = Math.max(...normalizedItems.map((i) => i.percent), 1);

    normalizedItems.forEach((it) => {
      const li = document.createElement("li");
      const row = document.createElement("div");
      row.className = "bar__row";

      const n = document.createElement("span");
      n.textContent = it.name;

      const p = document.createElement("span");
      p.className = "bar__pct";
      p.textContent = it.percent + "%";

      row.append(n, p);

      const track = document.createElement("div");
      track.className = "bar__track";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", it.name);
      track.setAttribute("aria-valuenow", it.percent);
      track.setAttribute("aria-valuemin", 0);
      track.setAttribute("aria-valuemax", 100);

      const fill = document.createElement("div");
      fill.className = "bar__fill";
      fill.dataset.w = Math.max((it.percent / max) * 100, 6).toFixed(1);

      track.append(fill);
      li.append(row, track);
      list.append(li);
    });

    fillBars(list);
  }

  function fillBars(scope) {
    if (!scope) return;
    requestAnimationFrame(() => {
      $$(".bar__fill", scope).forEach((f, i) => {
        f.style.transitionDelay = (i % 3) * 120 + "ms";
        f.style.width = f.dataset.w + "%";
      });
    });
  }

  const GRADS = [
    "linear-gradient(145deg,#7c4dff,#3b82f6)", "linear-gradient(145deg,#0ea5e9,#6366f1)",
    "linear-gradient(145deg,#a855f7,#ec4899)", "linear-gradient(145deg,#14b8a6,#3b82f6)",
    "linear-gradient(145deg,#6366f1,#22d3ee)",
  ];
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

  function buildReview(review = {}) {
    const name = review.name || review.customer || review.author || "Customer";
    const text = review.text || review.review || review.comment || "";
    const rating = Number(review.rating || 5);
    const sentiment = review.sentiment || "Neutral";

    const li = document.createElement("li");
    li.className = "review";

    const av = document.createElement("span");
    av.className = "avatar";
    av.setAttribute("aria-hidden", "true");
    av.style.background = GRADS[hash(name) % GRADS.length];

    const ch = document.createElement("span");
    ch.textContent = name.trim().charAt(0).toUpperCase() || "?";
    av.append(ch);

    const nm = document.createElement("span");
    nm.className = "review__name";
    nm.textContent = name;

    const tx = document.createElement("p");
    tx.className = "review__text";
    tx.textContent = text;

    const st = document.createElement("span");
    st.className = "stars";
    st.setAttribute("role", "img");
    st.setAttribute("aria-label", rating + " out of 5 stars");
    for (let i = 1; i <= 5; i++) {
      const s = document.createElement("span");
      s.className = i <= rating ? "star-on" : "star-off";
      s.textContent = i <= rating ? "★" : "☆";
      st.append(s);
    }

    const key = String(sentiment).toLowerCase();
    const b = document.createElement("span");
    b.className = "sentiment sentiment--" + (["positive", "negative", "neutral"].includes(key) ? key : "neutral");
    b.textContent = sentiment;

    li.append(av, nm, tx, st, b);
    return li;
  }

  /* Scroll Reveal & Tilt */
  function initReveal() {
    const targets = $$(".reveal");
    const done = (el) => {
      el.classList.add("is-visible");
      if (el.classList.contains("analysis")) fillBars(el);
      if (el.classList.contains("stat")) playStats();
      if (el.id === "sentiment") SentimentViz.play();
    };

    if (!("IntersectionObserver" in window)) { targets.forEach(done); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const delay = el.classList.contains("stat") ? [...el.parentElement.children].indexOf(el) * 90 : 0;
        setTimeout(() => done(el), delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    targets.forEach((t) => io.observe(t));
  }

  function initTilt() {
    if (reduced || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    $$(".tilt").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const k = clamp(560 / r.width, 0.22, 1);
        el.style.setProperty("--ry", ((px - 0.5) * 7 * k).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((0.5 - py) * 6 * k).toFixed(2) + "deg");
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  function bindEvents() {
    if (els.choose && els.csv) els.choose.addEventListener("click", () => els.csv.click());
    if (els.csv) els.csv.addEventListener("change", (e) => uploadReviews(e.target.files[0]));
    if (els.analyze) els.analyze.addEventListener("click", () => analyzeReviews());
    if (els.demo) els.demo.addEventListener("click", () => analyzeReviews({ demo: true }));

    if (els.drop) {
      ["dragenter", "dragover"].forEach((t) => els.drop.addEventListener(t, (e) => { e.preventDefault(); els.drop.classList.add("is-dragover"); }));
      ["dragleave", "drop"].forEach((t) => els.drop.addEventListener(t, (e) => { e.preventDefault(); els.drop.classList.remove("is-dragover"); }));
      els.drop.addEventListener("drop", (e) => uploadReviews(e.dataTransfer.files[0]));
    }

    if (els.askBtn) els.askBtn.addEventListener("click", () => askAI(els.askInput.value));
    if (els.askInput) els.askInput.addEventListener("keydown", (e) => { if (e.key === "Enter") askAI(els.askInput.value); });
  }

  /* ------------------------------------------------------
     6. MINI 3D VISUALS (Canvas on stat cards)
     ------------------------------------------------------ */
  const MiniViz = (() => {
    const items = [];
    let raf = 0, started = false;

    function resize(it) {
      const r = it.canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      it.w = r.width || 220; it.h = r.height || 64;
      it.canvas.width = Math.round(it.w * dpr); it.canvas.height = Math.round(it.h * dpr);
      it.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const draw = {
      total(c, w, h, t, s) {
        if (!s.p) s.p = Array.from({ length: 30 }, () => ({ a: Math.random() * 6.283, r: 0.3 + Math.random() * 0.7, y: (Math.random() - 0.5) * 1.5, v: 0.25 + Math.random() * 0.4, ph: Math.random() * 6.283 }));
        const cx = w / 2, cy = h / 2;
        const pts = s.p.map((p) => {
          const a = p.a + t * p.v * 0.5;
          const x = Math.cos(a) * p.r, z = Math.sin(a) * p.r, y = p.y * 0.5 + Math.sin(t * 0.8 + p.ph) * 0.09;
          const k = 1 / (2 - z * 0.75);
          return { X: cx + x * w * 0.7 * k, Y: cy + y * h * 0.9 * k, z, k };
        }).sort((a, b) => a.z - b.z);
        c.lineWidth = 1;
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].X - pts[j].X, dy = pts[i].Y - pts[j].Y, d = Math.hypot(dx, dy);
            if (d < 34) { c.strokeStyle = "rgba(150,140,255," + (0.16 * (1 - d / 34)) + ")"; c.beginPath(); c.moveTo(pts[i].X, pts[i].Y); c.lineTo(pts[j].X, pts[j].Y); c.stroke(); }
          }
        }
        pts.forEach((p, i) => {
          const a = 0.35 + (p.z + 1) * 0.32, r = 0.9 + (p.z + 1) * 0.85;
          c.fillStyle = i % 3 ? "rgba(167,139,250," + a + ")" : "rgba(96,165,250," + a + ")";
          c.shadowColor = "rgba(139,92,246,.9)"; c.shadowBlur = 7;
          c.beginPath(); c.arc(p.X, p.Y, r, 0, 6.283); c.fill();
        });
        c.shadowBlur = 0;
      },
      pos(c, w, h, t, s) {
        const n = 7, bw = Math.min(w / (n * 2.0), 20), gap = bw * 0.85, tw = n * bw + (n - 1) * gap;
        const od = bw * 0.42, oy = bw * 0.26, x0 = (w - tw - od) / 2, base = h - 5;
        const grow = ease(clamp((t - (s.t0 ?? (s.t0 = t - (reduced ? 10 : 0)))) / 1.3, 0, 1));
        const tops = [];
        for (let i = 0; i < n; i++) {
          const lvl = 0.22 + 0.6 * (i / (n - 1)) + Math.sin(t * 0.9 + i * 1.3) * 0.035;
          const H = lvl * (h - 16) * clamp(grow * 1.4 - i * 0.07, 0, 1);
          const x = x0 + i * (bw + gap), y = base - H;
          let g = c.createLinearGradient(0, y, 0, base);
          g.addColorStop(0, "rgba(74,222,128,.95)"); g.addColorStop(1, "rgba(21,128,61,.35)");
          c.fillStyle = g; c.fillRect(x, y, bw, H);
          c.fillStyle = "rgba(10,90,45,.75)";
          c.beginPath(); c.moveTo(x + bw, y); c.lineTo(x + bw + od, y - oy); c.lineTo(x + bw + od, base - oy); c.lineTo(x + bw, base); c.fill();
          c.fillStyle = "rgba(190,255,215,.95)";
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + od, y - oy); c.lineTo(x + bw + od, y - oy); c.lineTo(x + bw, y); c.fill();
          tops.push([x + bw / 2 + od / 2, y - oy - 3]);
        }
        c.strokeStyle = "rgba(220,255,235,.9)"; c.lineWidth = 1.4; c.shadowColor = "#22C55E"; c.shadowBlur = 9;
        c.beginPath(); tops.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
        const u = (t * 0.22) % 1, f = u * (n - 1), i0 = Math.min(Math.floor(f), n - 2), q = f - i0;
        const dx = lerp(tops[i0][0], tops[i0 + 1][0], q), dy = lerp(tops[i0][1], tops[i0 + 1][1], q);
        c.fillStyle = "#fff"; c.beginPath(); c.arc(dx, dy, 2.2, 0, 6.283); c.fill(); c.shadowBlur = 0;
      },
      neg(c, w, h, t) {
        const mid = h * 0.56, period = w * 0.8;
        const spike = (u) => {
          if (u < 0.40 || u > 0.58) return Math.sin(u * 40) * 0.025;
          if (u < 0.44) return -((u - 0.40) / 0.04) * 0.55;
          if (u < 0.50) return -0.55 + ((u - 0.44) / 0.06) * 1.7;
          if (u < 0.54) return 1.15 - ((u - 0.50) / 0.04) * 1.35;
          return -0.2 + ((u - 0.54) / 0.04) * 0.2;
        };
        c.lineWidth = 1.6; c.lineJoin = "round"; c.shadowColor = "#F43F5E"; c.shadowBlur = 8;
        for (let x = 0; x < w - 1; x += 2) {
          const u = (((x - t * w * 0.3) % period) + period) % period / period;
          const y = mid - spike(u) * (h * 0.34);
          const u2 = (((x + 2 - t * w * 0.3) % period) + period) % period / period;
          const y2 = mid - spike(u2) * (h * 0.34);
          c.strokeStyle = "rgba(251,113,133," + (0.15 + 0.85 * (x / w)) + ")";
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y2); c.stroke();
        }
        c.shadowBlur = 0;
        for (let k = 0; k < 2; k++) {
          const p = ((t * 0.5 + k * 0.5) % 1), rx = p * w * 0.2;
          c.strokeStyle = "rgba(244,63,94," + (0.5 * (1 - p)) + ")"; c.lineWidth = 1.2;
          c.beginPath(); c.ellipse(w * 0.84, h * 0.58, rx, rx * 0.34, 0, 0, 6.283); c.stroke();
        }
        c.fillStyle = "#fb7185"; c.shadowColor = "#F43F5E"; c.shadowBlur = 10;
        c.beginPath(); c.arc(w * 0.84, h * 0.58, 2.4, 0, 6.283); c.fill(); c.shadowBlur = 0;
      },
      neu(c, w, h, t) {
        const mid = h * 0.52, A = h * 0.26;
        const env = (x) => 0.35 + 0.65 * Math.sin((Math.PI * x) / w);
        const y1 = (x, d = 0) => mid + Math.sin(x * 0.055 + t * 1.2 + d) * A * env(x);
        const y2 = (x, d = 0) => mid - Math.sin(x * 0.055 + t * 1.2 + d) * A * env(x);
        c.fillStyle = "rgba(245,158,11,.10)"; c.beginPath();
        for (let x = 0; x <= w; x += 3) (x ? c.lineTo(x, y1(x)) : c.moveTo(x, y1(x)));
        for (let x = w; x >= 0; x -= 3) c.lineTo(x, y2(x));
        c.fill();
        c.strokeStyle = "rgba(245,158,11,.22)"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, mid); c.lineTo(w, mid); c.stroke();
        [[y2, 0.35, 1], [y1, 1, 1.6]].forEach(([fn, a, lw]) => {
          c.strokeStyle = "rgba(251,191,36," + a + ")"; c.lineWidth = lw; c.shadowColor = "#F59E0B"; c.shadowBlur = a === 1 ? 9 : 0;
          c.beginPath(); for (let x = 0; x <= w; x += 2) (x ? c.lineTo(x, fn(x)) : c.moveTo(x, fn(x))); c.stroke();
        });
        c.shadowBlur = 0;
      },
    };

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const t = now / 1000;
      items.forEach((it) => {
        if (!it.visible) return;
        it.ctx.clearRect(0, 0, it.w, it.h);
        it.fn(it.ctx, it.w, it.h, t, it.s);
      });
    }

    function init() {
      $$(".stat__viz").forEach((canvas) => {
        const it = { canvas, ctx: canvas.getContext("2d"), fn: draw[canvas.dataset.viz], s: {}, visible: false, w: 0, h: 0 };
        resize(it); items.push(it);
      });
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => es.forEach((e) => {
          const item = items.find((i) => i.canvas === e.target);
          if (item) item.visible = e.isIntersecting;
        }), { rootMargin: "80px" });
        items.forEach((it) => io.observe(it.canvas));
      } else items.forEach((it) => (it.visible = true));

      let rt;
      addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => items.forEach(resize), 150); });
      if (reduced) { items.forEach((it) => { it.fn(it.ctx, it.w, it.h, 3, it.s); }); return; }
      if (!started) { started = true; raf = requestAnimationFrame(frame); }
    }

    function restart() { items.forEach((it) => { delete it.s.t0; }); }
    return { init, restart };
  })();

  /* ------------------------------------------------------
     7. 3D SENTIMENT COLUMNS (Canvas Cabinet Projection)
     ------------------------------------------------------ */
  const SentimentViz = (() => {
    let canvas, ctx, w = 0, h = 0, vals = { positive: 82, neutral: 7, negative: 11 };
    let t0 = null, visible = false, raf = 0;
    const cols = [
      { key: "positive", label: "Positive", rgb: [34, 197, 94] },
      { key: "neutral",  label: "Neutral",  rgb: [245, 158, 11] },
      { key: "negative", label: "Negative", rgb: [244, 63, 94] },
    ];
    const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
    const lighten = (c, k) => c.map((v) => Math.round(v + (255 - v) * k));

    function resize() {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function render(now) {
      if (!ctx) return;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      const pad = Math.max(16, w * 0.07), base = h - 54, floorH = 34;
      const cw = Math.min(84, w * 0.19), gap = (w - pad * 2 - cw * 3 - cw * 0.4) / 2;
      const od = cw * 0.42, oy = cw * 0.24, maxH = base - 52;

      /* Floor grid */
      ctx.lineWidth = 1;
      for (let r = 0; r <= 5; r++) {
        const y = base + (r / 5) * floorH, spread = r * 7;
        ctx.strokeStyle = "rgba(139,92,246," + (0.30 - r * 0.04) + ")";
        ctx.beginPath(); ctx.moveTo(pad * 0.4 - spread, y); ctx.lineTo(w - pad * 0.4 + spread, y); ctx.stroke();
      }
      for (let v = 0; v <= 10; v++) {
        const f = v / 10, xt = lerp(pad * 0.4, w - pad * 0.4, f), xb = lerp(pad * 0.4 - 35, w - pad * 0.4 + 35, f);
        ctx.strokeStyle = "rgba(139,92,246,.2)"; ctx.beginPath(); ctx.moveTo(xt, base); ctx.lineTo(xb, base + floorH); ctx.stroke();
      }

      cols.forEach((col, i) => {
        const v = vals[col.key] || 0, g = t0 === null ? 0 : ease(clamp((t - t0 - i * 0.2) / 1.2, 0, 1));
        const H = Math.max(v / 100, 0.03) * maxH * g;
        const x = pad + i * (cw + gap), y = base - H;
        const c = col.rgb, pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + i);

        /* Glow Pool */
        const pool = ctx.createRadialGradient(x + cw / 2 + od / 2, base + 4, 2, x + cw / 2 + od / 2, base + 4, cw * 1.1);
        pool.addColorStop(0, rgba(c, 0.32 * g)); pool.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = pool; ctx.fillRect(x - cw, base - 10, cw * 3.2, 40);

        /* Front face */
        const fg = ctx.createLinearGradient(0, y, 0, base);
        fg.addColorStop(0, rgba(c, 0.85)); fg.addColorStop(1, rgba(c, 0.16));
        ctx.shadowColor = rgba(c, 0.6); ctx.shadowBlur = 18;
        ctx.fillStyle = fg; ctx.fillRect(x, y, cw, H);
        ctx.shadowBlur = 0;

        /* Side face */
        ctx.fillStyle = rgba(c, 0.30);
        ctx.beginPath(); ctx.moveTo(x + cw, y); ctx.lineTo(x + cw + od, y - oy); ctx.lineTo(x + cw + od, base - oy); ctx.lineTo(x + cw, base); ctx.fill();

        /* Top face */
        const L = lighten(c, 0.55);
        ctx.fillStyle = rgba(L, 0.92);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + od, y - oy); ctx.lineTo(x + cw + od, y - oy); ctx.lineTo(x + cw, y); ctx.fill();

        /* Glass edges */
        ctx.strokeStyle = rgba(lighten(c, 0.5), 0.55 + pulse * 0.25); ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, Math.max(H - 1, 0));

        /* Scan line */
        if (g > 0.99 && H > 8) {
          const sy = base - ((t * 0.28 + i * 0.3) % 1) * H;
          ctx.fillStyle = rgba(L, 0.35); ctx.fillRect(x, sy, cw, 1.5);
        }

        /* Labels */
        ctx.textAlign = "center"; ctx.fillStyle = "#fff";
        ctx.font = "600 " + (w < 360 ? 14 : 16) + "px Sora, system-ui, sans-serif";
        ctx.globalAlpha = g; ctx.fillText(Math.round(v * g) + "%", x + cw / 2 + od / 2, y - oy - 9); ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(169,177,208,.9)"; ctx.font = "600 12px Manrope, system-ui, sans-serif";
        ctx.fillText(col.label, x + cw / 2 + od / 2, base + floorH + 16);
      });
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (visible) render(now);
    }

    function init() {
      canvas = $("#sent-canvas");
      if (!canvas) return;
      ctx = canvas.getContext("2d");
      resize();
      if ("IntersectionObserver" in window) new IntersectionObserver((es) => es.forEach((e) => (visible = e.isIntersecting)), { rootMargin: "60px" }).observe(canvas);
      else visible = true;
      let rt;
      addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (reduced) render(t0 * 1000 + 5000); }, 150); });
      if (reduced) { t0 = -5; render(0); return; }
      raf = requestAnimationFrame(loop);
    }

    function play() { if (reduced) return; t0 = performance.now() / 1000; }
    function setData(s, animate) {
      vals = { positive: s.positive || 0, neutral: s.neutral || 0, negative: s.negative || 0 };
      if (animate) play();
      if (reduced && ctx) render(5000);
    }
    return { init, play, setData };
  })();

  /* ------------------------------------------------------
     8. HERO 3D SCENE (Three.js Animated N Logo & Neural Net)
     ------------------------------------------------------ */
  const Scene3D = (() => {
    function init({ onFirstFrame }) {
      const fail = () => { root.classList.add("no-gl"); return false; };
      if (typeof THREE === "undefined") return fail();

      const canvas = $("#gl"), stage = $("#logo-anchor");
      if (!canvas || !stage) return fail();

      const W0 = innerWidth;
      const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
      let tier = W0 < 720 ? "low" : (W0 < 1100 || lowPower) ? "mid" : "high";

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: tier === "high", powerPreference: tier === "high" ? "high-performance" : "default" });
      } catch (e) { return fail(); }

      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tier === "high" ? 1.75 : 1.25));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setClearColor(0x000000, 0);

      let shadows = tier === "high";
      if (shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }

      const NODE_N = tier === "high" ? 84 : tier === "mid" ? 56 : 34;
      const PACK_N = tier === "high" ? 20 : tier === "mid" ? 14 : 9;
      const BG_N   = tier === "high" ? 320 : tier === "mid" ? 200 : 110;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
      camera.position.set(0, 0, 16);

      /* Environment Map */
      (function makeEnv() {
        try {
          const env = new THREE.Scene();
          const c = document.createElement("canvas"); c.width = 4; c.height = 256;
          const g = c.getContext("2d"), grad = g.createLinearGradient(0, 0, 0, 256);
          grad.addColorStop(0, "#0b0a24"); grad.addColorStop(0.5, "#14102f"); grad.addColorStop(1, "#050711");
          g.fillStyle = grad; g.fillRect(0, 0, 4, 256);
          const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
          env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
          const box = (hex, k, w, h, x, y, z) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
            m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
          };
          box(0x8b5cf6, 7, 26, 14, -26, 12, 14);
          box(0xffffff, 6, 40, 3, 0, 32, 4);
          box(0x3b82f6, 6, 18, 26, 30, 4, -18);
          box(0x6d28d9, 5, 40, 8, 0, -30, 12);
          box(0xbfdbfe, 4, 6, 24, 24, 6, 22);
          const pm = new THREE.PMREMGenerator(renderer);
          scene.environment = pm.fromScene(env, 0.02).texture;
          pm.dispose();
        } catch (err) { console.warn('Environment map unavailable', err); }
      })();

      const hero = new THREE.Group(); scene.add(hero);
      const logoPivot = new THREE.Group(); logoPivot.scale.setScalar(1.25); hero.add(logoPivot);
      const logo = new THREE.Group(); logoPivot.add(logo);

      const fades = [];
      const reg = (m, base = 1, always = false) => { fades.push({ m, base, always }); return m; };
      const setOp = (e, v) => {
        const o = e.base * v;
        if (!e.always) { const tr = o < 0.999; if (e.m.transparent !== tr) { e.m.transparent = tr; e.m.needsUpdate = true; } }
        e.m.opacity = o;
      };

      /* Extruded N Geometry */
      const D = 0.75, BEV = 0.09;
      const rect = (x0, x1) => { const s = new THREE.Shape(); s.moveTo(x0, 0); s.lineTo(x1, 0); s.lineTo(x1, 4); s.lineTo(x0, 4); s.closePath(); return s; };
      const poly = (pts) => { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((p) => s.lineTo(p[0], p[1])); s.closePath(); return s; };
      const stemOpts = { depth: D, bevelEnabled: true, bevelThickness: BEV, bevelSize: 0.06, bevelSegments: 3, curveSegments: 4 };
      const stemL = new THREE.ExtrudeGeometry(rect(0, 0.85), stemOpts);
      const stemR = new THREE.ExtrudeGeometry(rect(2.15, 3), stemOpts);
      [stemL, stemR].forEach((g) => g.translate(-1.5, -2, -D / 2));
      const diagPts = [[0.85, 2.3], [2.15, 0], [2.15, 1.7], [0.85, 4]];
      const diag = new THREE.ExtrudeGeometry(poly(diagPts), { depth: 0.46, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2 });
      diag.translate(-1.5, -2, -0.23);

      const metal = tier === "low"
        ? new THREE.MeshStandardMaterial({ color: 0x17122f, metalness: 0.9, roughness: 0.3 })
        : new THREE.MeshPhysicalMaterial({ color: 0x151129, metalness: 0.92, roughness: 0.24, clearcoat: 0.7, clearcoatRoughness: 0.18 });
      metal.envMapIntensity = 1.25; metal.emissive = new THREE.Color(0x2a1066); metal.emissiveIntensity = 0.12;
      metal.polygonOffset = true; metal.polygonOffsetFactor = 1; metal.polygonOffsetUnits = 1;
      reg(metal, 1);

      const glass = tier === "low"
        ? new THREE.MeshStandardMaterial({ color: 0x7c6cff, metalness: 0.2, roughness: 0.08, transparent: true, opacity: 0.34 })
        : new THREE.MeshPhysicalMaterial({ color: 0x7c6cff, metalness: 0.05, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.34 });
      glass.envMapIntensity = 1.8; glass.emissive = new THREE.Color(0x3b2a9a); glass.emissiveIntensity = 0.25;
      glass.depthWrite = false; glass.polygonOffset = true; glass.polygonOffsetFactor = 1; glass.polygonOffsetUnits = 1;
      reg(glass, 0.34, true);

      const mk = (geo, mat, ro = 0) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadows; m.renderOrder = ro; logo.add(m); return m; };
      mk(stemL, metal); mk(stemR, metal); mk(diag, glass, 1);

      /* Edge Lines */
      const edgeV = reg(new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 0.9, true);
      const edgeB = reg(new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 0.8, true);
      [stemL, stemR].forEach((g) => logo.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 40), edgeV)));
      logo.add(new THREE.LineSegments(new THREE.EdgesGeometry(diag, 40), edgeB));

      /* Shaders */
      const VERT = "varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }";
      const FRAG_E = [
        "precision highp float; uniform float uTime,uHover,uAlpha,uDir; uniform vec3 uA,uB; varying vec2 vP;",
        "void main(){",
        " float sp=0.22+uHover*0.38;",
        " float f=fract(vP.y*uDir*0.42-uTime*sp);",
        " float pulse=pow(max(0.0,1.0-abs(f-0.5)*2.0),5.0);",
        " float fine=0.5+0.5*sin(vP.y*26.0*uDir-uTime*2.4);",
        " float a=(0.20+pulse*(0.85+uHover*0.7)+fine*0.12)*uAlpha;",
        " vec3 col=mix(uA,uB,clamp(pulse+uHover*0.25,0.0,1.0));",
        " gl_FragColor=vec4(col,a);",
        "}",
      ].join("\n");

      const FRAG_H = [
        "precision highp float; uniform float uTime,uHover,uAlpha,uReveal; varying vec2 vP;",
        "void main(){",
        " float y=(vP.y+2.0)/4.0;",
        " float pos=fract(uTime*0.16);",
        " float band=exp(-pow((y-pos)*14.0,2.0));",
        " float lines=0.5+0.5*sin(y*190.0-uTime*4.0);",
        " float mask=1.0-smoothstep(uReveal-0.10,uReveal,y);",
        " float front=exp(-pow((y-uReveal)*26.0,2.0))*0.7;",
        " float a=((band*0.7+lines*0.10)*(0.07+uHover*0.85)*mask+front)*uAlpha;",
        " vec3 col=mix(vec3(0.55,0.36,0.98),vec3(0.35,0.85,1.0),clamp(y+0.25*sin(uTime*0.6+y*4.0),0.0,1.0));",
        " gl_FragColor=vec4(col,a);",
        "}",
      ].join("\n");

      const shader = (frag, uniforms) => new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      });
      const U = () => ({ uTime: { value: 0 }, uHover: { value: 0 }, uAlpha: { value: 0 } });
      const mkEnergy = (dir) => {
        const u = U(); u.uDir = { value: dir }; u.uA = { value: new THREE.Color(0.55, 0.36, 0.98) }; u.uB = { value: new THREE.Color(0.55, 0.9, 1.0) };
        return shader(FRAG_E, u);
      };
      const eUp = mkEnergy(1), eDown = mkEnergy(-1);

      const zF = D / 2 + BEV + 0.006;
      [-1.075, 1.075].forEach((x) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 3.4), eUp); m.position.set(x, 0, zF); m.renderOrder = 3; logo.add(m); });
      const insetPts = diagPts.map((p) => [1.5 + (p[0] - 1.5) * 0.7, 2 + (p[1] - 2) * 0.82]);
      const chan = new THREE.ShapeGeometry(poly(insetPts)); chan.translate(-1.5, -2, 0);
      const chanMesh = new THREE.Mesh(chan, eDown); chanMesh.renderOrder = 3; logo.add(chanMesh);

      const holoU = U(); holoU.uReveal = { value: 0 };
      const holo = shader(FRAG_H, holoU);
      const nShape = poly([[0, 0], [0.85, 0], [0.85, 2.3], [2.15, 0], [3, 0], [3, 4], [2.15, 4], [2.15, 1.7], [0.85, 4], [0, 4]]);
      const holoGeo = new THREE.ShapeGeometry(nShape); holoGeo.translate(-1.5, -2, 0);
      const holoMesh = new THREE.Mesh(holoGeo, holo); holoMesh.position.z = zF + 0.02; holoMesh.renderOrder = 4; logo.add(holoMesh);

      /* Lights */
      scene.add(new THREE.AmbientLight(0x1a1442, 0.7));
      const key = new THREE.DirectionalLight(0xdcd2ff, 1.15); key.position.set(4, 6, 8); hero.add(key, key.target);
      if (shadows) { key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0006; key.shadow.radius = 5; }
      const rim = new THREE.PointLight(0x8b5cf6, 2.4, 0, 1); rim.position.set(5, 2, -4); hero.add(rim);
      const fill = new THREE.PointLight(0x3b82f6, 1.5, 0, 1); fill.position.set(-6, -1, 4); hero.add(fill);
      let shadowPlane = null;
      if (shadows) {
        shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.ShadowMaterial({ opacity: 0.45 }));
        shadowPlane.position.z = -2.4; shadowPlane.receiveShadow = true; hero.add(shadowPlane);
      }

      /* Neural Net Group */
      const net = new THREE.Group(); hero.add(net);
      const sprite = (() => {
        const c = document.createElement("canvas"); c.width = c.height = 64;
        const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.28, "rgba(255,255,255,.55)"); r.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = r; g.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
      })();
      const pointMats = [];
      const mkPoints = (size, opacity, scaled) => {
        const m = new THREE.PointsMaterial({ size, map: sprite, vertexColors: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false });
        if (scaled) pointMats.push([m, size]);
        return m;
      };

      const base = [];
      while (base.length < NODE_N) {
        const x = (Math.random() * 2 - 1) * 8, y = (Math.random() * 2 - 1) * 5, z = (Math.random() * 2 - 1) * 3;
        if (Math.abs(x) < 2.9 && Math.abs(y) < 3.3 && Math.abs(z) < 1.8) continue;
        base.push({ x, y, z, p: Math.random() * 6.283 });
      }
      const nodePos = new Float32Array(NODE_N * 3), nodeCol = new Float32Array(NODE_N * 3);
      base.forEach((n, i) => {
        const f = (n.x + 8) / 16, c = f < 0.4 ? [0.62, 0.74, 0.95] : f < 0.62 ? [0.52, 0.38, 0.95] : [0.28, 0.62, 0.98];
        const d = 0.5 + Math.random() * 0.4;
        nodeCol.set([c[0] * d, c[1] * d, c[2] * d], i * 3);
      });
      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
      nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeCol, 3));
      const nodeMat = reg(mkPoints(0.3, 0.9, true), 0.9, true);
      net.add(new THREE.Points(nodeGeo, nodeMat));

      const edges = [], adj = Array.from({ length: NODE_N }, () => []), seen = new Set();
      base.forEach((a, i) => {
        base.map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 1.4) }))
          .filter((o) => o.j !== i && o.d < 3.7).sort((p, q) => p.d - q.d).slice(0, 2)
          .forEach((o) => {
            const k = Math.min(i, o.j) + "-" + Math.max(i, o.j);
            if (seen.has(k)) return; seen.add(k);
            adj[i].push(edges.length); adj[o.j].push(edges.length); edges.push([i, o.j]);
          });
      });
      const E = edges.length, edgePos = new Float32Array(E * 6), edgeCol = new Float32Array(E * 6), pulse = new Float32Array(E);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(edgePos, 3));
      lineGeo.setAttribute("color", new THREE.BufferAttribute(edgeCol, 3));
      const lineMat = reg(new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 0.9, true);
      net.add(new THREE.LineSegments(lineGeo, lineMat));
      const pending = [];

      /* Data Packets */
      const rnd = (a, b) => a + Math.random() * (b - a);
      const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
      const makeCurves = () => {
        const y0 = rnd(-4, 4), z0 = rnd(-2.4, 2.4), ey = rnd(-1.6, 1.6), ey2 = rnd(-1.6, 1.6), y1 = rnd(-4, 4), z1 = rnd(-2.4, 2.4);
        return {
          A: new THREE.CatmullRomCurve3([V3(rnd(-8.2, -6.4), y0, z0), V3(-4.6, y0 * 0.55 + rnd(-0.8, 0.8), z0 * 0.5), V3(-2.3, ey, 0.2), V3(-0.4, ey, 0)]),
          B: new THREE.CatmullRomCurve3([V3(0.4, ey2, 0), V3(2.3, ey2 + rnd(-0.6, 0.6), 0.2), V3(4.8, y1 * 0.6, z1 * 0.5), V3(rnd(6.4, 8.2), y1, z1)]),
        };
      };
      const packets = Array.from({ length: PACK_N }, () => ({ u: Math.random(), v: rnd(0.07, 0.12), ...makeCurves(), prev: 0 }));
      const TRAIL = 3, packPos = new Float32Array(PACK_N * TRAIL * 3), packCol = new Float32Array(PACK_N * TRAIL * 3);
      const packGeo = new THREE.BufferGeometry();
      packGeo.setAttribute("position", new THREE.BufferAttribute(packPos, 3));
      packGeo.setAttribute("color", new THREE.BufferAttribute(packCol, 3));
      const packMat = reg(mkPoints(0.44, 1, true), 1, true);
      net.add(new THREE.Points(packGeo, packMat));

      const streamMat = reg(new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 0.2, true);
      for (let k = 0; k < 6; k++) {
        const cv = makeCurves(), curve = k < 3 ? cv.A : cv.B, n = 36, p = new Float32Array(n * 3), c = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const pt = curve.getPoint(i / (n - 1)); p.set([pt.x, pt.y, pt.z], i * 3);
          const f = k < 3 ? i / (n - 1) : 1 - i / (n - 1), col = k < 3 ? [0.6, 0.7, 1] : [0.3, 0.7, 1];
          c.set([col[0] * f, col[1] * f, col[2] * f], i * 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.setAttribute("color", new THREE.BufferAttribute(c, 3));
        net.add(new THREE.Line(g, streamMat));
      }

      /* Ambient Particles */
      const bg = new THREE.Group(); scene.add(bg);
      const bgPos = new Float32Array(BG_N * 3), bgCol = new Float32Array(BG_N * 3), bgVel = new Float32Array(BG_N * 3);
      const pal = [[0.55, 0.36, 0.96], [0.55, 0.36, 0.96], [0.22, 0.5, 0.97], [0.22, 0.72, 0.97], [0.85, 0.88, 1]];
      for (let i = 0; i < BG_N; i++) {
        const i3 = i * 3;
        bgPos[i3] = rnd(-32, 32); bgPos[i3 + 1] = rnd(-22, 22); bgPos[i3 + 2] = rnd(-30, 6);
        const c = pal[(Math.random() * pal.length) | 0], d = 0.4 + Math.random() * 0.5;
        bgCol.set([c[0] * d, c[1] * d, c[2] * d], i3);
        bgVel[i3] = rnd(-0.12, 0.12); bgVel[i3 + 1] = rnd(0.05, 0.22); bgVel[i3 + 2] = rnd(-0.05, 0.05);
      }
      const bgGeo = new THREE.BufferGeometry();
      bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3)); bgGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
      const bgMat = new THREE.PointsMaterial({ size: tier === "low" ? 0.34 : 0.26, map: sprite, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false });
      bg.add(new THREE.Points(bgGeo, bgMat));

      let W = 1, H = 1, wpp = 0.01, s = 0.7, lastShadowS = 0;
      function layout() {
        W = innerWidth; H = innerHeight;
        renderer.setSize(W, H, false);
        camera.aspect = W / H; camera.updateProjectionMatrix();
        wpp = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / H;
      }

      let fadeScroll = 1;
      function place() {
        const r = stage.getBoundingClientRect();
        hero.position.set((r.left + r.width / 2 - W / 2) * wpp, -(r.top + r.height / 2 - H / 2) * wpp, 0);
        s = (r.height * wpp) / 10;
        hero.scale.setScalar(s);
        net.scale.x = clamp(r.width / r.height / 1.6, 0.6, 1.4);
        fadeScroll = clamp((r.bottom - 40) / (r.height * 0.5), 0, 1);
        hero.visible = fadeScroll > 0.002 && r.top < H + 60;
        pointMats.forEach(([m, b]) => (m.size = b * s));
        if (shadows && Math.abs(s - lastShadowS) > 0.01) {
          const cam = key.shadow.camera; cam.left = -7 * s; cam.right = 7 * s; cam.top = 7 * s; cam.bottom = -7 * s; cam.near = 1 * s; cam.far = 26 * s;
          cam.updateProjectionMatrix(); lastShadowS = s;
        }
        bg.position.y = scrollY * wpp * 0.22;
      }

      let hoverTarget = 0, hoverT = 0, tapTimer = 0;
      stage.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hoverTarget = 1; });
      stage.addEventListener("pointerleave", () => { hoverTarget = 0; });
      stage.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") return;
        hoverTarget = 1; clearTimeout(tapTimer); tapTimer = setTimeout(() => (hoverTarget = 0), 1600);
      });

      const tmp = new THREE.Vector3(), colA = new THREE.Color(0xa78bfa), colB = new THREE.Color(0xe9e2ff);
      const timeU = [eUp, eDown, holo];
      let time = 0, introT = reduced ? 10 : 0, boost = 0, nextPulse = 0.6, fpsAcc = 0, fpsN = 0, firstDone = false, running = true, last = 0;

      function step(dt) {
        time += dt; introT += dt;
        place();

        const pI = ease(clamp(introT / 1.1, 0, 1));
        const lI = ease(clamp((introT - 0.35) / 1.25, 0, 1));
        const flash = reduced ? 0 : Math.max(0, 1 - Math.abs(introT - 1.35) / 0.45) * 0.9;
        hoverT += (hoverTarget - hoverT) * (1 - Math.exp(-dt * 5));
        boost = Math.max(0, boost - dt * 0.9);
        const energy = clamp(Math.max(hoverT, boost * 0.5, flash), 0, 1.3);

        logo.position.y = Math.sin(time * 0.9) * 0.12;
        logo.rotation.y = 0.26 + Math.sin(time * 0.24) * 0.2 + hoverT * 0.24;
        logo.rotation.x = Math.sin(time * 0.2) * 0.05 - hoverT * 0.06;
        logoPivot.scale.setScalar(1.25 * (0.9 + 0.1 * lI));

        timeU.forEach((m) => { m.uniforms.uTime.value = time; m.uniforms.uHover.value = energy; m.uniforms.uAlpha.value = lI * fadeScroll; });
        holo.uniforms.uReveal.value = reduced ? 1.3 : clamp((introT - 0.3) / 1.1, 0, 1) * 1.25;
        rim.intensity = 2.4 * (1 + hoverT * 1.3) + flash * 3;
        fill.intensity = 1.5 * (1 + hoverT * 0.5);
        metal.emissiveIntensity = 0.12 + hoverT * 0.35 + boost * 0.15 + flash * 0.4;
        glass.emissiveIntensity = 0.25 + hoverT * 0.5 + boost * 0.2;
        edgeV.color.copy(colA).lerp(colB, hoverT * 0.7 + flash * 0.5);

        fades.forEach((e) => {
          const isNet = e.m === nodeMat || e.m === lineMat || e.m === packMat || e.m === streamMat;
          setOp(e, (isNet ? pI : lI) * fadeScroll);
        });
        bgMat.opacity = 0.7 * pI;

        for (let i = 0; i < NODE_N; i++) {
          const n = base[i], ph = n.p;
          nodePos[i * 3]     = n.x + Math.sin(time * 0.25 + ph) * 0.24;
          nodePos[i * 3 + 1] = n.y + Math.sin(time * 0.21 + ph * 1.7) * 0.24;
          nodePos[i * 3 + 2] = n.z + Math.sin(time * 0.18 + ph * 2.3) * 0.2;
        }
        nodeGeo.attributes.position.needsUpdate = true;

        if (!reduced) {
          nextPulse -= dt;
          if (nextPulse <= 0 && E) {
            nextPulse = rnd(0.9, 2);
            let node = (Math.random() * NODE_N) | 0;
            for (let k = 0; k < 4; k++) {
              if (!adj[node].length) break;
              const ei = adj[node][(Math.random() * adj[node].length) | 0];
              pending.push({ t: time + k * 0.2, e: ei });
              node = edges[ei][0] === node ? edges[ei][1] : edges[ei][0];
            }
          }
          for (let i = pending.length - 1; i >= 0; i--) if (pending[i].t <= time) { pulse[pending[i].e] = 1; pending.splice(i, 1); }
        }
        for (let e = 0; e < E; e++) {
          const [a, b] = edges[e]; pulse[e] = Math.max(0, pulse[e] - dt * 0.9);
          const o = e * 6, k = 0.11 + pulse[e] * 0.85;
          edgePos[o] = nodePos[a * 3]; edgePos[o + 1] = nodePos[a * 3 + 1]; edgePos[o + 2] = nodePos[a * 3 + 2];
          edgePos[o + 3] = nodePos[b * 3]; edgePos[o + 4] = nodePos[b * 3 + 1]; edgePos[o + 5] = nodePos[b * 3 + 2];
          const r = 0.45 * k, g = 0.38 * k + pulse[e] * 0.2, bl = 0.95 * k;
          edgeCol[o] = r; edgeCol[o + 1] = g; edgeCol[o + 2] = bl; edgeCol[o + 3] = r; edgeCol[o + 4] = g; edgeCol[o + 5] = bl;
        }
        if (E) { lineGeo.attributes.position.needsUpdate = true; lineGeo.attributes.color.needsUpdate = true; }

        packets.forEach((p, i) => {
          p.prev = p.u; p.u += dt * p.v * (reduced ? 0 : 1);
          if (p.prev < 0.5 && p.u >= 0.5) boost = Math.min(1, boost + 0.2);
          if (p.u >= 1) { p.u = 0; p.prev = 0; Object.assign(p, makeCurves()); }
          for (let t = 0; t < TRAIL; t++) {
            const u = clamp(p.u - t * 0.014, 0, 0.9999), idx = (i * TRAIL + t) * 3;
            if (u < 0.5) p.A.getPoint(u * 2, tmp); else p.B.getPoint((u - 0.5) * 2, tmp);
            packPos[idx] = tmp.x; packPos[idx + 1] = tmp.y; packPos[idx + 2] = tmp.z;
            const q = u < 0.5 ? u * 2 : (u - 0.5) * 2, br = [1, 0.5, 0.24][t];
            const c = u < 0.5 ? [lerp(0.8, 0.62, q), lerp(0.88, 0.42, q), 1] : [lerp(0.62, 0.3, q), lerp(0.42, 0.75, q), 1];
            packCol[idx] = c[0] * br; packCol[idx + 1] = c[1] * br; packCol[idx + 2] = c[2] * br;
          }
        });
        packGeo.attributes.position.needsUpdate = true; packGeo.attributes.color.needsUpdate = true;

        for (let i = 0; i < BG_N; i++) {
          const i3 = i * 3;
          bgPos[i3] += bgVel[i3] * dt; bgPos[i3 + 1] += bgVel[i3 + 1] * dt; bgPos[i3 + 2] += bgVel[i3 + 2] * dt;
          if (bgPos[i3 + 1] > 22) bgPos[i3 + 1] = -22;
          if (bgPos[i3] > 32) bgPos[i3] = -32; else if (bgPos[i3] < -32) bgPos[i3] = 32;
        }
        bgGeo.attributes.position.needsUpdate = true;
        bg.rotation.y = Math.sin(time * 0.05) * 0.03;

        renderer.render(scene, camera);
        if (!firstDone) { firstDone = true; onFirstFrame && onFirstFrame(); }
      }

      function loop(now) {
        if (!running) return;
        requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, 0.05); last = now;
        step(dt);
      }

      layout();
      addEventListener("resize", () => { layout(); if (reduced) step(0); });
      if (reduced) {
        let q = 0; const once = () => { if (!q) q = requestAnimationFrame(() => { q = 0; step(0); }); };
        addEventListener("scroll", once, { passive: true }); addEventListener("resize", once);
        step(0);
      } else {
        requestAnimationFrame((n) => { last = n; requestAnimationFrame(loop); });
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) running = false;
          else if (!running) { running = true; requestAnimationFrame((n) => { last = n; loop(n); }); }
        });
      }
      return true;
    }
    return { init };
  })();

  /* ------------------------------------------------------
     9. BOOT & INITIALIZATION
     ------------------------------------------------------ */
  let readied = false;
  function ready() {
    if (readied) return;
    readied = true;
    document.body.classList.add("is-ready");
  }

  function boot() {
    bindEvents();
    initReveal();
    initTilt();
    MiniViz.init();
    SentimentViz.init();

    // Default mock load taake page start me blank na dikhe
    updateDashboard(MOCK_ANALYSIS);
    displayReviews(MOCK_ANALYSIS.reviews);

    if (els.ctaAnalyze && els.choose) {
      els.ctaAnalyze.addEventListener("click", () => setTimeout(() => els.choose.focus({ preventScroll: true }), 700));
    }

    let ok = false;
    try {
      ok = Scene3D.init({ onFirstFrame: ready });
    } catch (e) {
      console.error(e);
      root.classList.add("no-gl");
    }
    if (!ok) ready();
    setTimeout(ready, 2000); // Safety fallback to reveal hero elements
  }

  window.NeuroForge = {
    CONFIG,
    uploadReviews,
    analyzeReviews,
    askAI,
    updateDashboard,
    displayReviews,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();