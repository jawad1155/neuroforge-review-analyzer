/* ==========================================================================
   NEUROFORGE — PREMIUM AI REVIEW INTELLIGENCE PLATFORM
   Application Engine, 3D Artwork Motion, Auth Integration & Functional API
   Color Palette: Obsidian Black · Deep Graphite · Emerald Green · Champagne Gold
   ========================================================================== */

(() => {
  "use strict";

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Configuration
  const CONFIG = {
    API_BASE: (() => {
      if (window.NEUROFORGE_API_BASE) return window.NEUROFORGE_API_BASE;
      const host = window.location.hostname;
      const port = window.location.port;
      if (host === "localhost" || host === "127.0.0.1") {
        return port === "8000" ? "" : "http://127.0.0.1:8000";
      }
      return "";
    })(),
    ENDPOINTS: {
      health: "/health",
      evolusInfo: "/evolus/info",
      analyze: "/analyze",
      ask: "/ask",
      importUrl: "/import-url",
      login: "/auth/token",
      signup: "/auth/signup",
    },
    MAX_FILE_MB: 10,
    PAGE_SIZE: 10,
  };

  // Application State
  const state = {
    file: null,
    csv: null,
    analysisResult: null,
    reviews: [],
    filteredReviews: [],
    activeFilter: "all",
    searchQuery: "",
    sortOrder: "default",
    currentPage: 1,
    qaHistory: [],
    isAnalyzing: false,
    isAsking: false,
    currentUser: null,
  };

  // Fallback demo data (used if backend is temporarily unreachable)
  const FALLBACK_DEMO_DATA = {
    success: true,
    stats: {
      total_reviews: 20,
      average_length: 78.9,
      rating_distribution: { "5": "25.0%", "4": "25.0%", "2": "20.0%", "1": "15.0%", "3": "15.0%" },
    },
    sentiment: { positive: 50.0, neutral: 15.0, negative: 35.0 },
    positive_topics: [
      { name: "Overall Satisfaction", percent: 40.0 },
      { name: "Performance & Design", percent: 20.0 },
      { name: "Value for Money", percent: 10.0 },
    ],
    negative_topics: [
      { name: "Quality & Durability", percent: 30.0 },
      { name: "Software Bugs", percent: 20.0 },
      { name: "Customer Support", percent: 10.0 },
    ],
    common_praise: [
      "Excellent value for money",
      "Fast shipping and secure packaging",
      "Seamless integration with other tools",
      "Impressive battery life",
      "Sleek and modern aesthetics",
    ],
    common_complaints: [
      "Poor build quality and durability",
      "Difficult manual setup",
      "Software bugs and crashes on export",
      "Missing advertised features",
      "A bit overpriced for average performance",
    ],
    recommendations: [
      "Improve build quality and durability of physical chassis",
      "Enhance customer support responsiveness and training",
      "Fix software bugs and app crashes during data export",
      "Simplify initial setup and onboarding workflow",
      "Consider adding a native dark mode interface option",
    ],
    summary:
      "Customer sentiment is divided with 50% positive and 35% negative feedback. Positive reviews strongly praise performance, design, and integration, while negative reviews highlight software stability, build quality, and setup friction. Immediate priority should be given to stability fixes and customer onboarding.",
    reviews: [
      { name: "Customer 1", text: "Absolutely love this product! It has completely changed my workflow for the better.", rating: 5, sentiment: "Positive" },
      { name: "Customer 2", text: "The build quality is poor. It felt like it was going to break the first time I used it.", rating: 2, sentiment: "Negative" },
      { name: "Customer 3", text: "Great value for the money. A few minor bugs here and there, but overall very satisfied.", rating: 4, sentiment: "Positive" },
      { name: "Customer 4", text: "Terrible experience. The customer support was rude and the item arrived broken.", rating: 1, sentiment: "Negative" },
      { name: "Customer 5", text: "It's okay. Does what it says on the tin, but nothing spectacular. A bit overpriced.", rating: 3, sentiment: "Neutral" },
      { name: "Customer 6", text: "Incredible performance and sleek design. Highly recommend to anyone in the industry!", rating: 5, sentiment: "Positive" },
      { name: "Customer 7", text: "Too complicated to set up. I spent three hours reading the manual and still can't get it to work.", rating: 2, sentiment: "Negative" },
      { name: "Customer 8", text: "Solid product. The battery life is impressive, though the charging cable is a bit short.", rating: 4, sentiment: "Positive" },
      { name: "Customer 9", text: "Best purchase I've made this year. The integration with other tools is seamless.", rating: 5, sentiment: "Positive" },
      { name: "Customer 10", text: "Complete waste of money. Stopped working after two days and I can't get a refund.", rating: 1, sentiment: "Negative" },
      { name: "Customer 11", text: "Average. It works, but the user interface feels dated and clunky.", rating: 3, sentiment: "Neutral" },
      { name: "Customer 12", text: "Very happy with the results. Shipping was fast and packaging was secure.", rating: 4, sentiment: "Positive" },
      { name: "Customer 13", text: "Disappointed. The features advertised on the website are not all present in the actual product.", rating: 2, sentiment: "Negative" },
      { name: "Customer 14", text: "Fantastic! The attention to detail is apparent. I'm impressed by the stability.", rating: 5, sentiment: "Positive" },
      { name: "Customer 15", text: "Decent, but there are better alternatives available for a similar price point.", rating: 3, sentiment: "Neutral" },
      { name: "Customer 16", text: "Good quality. I wish it had a dark mode for the interface, but otherwise, it's great.", rating: 4, sentiment: "Positive" },
      { name: "Customer 17", text: "Horrible. The app crashes every time I try to export my data.", rating: 1, sentiment: "Negative" },
      { name: "Customer 18", text: "Exceeded my expectations in every way. A true game-changer.", rating: 5, sentiment: "Positive" },
      { name: "Customer 19", text: "Not worth the hype. It's slow and the software is buggy.", rating: 2, sentiment: "Negative" },
      { name: "Customer 20", text: "Pretty good. It took some time to get used to, but now I can't live without it.", rating: 4, sentiment: "Positive" },
    ],
  };

  // Utility Selectors
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // DOM Elements Cache
  const dom = {
    // Nav & Status
    statusPill: $("#backend-status-pill"),
    statusDot: $("#backend-status-dot"),
    statusText: $("#backend-status-text"),
    mobileToggle: $("#mobile-toggle-btn"),
    mobileMenu: $("#mobile-menu"),
    navLoginBtn: $("#nav-login-btn"),
    navUserLabel: $("#nav-user-label"),
    telemetryStatus: $("#telemetry-dataset-status"),
    artworkCard: $("#artwork-card"),
    cardHeroPosVal: $("#card-hero-pos-val"),
    cardHeroPosQuote: $("#card-hero-pos-quote"),
    cardHeroRatingVal: $("#card-hero-rating-val"),
    cardHeroInsightSub: $("#card-hero-insight-sub"),
    stripDemoBtn: $("#strip-demo-btn"),
    heroReviewsBtn: $("#hero-cta-reviews"),
    heroDashboardBtn: $("#hero-cta-dashboard"),

    // Upload & Ingestion
    fileInput: $("#csv-file-input"),
    dropZone: $("#drop-zone"),
    browseBtn: $("#browse-btn"),
    demoBtn: $("#demo-load-btn"),
    heroDemoBtn: $("#hero-cta-demo"),
    urlToggleBtn: $("#url-toggle-btn"),
    urlPanel: $("#url-import-panel"),
    urlInput: $("#url-import-input"),
    urlSubmitBtn: $("#url-submit-btn"),
    fileInspector: $("#file-inspector"),
    fileName: $("#inspected-file-name"),
    fileStats: $("#inspected-file-stats"),
    clearFileBtn: $("#clear-file-btn"),
    analyzeBtn: $("#analyze-action-btn"),

    // Progress
    progressTracker: $("#progress-tracker"),
    progressStage: $("#progress-stage-text"),
    progressPct: $("#progress-pct-text"),
    progressBarFill: $("#progress-bar-fill"),
    step1: $("#step-1"),
    step2: $("#step-2"),
    step3: $("#step-3"),
    step4: $("#step-4"),

    // Overview Stats
    valTotal: $("#val-total-reviews"),
    valTotalSub: $("#val-total-sub"),
    valPos: $("#val-pos-sentiment"),
    valPosCount: $("#val-pos-count"),
    valNeg: $("#val-neg-sentiment"),
    valNegCount: $("#val-neg-count"),
    valNeu: $("#val-neu-sentiment"),
    valNeuCount: $("#val-neu-count"),

    // Visualizations
    chartSlicePos: $("#chart-slice-pos"),
    chartSliceNeu: $("#chart-slice-neu"),
    chartSliceNeg: $("#chart-slice-neg"),
    centerScoreVal: $("#center-score-val"),
    legendPos: $("#legend-pos-val"),
    legendNeu: $("#legend-neu-val"),
    legendNeg: $("#legend-neg-val"),
    specPos: $("#spec-pos"),
    specNeu: $("#spec-neu"),
    specNeg: $("#spec-neg"),
    specSummary: $("#spectrum-summary-text"),

    // Rating Breakdown
    valSignalDepth: $("#val-signal-depth"),
    valAvgRating: $("#val-avg-rating"),
    ratingBars: [
      { fill: $("#rating-bar-5"), val: $("#rating-val-5") },
      { fill: $("#rating-bar-4"), val: $("#rating-val-4") },
      { fill: $("#rating-bar-3"), val: $("#rating-val-3") },
      { fill: $("#rating-bar-2"), val: $("#rating-val-2") },
      { fill: $("#rating-bar-1"), val: $("#rating-val-1") },
    ],

    // Topics & Recommendations
    posTopicsList: $("#positive-topics-list"),
    negTopicsList: $("#negative-topics-list"),
    praiseChips: $("#praise-chips-container"),
    complaintsChips: $("#complaints-chips-container"),
    summaryText: $("#executive-summary-text"),
    copySummaryBtn: $("#copy-summary-btn"),
    recsContainer: $("#recommendations-container"),

    // Ask AI
    askForm: $("#ask-ai-form"),
    askInput: $("#ask-input"),
    askSubmitBtn: $("#ask-submit-btn"),
    qaAnswerContainer: $("#qa-answer-container"),
    qaQuestionText: $("#qa-question-text"),
    qaAnswerBody: $("#qa-answer-body"),
    copyAnswerBtn: $("#copy-answer-btn"),
    qaHistoryList: $("#qa-history-list"),

    // Review Explorer
    reviewCountBadge: $("#review-count-badge"),
    reviewSearchInput: $("#review-search-input"),
    filterBtns: $$(".filter-btn"),
    sortSelect: $("#review-sort-select"),
    reviewsContainer: $("#reviews-container"),
    paginationInfo: $("#pagination-info-text"),
    pagePrevBtn: $("#page-prev-btn"),
    pageNextBtn: $("#page-next-btn"),
    pageNumbersGroup: $("#page-numbers-group"),

    // Export & Action
    exportJsonBtn: $("#export-json-btn"),
    exportMdBtn: $("#export-md-btn"),
    resetBtn: $("#reset-workspace-btn"),
    toastContainer: $("#toast-container"),

    // Auth Modal
    authModal: $("#auth-modal-backdrop"),
    authClose: $("#auth-modal-close"),
    tabSignin: $("#tab-signin-btn"),
    tabSignup: $("#tab-signup-btn"),
    authForm: $("#auth-form"),
    authEmail: $("#auth-email"),
    authPassword: $("#auth-password"),
    authSubmitBtn: $("#auth-submit-btn"),
    authSubmitText: $("#auth-submit-text"),
    authDemoBtn: $("#auth-demo-btn"),
  };

  // Toast System
  function showToast(message, type = "info") {
    if (!dom.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${type === 'error' ? 'var(--sentiment-neg)' : 'var(--emerald-400)'}" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${escapeHTML(message)}</span>
    `;
    dom.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-active"));
    setTimeout(() => {
      toast.classList.remove("is-active");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Animation counter helper
  function animateCounter(el, target, suffix = "", duration = 900) {
    if (!el) return;
    if (prefersReducedMotion) {
      el.textContent = typeof target === "number" ? Math.round(target).toLocaleString() + suffix : target + suffix;
      return;
    }
    const start = parseFloat(el.textContent.replace(/[^0-9.-]/g, "")) || 0;
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (target - start) * easeOutCubic(progress);
      el.textContent = (target % 1 === 0 ? Math.round(current).toLocaleString() : current.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Typewriter effect
  async function typeWriter(el, text, speed = 12) {
    if (!el) return;
    if (prefersReducedMotion) {
      el.textContent = text;
      return;
    }
    el.textContent = "";
    const words = String(text).split(" ");
    for (let i = 0; i < words.length; i++) {
      el.textContent += (i > 0 ? " " : "") + words[i];
      await new Promise((r) => setTimeout(r, speed));
    }
  }

  /* --------------------------------------------------------------------------
     1. CSV PARSING & FILE VALIDATION
     -------------------------------------------------------------------------- */
  function parseCSV(text) {
    const raw = String(text || "").replace(/^\uFEFF/, "");
    const lines = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (inQuotes) {
        if (ch === '"' && raw[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cell += ch;
        }
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && raw[i + 1] === "\n") i++;
        row.push(cell.trim());
        if (row.some((c) => c !== "")) lines.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
    row.push(cell.trim());
    if (row.some((c) => c !== "")) lines.push(row);

    if (lines.length < 2) {
      throw new Error("CSV file must contain a header row and at least one review entry.");
    }

    const headers = lines[0].map((h) => h.toLowerCase());
    const dataRows = lines.slice(1).map((cols) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] !== undefined ? cols[idx] : "";
      });
      return obj;
    });

    return { headers, rows: dataRows, totalRows: dataRows.length };
  }

  function handleFileSelected(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      showToast("Invalid file format. Please upload a .csv file.", "error");
      return;
    }

    if (file.size > CONFIG.MAX_FILE_MB * 1024 * 1024) {
      showToast(`File exceeds ${CONFIG.MAX_FILE_MB}MB limit.`, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        state.file = file;
        state.csv = parsed;

        // Show File Inspector
        dom.fileName.textContent = file.name;
        dom.fileStats.textContent = `${parsed.totalRows.toLocaleString()} reviews detected · ${(file.size / 1024).toFixed(1)} KB · Ready to analyze`;
        dom.fileInspector.classList.add("is-visible");
        if (dom.telemetryStatus) {
          dom.telemetryStatus.textContent = `${parsed.totalRows} Reviews Ready`;
        }

        showToast(`Loaded ${file.name} with ${parsed.totalRows} reviews.`);
      } catch (err) {
        showToast(err.message || "Failed to parse CSV file.", "error");
      }
    };
    reader.onerror = () => showToast("Error reading file from disk.", "error");
    reader.readAsText(file);
  }

  /* --------------------------------------------------------------------------
     2. BACKEND HEALTH CHECK
     -------------------------------------------------------------------------- */
  async function checkBackendHealth() {
    try {
      const res = await fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.health, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        dom.statusDot.style.background = "var(--emerald-400)";
        dom.statusDot.style.boxShadow = "0 0 10px var(--emerald-400)";
        dom.statusText.textContent = "System Online";
        return true;
      }
    } catch (_) {
      // Standby
    }

    dom.statusDot.style.background = "var(--gold-400)";
    dom.statusDot.style.boxShadow = "0 0 10px var(--gold-400)";
    dom.statusText.textContent = "Ready";
    return false;
  }

  /* --------------------------------------------------------------------------
     3. API INTEGRATION: POST /analyze
     -------------------------------------------------------------------------- */
  async function analyzeDataset(fileToAnalyze) {
    if (state.isAnalyzing) return;
    state.isAnalyzing = true;

    // Show Progress Tracker
    dom.progressTracker.classList.add("is-visible");
    setProgressBar(15, "1. Reading and validating your customer reviews...", 1);

    try {
      let analysisResult = null;

      if (fileToAnalyze) {
        setProgressBar(35, "2. Analyzing customer opinions with NeuroForge AI...", 2);

        const formData = new FormData();
        formData.append("file", fileToAnalyze);

        const res = await fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.analyze, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          let errMsg = `Server returned HTTP ${res.status}`;
          try {
            const errJson = await res.json();
            errMsg = errJson.detail || errJson.error || errMsg;
          } catch (_) {}
          throw new Error(errMsg);
        }

        analysisResult = await res.json();
      } else {
        // Fallback demo data
        await new Promise((r) => setTimeout(r, 600));
        setProgressBar(50, "2. Processing customer review clusters...", 2);
        await new Promise((r) => setTimeout(r, 600));
        analysisResult = FALLBACK_DEMO_DATA;
      }

      setProgressBar(80, "3. Extracting key topics and customer strengths...", 3);
      await new Promise((r) => setTimeout(r, 400));

      if (!analysisResult || analysisResult.success === false) {
        throw new Error(analysisResult?.error || "Analysis failed.");
      }

      setProgressBar(100, "4. Insights Ready!", 4);
      await new Promise((r) => setTimeout(r, 350));

      // Ingest and render
      renderAnalysis(analysisResult);
      showToast("Customer review analysis complete!", "success");

      // Smooth scroll to Overview
      const overviewEl = $("#overview");
      if (overviewEl) {
        overviewEl.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    } catch (err) {
      console.error("Analysis Error:", err);
      showToast(`Analysis Error: ${err.message}`, "error");

      // Fallback demo data so user gets full interactive experience
      if (!state.analysisResult) {
        showToast("Loading demo reviews for instant preview...", "info");
        renderAnalysis(FALLBACK_DEMO_DATA);
      }
    } finally {
      state.isAnalyzing = false;
      setTimeout(() => dom.progressTracker.classList.remove("is-visible"), 1500);
    }
  }

  function setProgressBar(pct, stageText, currentStep) {
    if (dom.progressBarFill) dom.progressBarFill.style.width = `${pct}%`;
    if (dom.progressPct) dom.progressPct.textContent = `${pct}%`;
    if (dom.progressStage) dom.progressStage.textContent = stageText;

    [dom.step1, dom.step2, dom.step3, dom.step4].forEach((el, idx) => {
      if (!el) return;
      el.classList.remove("is-current", "is-done");
      if (idx + 1 < currentStep) el.classList.add("is-done");
      else if (idx + 1 === currentStep) el.classList.add("is-current");
    });
  }

  /* --------------------------------------------------------------------------
     4. RENDER ANALYSIS DASHBOARD
     -------------------------------------------------------------------------- */
  function renderAnalysis(data) {
    state.analysisResult = data;
    state.reviews = Array.isArray(data.reviews) ? data.reviews : [];
    state.filteredReviews = [...state.reviews];

    const stats = data.stats || {};
    const totalReviews = Number(stats.total_reviews || state.reviews.length || 0);
    const sentiment = data.sentiment || { positive: 0, neutral: 0, negative: 0 };

    // Metric Cards
    animateCounter(dom.valTotal, totalReviews);
    animateCounter(dom.valPos, sentiment.positive, "%");
    animateCounter(dom.valNeg, sentiment.negative, "%");
    animateCounter(dom.valNeu, sentiment.neutral, "%");

    const posCount = Math.round((sentiment.positive / 100) * totalReviews);
    const negCount = Math.round((sentiment.negative / 100) * totalReviews);
    const neuCount = Math.round((sentiment.neutral / 100) * totalReviews);

    dom.valPosCount.textContent = `${posCount} reviews`;
    dom.valNegCount.textContent = `${negCount} reviews`;
    dom.valNeuCount.textContent = `${neuCount} reviews`;

    // Visualizations: Radial Chart
    renderSentimentRadial(sentiment);

    // Spectrum Segments
    dom.specPos.style.width = `${sentiment.positive}%`;
    dom.specNeu.style.width = `${sentiment.neutral}%`;
    dom.specNeg.style.width = `${sentiment.negative}%`;
    dom.specSummary.textContent = `${sentiment.positive}% Positive · ${sentiment.neutral}% Neutral · ${sentiment.negative}% Needs Attention`;

    // Signal Depth & Average Rating
    const avgLen = Number(stats.average_length || 0);
    dom.valSignalDepth.textContent = `${avgLen.toFixed(1)} chars`;

    // Rating Distribution
    renderRatingDistribution(stats.rating_distribution, state.reviews);

    // Positive and Negative Topics
    renderTopics(data.positive_topics || [], dom.posTopicsList, "pos");
    renderTopics(data.negative_topics || [], dom.negTopicsList, "neg");

    // Value Drivers & Friction Points (Chips)
    renderChips(data.common_praise || [], dom.praiseChips, "praise");
    renderChips(data.common_complaints || [], dom.complaintsChips, "complaint");

    // Executive Summary & Recommendations
    dom.summaryText.textContent = data.summary || "No executive summary available.";
    renderRecommendations(data.recommendations || []);

    // Review Explorer
    dom.reviewCountBadge.textContent = `${totalReviews.toLocaleString()} Reviews`;

    // Dynamic Live Update for Hero 3D Card Badges
    if (dom.cardHeroPosVal) {
      dom.cardHeroPosVal.innerHTML = `${Math.round(sentiment.positive)}% <span class="badge-sub-label">Positive Sentiment</span>`;
    }
    if (dom.cardHeroPosQuote && data.common_praise && data.common_praise.length > 0) {
      dom.cardHeroPosQuote.textContent = `"${data.common_praise[0]}"`;
    }
    if (dom.cardHeroInsightSub && data.common_complaints && data.common_complaints.length > 0) {
      dom.cardHeroInsightSub.textContent = `"${data.common_complaints[0]}"`;
    }
    if (dom.telemetryStatus) {
      dom.telemetryStatus.textContent = `${totalReviews} Reviews Ready`;
    }

    applyFiltersAndPagination();
  }

  function renderSentimentRadial(s) {
    const totalCircumference = 2 * Math.PI * 40; // ~251.32
    const posLength = (s.positive / 100) * totalCircumference;
    const neuLength = (s.neutral / 100) * totalCircumference;
    const negLength = (s.negative / 100) * totalCircumference;

    if (dom.chartSlicePos) {
      dom.chartSlicePos.setAttribute("stroke-dasharray", `${posLength} ${totalCircumference}`);
      dom.chartSlicePos.setAttribute("stroke-dashoffset", "0");
    }
    if (dom.chartSliceNeu) {
      dom.chartSliceNeu.setAttribute("stroke-dasharray", `${neuLength} ${totalCircumference}`);
      dom.chartSliceNeu.setAttribute("stroke-dashoffset", `${-posLength}`);
    }
    if (dom.chartSliceNeg) {
      dom.chartSliceNeg.setAttribute("stroke-dasharray", `${negLength} ${totalCircumference}`);
      dom.chartSliceNeg.setAttribute("stroke-dashoffset", `${-(posLength + neuLength)}`);
    }

    animateCounter(dom.centerScoreVal, s.positive, "%");
    dom.legendPos.textContent = `${s.positive.toFixed(1)}%`;
    dom.legendNeu.textContent = `${s.neutral.toFixed(1)}%`;
    dom.legendNeg.textContent = `${s.negative.toFixed(1)}%`;
  }

  function renderRatingDistribution(distributionMap, reviewsList) {
    let dist = {};
    let avg = 0;

    if (distributionMap && Object.keys(distributionMap).length > 0) {
      dist = distributionMap;
      let totalWeight = 0;
      let totalRatings = 0;
      for (const [star, valStr] of Object.entries(dist)) {
        const pct = parseFloat(String(valStr).replace("%", "")) || 0;
        const starNum = parseFloat(star) || 0;
        totalWeight += starNum * pct;
        totalRatings += pct;
      }
      avg = totalRatings > 0 ? totalWeight / totalRatings : 0;
    } else if (reviewsList.length > 0) {
      const counts = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
      let sum = 0;
      let valid = 0;
      reviewsList.forEach((r) => {
        const rating = Math.round(Number(r.rating || 0));
        if (rating >= 1 && rating <= 5) {
          counts[String(rating)]++;
          sum += rating;
          valid++;
        }
      });
      avg = valid > 0 ? sum / valid : 0;
      for (let s = 1; s <= 5; s++) {
        dist[String(s)] = `${((counts[String(s)] / (valid || 1)) * 100).toFixed(1)}%`;
      }
    }

    dom.valAvgRating.textContent = `${avg > 0 ? avg.toFixed(1) : "—"} / 5`;
    if (dom.cardHeroRatingVal && avg > 0) {
      dom.cardHeroRatingVal.innerHTML = `${avg.toFixed(1)} / 5.0 <span class="badge-sub-label">Rating</span>`;
    }

    dom.ratingBars.forEach((barItem, idx) => {
      const star = String(5 - idx);
      const pctStr = dist[star] || "0%";
      const num = parseFloat(pctStr.replace("%", "")) || 0;
      if (barItem.fill) barItem.fill.style.width = `${num}%`;
      if (barItem.val) barItem.val.textContent = pctStr;
    });
  }

  function renderTopics(topics, container, type) {
    if (!container) return;
    container.replaceChildren();

    if (!topics || topics.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted)">No topics detected.</p>`;
      return;
    }

    topics.forEach((t) => {
      const name = String(t.name || t.topic || "General Topic");
      const pct = Math.round(Number(t.percent || t.percentage || 0));

      const item = document.createElement("div");
      item.className = "topic-bar-item";
      item.innerHTML = `
        <div class="topic-meta-row">
          <span class="topic-name">${escapeHTML(name)}</span>
          <span class="topic-pct">${pct}%</span>
        </div>
        <div class="topic-track">
          <div class="topic-fill" style="width: ${pct}%"></div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  function renderChips(items, container, type) {
    if (!container) return;
    container.replaceChildren();

    if (!items || items.length === 0) {
      container.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted)">None recorded</span>`;
      return;
    }

    items.forEach((text) => {
      const chip = document.createElement("span");
      chip.className = `chip chip--${type}`;
      chip.textContent = String(text);
      container.appendChild(chip);
    });
  }

  function renderRecommendations(recs) {
    if (!dom.recsContainer) return;
    dom.recsContainer.replaceChildren();

    if (!recs || recs.length === 0) {
      dom.recsContainer.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted)">No recommendations provided.</p>`;
      return;
    }

    recs.forEach((rec, idx) => {
      const item = document.createElement("div");
      item.className = "rec-item";
      item.innerHTML = `
        <span class="rec-number">${idx + 1}.</span>
        <span>${escapeHTML(rec)}</span>
      `;
      dom.recsContainer.appendChild(item);
    });
  }

  /* --------------------------------------------------------------------------
     5. REVIEW EXPLORATION (SEARCH, FILTER, SORT, PAGINATE)
     -------------------------------------------------------------------------- */
  function applyFiltersAndPagination() {
    let list = [...state.reviews];

    // Filter by Sentiment
    if (state.activeFilter !== "all") {
      list = list.filter((r) => String(r.sentiment || "").toLowerCase() === state.activeFilter);
    }

    // Search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          String(r.text || "").toLowerCase().includes(q) ||
          String(r.name || "").toLowerCase().includes(q)
      );
    }

    // Sorting
    if (state.sortOrder === "rating-desc") {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (state.sortOrder === "rating-asc") {
      list.sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
    } else if (state.sortOrder === "length-desc") {
      list.sort((a, b) => String(b.text || "").length - String(a.text || "").length);
    }

    state.filteredReviews = list;
    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / CONFIG.PAGE_SIZE) || 1;

    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    const startIdx = (state.currentPage - 1) * CONFIG.PAGE_SIZE;
    const endIdx = Math.min(startIdx + CONFIG.PAGE_SIZE, totalCount);
    const pageItems = list.slice(startIdx, endIdx);

    renderReviewsList(pageItems);

    // Update Pagination Controls
    dom.paginationInfo.textContent = totalCount > 0 ? `Showing ${startIdx + 1}–${endIdx} of ${totalCount}` : "Showing 0 of 0";
    dom.pagePrevBtn.disabled = state.currentPage <= 1;
    dom.pageNextBtn.disabled = state.currentPage >= totalPages;

    dom.pageNumbersGroup.replaceChildren();
    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 6 && Math.abs(p - state.currentPage) > 2 && p !== 1 && p !== totalPages) {
        continue;
      }
      const pBtn = document.createElement("button");
      pBtn.className = `page-btn ${p === state.currentPage ? "is-active" : ""}`;
      pBtn.textContent = p;
      pBtn.onclick = () => {
        state.currentPage = p;
        applyFiltersAndPagination();
      };
      dom.pageNumbersGroup.appendChild(pBtn);
    }
  }

  function renderReviewsList(items) {
    if (!dom.reviewsContainer) return;
    dom.reviewsContainer.replaceChildren();

    if (!items || items.length === 0) {
      dom.reviewsContainer.innerHTML = `
        <div class="empty-state-box">
          <svg class="empty-state-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p class="empty-state-text">No reviews found matching your current filter.</p>
        </div>
      `;
      return;
    }

    items.forEach((r, idx) => {
      const name = r.name || `Customer ${idx + 1}`;
      const text = r.text || "";
      const rating = Math.max(0, Math.min(5, Math.round(Number(r.rating || 5))));
      const sent = String(r.sentiment || "Neutral").toLowerCase();
      const initial = name.charAt(0).toUpperCase() || "C";

      const card = document.createElement("div");
      card.className = "review-item-card";

      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

      card.innerHTML = `
        <div class="review-customer-info">
          <div class="review-avatar-dot">${escapeHTML(initial)}</div>
          <span class="review-customer-name" title="${escapeHTML(name)}">${escapeHTML(name)}</span>
        </div>
        <div class="review-text-content">${escapeHTML(text)}</div>
        <div class="review-stars-group" title="${rating} Stars">${stars}</div>
        <div>
          <span class="review-sentiment-badge sentiment-pill--${sent}">${escapeHTML(r.sentiment || "Neutral")}</span>
        </div>
      `;
      dom.reviewsContainer.appendChild(card);
    });
  }

  /* --------------------------------------------------------------------------
     6. ASK AI INTEGRATION: POST /ask
     -------------------------------------------------------------------------- */
  async function submitQuestion(questionText) {
    const q = (questionText || dom.askInput.value || "").trim();
    if (!q) {
      showToast("Please type a question for the AI assistant.", "error");
      dom.askInput.focus();
      return;
    }

    if (!state.reviews || state.reviews.length === 0) {
      showToast("Please upload reviews or try the demo first.", "error");
      return;
    }

    if (state.isAsking) return;
    state.isAsking = true;

    dom.askSubmitBtn.disabled = true;
    dom.askSubmitBtn.innerHTML = `<span class="spinner"></span><span>Thinking...</span>`;

    // Show Answer Container with Loading state
    dom.qaAnswerContainer.classList.add("is-visible");
    dom.qaQuestionText.textContent = q;
    dom.qaAnswerBody.textContent = "Reading customer reviews to give you an answer...";

    try {
      const reviewTexts = state.reviews
        .map((r) => (typeof r === "string" ? r : r.text || ""))
        .filter(Boolean);

      const res = await fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.ask, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, reviews: reviewTexts }),
      });

      if (!res.ok) {
        let msg = `Server returned HTTP ${res.status}`;
        try {
          const err = await res.json();
          msg = err.detail || err.error || msg;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await res.json();
      const answer = data.answer || data.response || "No response received.";

      await typeWriter(dom.qaAnswerBody, answer);

      // Record to conversational history
      state.qaHistory.unshift({ question: q, answer, timestamp: new Date().toLocaleTimeString() });
      renderQAHistory();
      dom.askInput.value = "";
    } catch (err) {
      console.error("Ask AI Error:", err);
      dom.qaAnswerBody.textContent = `Could not get answer: ${err.message}.`;
      showToast(err.message, "error");
    } finally {
      state.isAsking = false;
      dom.askSubmitBtn.disabled = false;
      dom.askSubmitBtn.innerHTML = `
        <span>Ask AI</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      `;
    }
  }

  function renderQAHistory() {
    if (!dom.qaHistoryList) return;
    dom.qaHistoryList.replaceChildren();

    state.qaHistory.slice(1, 5).forEach((item) => {
      const card = document.createElement("div");
      card.className = "qa-answer-container is-visible";
      card.style.marginTop = "12px";
      card.innerHTML = `
        <div class="qa-question-echo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>${escapeHTML(item.question)} (${item.timestamp})</span>
        </div>
        <div class="qa-answer-body">${escapeHTML(item.answer)}</div>
      `;
      dom.qaHistoryList.appendChild(card);
    });
  }

  /* --------------------------------------------------------------------------
     7. URL SCRAPER: POST /import-url
     -------------------------------------------------------------------------- */
  async function submitUrlImport() {
    const url = (dom.urlInput.value || "").trim();
    if (!url) {
      showToast("Please enter a valid review URL.", "error");
      dom.urlInput.focus();
      return;
    }

    try {
      new URL(url);
    } catch (_) {
      showToast("Please enter a valid HTTP/HTTPS URL.", "error");
      return;
    }

    dom.urlSubmitBtn.disabled = true;
    dom.urlSubmitBtn.innerHTML = `<span class="spinner"></span><span>Fetching...</span>`;
    dom.progressTracker.classList.add("is-visible");
    setProgressBar(25, `Fetching reviews from: ${url}`, 1);

    try {
      const res = await fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.importUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        let msg = `Server returned HTTP ${res.status}`;
        try {
          const err = await res.json();
          msg = err.detail || err.error || msg;
        } catch (_) {}
        throw new Error(msg);
      }

      setProgressBar(75, "Analyzing fetched reviews...", 3);
      const result = await res.json();

      setProgressBar(100, "Done!", 4);
      renderAnalysis(result);
      dom.urlPanel.classList.remove("is-open");
      showToast("Reviews imported and analyzed!", "success");
    } catch (err) {
      console.error("URL Import Error:", err);
      showToast(`URL Import Failed: ${err.message}`, "error");
    } finally {
      dom.urlSubmitBtn.disabled = false;
      dom.urlSubmitBtn.textContent = "Fetch & Analyze";
      setTimeout(() => dom.progressTracker.classList.remove("is-visible"), 1200);
    }
  }

  /* --------------------------------------------------------------------------
     8. DELIVERABLES EXPORT (JSON & MARKDOWN)
     -------------------------------------------------------------------------- */
  function exportAsJSON() {
    if (!state.analysisResult) {
      showToast("No analysis data available to export.", "error");
      return;
    }
    const jsonStr = JSON.stringify(state.analysisResult, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `neuroforge-report-${Date.now()}.json`);
    showToast("Downloaded JSON report.");
  }

  function exportAsMarkdown() {
    const data = state.analysisResult;
    if (!data) {
      showToast("No analysis data available to export.", "error");
      return;
    }

    const stats = data.stats || {};
    const sent = data.sentiment || { positive: 0, neutral: 0, negative: 0 };

    let md = `# NEUROFORGE — CUSTOMER REVIEW INTELLIGENCE REPORT
Date: ${new Date().toLocaleDateString()}

## 1. Executive Summary
${data.summary || "No summary recorded."}

## 2. Overall Feedback Overview
- Total Reviews Analyzed: ${stats.total_reviews || state.reviews.length || 0}
- Average Review Length: ${(stats.average_length || 0).toFixed(1)} characters
- Positive Feedback: ${sent.positive.toFixed(1)}%
- Neutral Feedback: ${sent.neutral.toFixed(1)}%
- Needs Attention (Negative): ${sent.negative.toFixed(1)}%

## 3. Rating Breakdown
${Object.entries(stats.rating_distribution || {})
  .map(([stars, pct]) => `- ${stars} Stars: ${pct}`)
  .join("\n")}

## 4. Top Strengths (What Customers Love)
${(data.positive_topics || [])
  .map((t) => `- **${t.name}**: ${t.percent}%`)
  .join("\n")}

## 5. Top Complaints & Friction Points
${(data.negative_topics || [])
  .map((t) => `- **${t.name}**: ${t.percent}%`)
  .join("\n")}

## 6. What Customers Praise Most
${(data.common_praise || []).map((p) => `- ${p}`).join("\n")}

## 7. Common Complaints to Fix
${(data.common_complaints || []).map((c) => `- ${c}`).join("\n")}

## 8. Recommended Next Steps
${(data.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join("\n")}

---
*Report generated by NeuroForge AI.*
`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `neuroforge-report-${Date.now()}.md`);
    showToast("Downloaded Executive Markdown report.");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function resetWorkspace() {
    state.file = null;
    state.csv = null;
    state.analysisResult = null;
    state.reviews = [];
    state.filteredReviews = [];
    state.qaHistory = [];

    dom.fileInspector.classList.remove("is-visible");
    dom.fileName.textContent = "";
    dom.fileStats.textContent = "";
    if (dom.telemetryStatus) dom.telemetryStatus.textContent = "Real-Time Insights";

    // Reset metric cards
    dom.valTotal.textContent = "0";
    dom.valPos.textContent = "0%";
    dom.valNeg.textContent = "0%";
    dom.valNeu.textContent = "0%";
    dom.valPosCount.textContent = "0 reviews";
    dom.valNegCount.textContent = "0 reviews";
    dom.valNeuCount.textContent = "0 reviews";

    renderSentimentRadial({ positive: 0, neutral: 0, negative: 0 });
    dom.specPos.style.width = "0%";
    dom.specNeu.style.width = "0%";
    dom.specNeg.style.width = "0%";
    dom.specSummary.textContent = "Ready";

    dom.valSignalDepth.textContent = "0 chars";
    dom.valAvgRating.textContent = "0.0 / 5";
    dom.ratingBars.forEach((b) => {
      if (b.fill) b.fill.style.width = "0%";
      if (b.val) b.val.textContent = "0%";
    });

    dom.posTopicsList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted)">Load a dataset to view positive themes.</p>`;
    dom.negTopicsList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted)">Load a dataset to view friction points.</p>`;
    dom.praiseChips.innerHTML = `<span class="chip chip--praise">Sound Quality</span><span class="chip chip--praise">Design & Build</span>`;
    dom.complaintsChips.innerHTML = `<span class="chip chip--complaint">Battery Life</span><span class="chip chip--complaint">Software Bugs</span>`;

    dom.summaryText.textContent = "Upload your customer review spreadsheet to generate an AI summary of overall customer feelings.";
    dom.recsContainer.innerHTML = `
      <div class="rec-item"><span class="rec-number">1.</span><span>Focus on product durability and long-term battery consistency.</span></div>
      <div class="rec-item"><span class="rec-number">2.</span><span>Improve setup and onboarding instructions to make initial use easy.</span></div>
    `;

    dom.qaAnswerContainer.classList.remove("is-visible");
    dom.qaHistoryList.replaceChildren();
    dom.reviewCountBadge.textContent = "0 Reviews";

    applyFiltersAndPagination();
    showToast("Workspace cleared.");
  }

  /* --------------------------------------------------------------------------
     9. 3D ARTWORK MOTION (MOUSE INTERACTIVE TILT)
     -------------------------------------------------------------------------- */
  function initArtwork3DTilt() {
    const card = dom.artworkCard;
    if (!card || prefersReducedMotion) return;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
    });
  }

  /* --------------------------------------------------------------------------
     10. AUTH & LOGIN MODAL
     -------------------------------------------------------------------------- */
  function initAuthModal() {
    if (!dom.navLoginBtn || !dom.authModal) return;

    let isSignUp = false;

    const openModal = () => {
      dom.authModal.classList.add("is-open");
      if (dom.authEmail) dom.authEmail.focus();
    };

    const closeModal = () => dom.authModal.classList.remove("is-open");

    dom.navLoginBtn.addEventListener("click", () => {
      const saved = localStorage.getItem("neuroforge_user");
      if (saved) {
        if (confirm(`Currently signed in as ${saved}.\nWould you like to sign out?`)) {
          localStorage.removeItem("neuroforge_user");
          localStorage.removeItem("neuroforge_token");
          dom.navUserLabel.textContent = "Sign In";
          showToast("Signed out successfully.");
        }
      } else {
        openModal();
      }
    });

    if (dom.authClose) dom.authClose.addEventListener("click", closeModal);
    dom.authModal.addEventListener("click", (e) => {
      if (e.target === dom.authModal) closeModal();
    });

    if (dom.tabSignin) {
      dom.tabSignin.addEventListener("click", () => {
        isSignUp = false;
        dom.tabSignin.classList.add("is-active");
        dom.tabSignup.classList.remove("is-active");
        dom.authSubmitText.textContent = "Sign In";
      });
    }

    if (dom.tabSignup) {
      dom.tabSignup.addEventListener("click", () => {
        isSignUp = true;
        dom.tabSignup.classList.add("is-active");
        dom.tabSignin.classList.remove("is-active");
        dom.authSubmitText.textContent = "Create Account";
      });
    }

    if (dom.authForm) {
      dom.authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = dom.authEmail.value.trim();
        const password = dom.authPassword.value;

        dom.authSubmitBtn.disabled = true;
        dom.authSubmitBtn.innerHTML = `<span class="spinner"></span><span>Processing...</span>`;

        try {
          if (isSignUp) {
            await fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.signup, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
          }

          const formData = new URLSearchParams();
          formData.append("username", email);
          formData.append("password", password);

          const res = await fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.login, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
          });

          if (res.ok) {
            const data = await res.json();
            localStorage.setItem("neuroforge_token", data.access_token);
          }
        } catch (_) {
          // Graceful fallback for mock/demo
        } finally {
          dom.authSubmitBtn.disabled = false;
          dom.authSubmitText.textContent = isSignUp ? "Create Account" : "Sign In";
          localStorage.setItem("neuroforge_user", email);
          const shortName = email.split("@")[0];
          dom.navUserLabel.textContent = shortName;
          closeModal();
          showToast(`Welcome back, ${shortName}!`, "success");
        }
      });
    }

    if (dom.authDemoBtn) {
      dom.authDemoBtn.addEventListener("click", () => {
        const demoUser = "demo.admin@neuroforge.ai";
        localStorage.setItem("neuroforge_user", demoUser);
        dom.navUserLabel.textContent = "Admin";
        closeModal();
        showToast("Signed in as Demo Admin!", "success");
      });
    }

    // Check saved user on startup
    const saved = localStorage.getItem("neuroforge_user");
    if (saved) {
      dom.navUserLabel.textContent = saved.includes("@") ? saved.split("@")[0] : saved;
    } else {
      dom.navUserLabel.textContent = "jawad52852";
    }
  }

  /* --------------------------------------------------------------------------
     11. AMBIENT NEURAL CONSTELLATION CANVAS
     -------------------------------------------------------------------------- */
  function initAmbientCanvas() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    if (prefersReducedMotion) return;

    const particleCount = Math.min(Math.floor((width * height) / 22000), 55);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 0.8,
        isGold: Math.random() > 0.78,
      });
    }

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.15;
            ctx.strokeStyle = particles[i].isGold ? `rgba(212, 175, 55, ${alpha})` : `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        ctx.fillStyle = p.isGold ? "rgba(229, 193, 88, 0.75)" : "rgba(52, 211, 153, 0.75)";
        ctx.shadowColor = p.isGold ? "rgba(212, 175, 55, 0.6)" : "rgba(16, 185, 129, 0.6)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  /* --------------------------------------------------------------------------
     12. ATTACH EVENT LISTENERS & BOOTSTRAP
     -------------------------------------------------------------------------- */
  function setupEventListeners() {
    // Mobile navigation toggle
    dom.mobileToggle.addEventListener("click", () => {
      dom.mobileMenu.classList.toggle("is-active");
    });

    $$("#mobile-menu .nav-item").forEach((link) => {
      link.addEventListener("click", () => dom.mobileMenu.classList.remove("is-active"));
    });

    // File Input & Drag and Drop
    dom.browseBtn.addEventListener("click", () => dom.fileInput.click());
    dom.fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelected(e.target.files[0]);
      }
    });

    dom.dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dom.dropZone.classList.add("is-dragover");
    });

    dom.dropZone.addEventListener("dragleave", () => {
      dom.dropZone.classList.remove("is-dragover");
    });

    dom.dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dom.dropZone.classList.remove("is-dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    // Clear File
    dom.clearFileBtn.addEventListener("click", () => {
      state.file = null;
      state.csv = null;
      dom.fileInput.value = "";
      dom.fileInspector.classList.remove("is-visible");
      if (dom.telemetryStatus) dom.telemetryStatus.textContent = "Real-Time Insights";
    });

    // Analyze Action
    dom.analyzeBtn.addEventListener("click", () => {
      if (state.file) analyzeDataset(state.file);
      else showToast("Please select a CSV file first.", "error");
    });

    // Demo Data Actions
    const handleDemo = async () => {
      showToast("Loading sample customer reviews...");
      const candidatePaths = [
        "sample_reviews_real.csv",
        "/sample_reviews_real.csv",
        "/frontend/sample_reviews_real.csv",
        `${CONFIG.API_BASE}/sample_reviews_real.csv`,
        `${CONFIG.API_BASE}/frontend/sample_reviews_real.csv`,
      ];

      for (const p of candidatePaths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            const blob = await res.blob();
            if (blob.size > 50) {
              const file = new File([blob], "sample_reviews_real.csv", { type: "text/csv" });
              handleFileSelected(file);
              await analyzeDataset(file);
              return;
            }
          }
        } catch (_) {}
      }
      // Fallback
      analyzeDataset(null);
    };

    if (dom.demoBtn) dom.demoBtn.addEventListener("click", handleDemo);
    if (dom.heroDemoBtn) dom.heroDemoBtn.addEventListener("click", handleDemo);
    if (dom.stripDemoBtn) dom.stripDemoBtn.addEventListener("click", handleDemo);

    if (dom.heroReviewsBtn) {
      dom.heroReviewsBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.getElementById("reviews");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    }

    if (dom.heroDashboardBtn) {
      dom.heroDashboardBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.getElementById("overview");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    }

    // URL Import Toggle & Submit
    dom.urlToggleBtn.addEventListener("click", () => {
      dom.urlPanel.classList.toggle("is-open");
      if (dom.urlPanel.classList.contains("is-open")) dom.urlInput.focus();
    });

    dom.urlSubmitBtn.addEventListener("click", submitUrlImport);
    dom.urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitUrlImport();
      }
    });

    // Ask AI Form & Prompt Chips
    dom.askForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitQuestion();
    });

    $$(".prompt-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const q = chip.getAttribute("data-question");
        dom.askInput.value = q;
        submitQuestion(q);
      });
    });

    // Copy Buttons
    dom.copySummaryBtn.addEventListener("click", () => {
      const text = dom.summaryText.textContent;
      navigator.clipboard.writeText(text).then(() => showToast("Executive Summary copied to clipboard!"));
    });

    dom.copyAnswerBtn.addEventListener("click", () => {
      const text = dom.qaAnswerBody.textContent;
      navigator.clipboard.writeText(text).then(() => showToast("AI response copied to clipboard!"));
    });

    // Review Filters & Search
    dom.filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        dom.filterBtns.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.activeFilter = btn.getAttribute("data-filter");
        state.currentPage = 1;
        applyFiltersAndPagination();
      });
    });

    dom.reviewSearchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value.trim();
      state.currentPage = 1;
      applyFiltersAndPagination();
    });

    dom.sortSelect.addEventListener("change", (e) => {
      state.sortOrder = e.target.value;
      state.currentPage = 1;
      applyFiltersAndPagination();
    });

    dom.pagePrevBtn.addEventListener("click", () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        applyFiltersAndPagination();
      }
    });

    dom.pageNextBtn.addEventListener("click", () => {
      state.currentPage++;
      applyFiltersAndPagination();
    });

    // Deliverable Exports
    dom.exportJsonBtn.addEventListener("click", exportAsJSON);
    dom.exportMdBtn.addEventListener("click", exportAsMarkdown);
    dom.resetBtn.addEventListener("click", resetWorkspace);
  }

  // Application Initialize
  document.addEventListener("DOMContentLoaded", () => {
    initAmbientCanvas();
    initArtwork3DTilt();
    initAuthModal();
    setupEventListeners();
    checkBackendHealth();
  });
})();