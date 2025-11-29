
// test_page.js - fully fixed, robust, and integrated version
// Tries multiple JSON filenames, safe DOM guards, timer, score storage and redirect to submit.html
const JSON_CANDIDATES = [
  "./html_css_js_mcq_300.json",
  "./html_mcq_100.json",
  "./html_mcq_300.json",
  "./html_mcq.json"
];
const NUM_TO_SHOW = 15; // number of questions to present

document.addEventListener("DOMContentLoaded", () => {
  // ---- Element refs ----
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");
  const resetBtn = document.getElementById("resetBtn");

  const quesNumber = document.getElementById("quesNumber");
  const quesText = document.getElementById("question-text");

  const opts = [
    document.getElementById("opt0"),
    document.getElementById("opt1"),
    document.getElementById("opt2"),
    document.getElementById("opt3")
  ];

  // Timer DOM (optional)
  const timerBox = document.getElementById('exam-timer');
  const timerValueEl = document.getElementById('timer-value');

  // ---- Basic DOM guard ----
  const missing = [];
  if (!quesNumber) missing.push("quesNumber");
  if (!quesText) missing.push("question-text");
  opts.forEach((o, i) => { if (!o) missing.push(`opt${i}`); });
  if (!nextBtn) missing.push("nextBtn");
  if (!submitBtn) missing.push("submitBtn");
  if (!resetBtn) missing.push("resetBtn");

  if (missing.length > 0) {
    console.error("Missing required DOM elements:", missing);
    if (quesText) quesText.textContent = "Page setup error — check console for missing elements.";
    return; // stop initialization to avoid runtime errors
  }

  // ---- State ----
  let allQuestions = [];
  let questions = []; // prepared (shuffled options + correctIndex)
  let current = 0;
  let score = 0;

  // hide action buttons initially
  nextBtn.style.display = "none";
  submitBtn.style.display = "none";
  resetBtn.style.display = "none";

  // ---- Utilities ----
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function prepareQuestion(q) {
    const optsCopy = Array.isArray(q.options) ? q.options.slice() : [];
    shuffle(optsCopy);
    const correctIndex = optsCopy.findIndex(o => o === q.answer);
    return { id: q.id, question: q.question, options: optsCopy, correctIndex };
  }

  // ---- Load JSON with fallbacks ----
  async function tryLoadCandidates() {
    for (const p of JSON_CANDIDATES) {
      try {
        const res = await fetch(p, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("Not an array or empty");
        return { data, path: p };
      } catch (err) {
        console.warn(`Failed to load ${p}: ${err.message}`);
      }
    }
    throw new Error("No JSON file found among candidates");
  }

  async function loadQuestions() {
    try {
      const { data, path } = await tryLoadCandidates();
      allQuestions = data;
      // shuffle pool and pick NUM_TO_SHOW
      shuffle(allQuestions);
      const chosen = allQuestions.slice(0, Math.min(NUM_TO_SHOW, allQuestions.length));
      questions = chosen.map(q => prepareQuestion(q));

      current = 0;
      score = 0;

      // ensure timer visible when quiz loads
      if (timerBox) timerBox.style.display = 'flex';

      renderQuestion();
      console.log(`Loaded ${allQuestions.length} questions from ${path}; using ${questions.length} for quiz.`);
    } catch (err) {
      console.error("Error loading questions:", err);
      if (quesText) quesText.textContent = "Failed to load questions. See console.";
    }
  }

  // call load
  loadQuestions();

  // ---- Render ----
  function renderQuestion() {
    const q = questions[current];
    if (!q) {
      quesNumber.textContent = "";
      quesText.textContent = "No question available.";
      return;
    }

    quesNumber.textContent = (current + 1) + ".";
    quesText.textContent = q.question || "";

    opts.forEach((btn, i) => {
      btn.value = q.options[i] || "";
      btn.disabled = false;
      btn.style.background = "";
      btn.style.color = "";
      btn.style.cursor = "pointer";
      btn.dataset.index = i;
      btn.onclick = () => handleSelection(i);
    });

    nextBtn.style.display = "none";
    submitBtn.style.display = "none";
    resetBtn.style.display = "none";
  }

  // ---- Selection handling ----
  function handleSelection(selectedIndex) {
    const q = questions[current];
    if (!q) return;

    opts.forEach(b => { b.disabled = true; b.style.cursor = "default"; });

    const correctIndex = q.correctIndex;
    if (selectedIndex === correctIndex) {
      opts[selectedIndex].style.background = "#4CAF50";
      opts[selectedIndex].style.color = "#fff";
      score++;
    } else {
      opts[selectedIndex].style.background = "#EF4444";
      opts[selectedIndex].style.color = "#fff";
      if (typeof correctIndex === 'number' && opts[correctIndex]) {
        opts[correctIndex].style.background = "#4CAF50";
        opts[correctIndex].style.color = "#fff";
      }
    }

    if (current === questions.length - 1) {
      submitBtn.style.display = "inline-block";
      resetBtn.style.display = "inline-block";
    } else {
      nextBtn.style.display = "inline-block";
    }
  }

  // ---- Buttons ----
  nextBtn.addEventListener("click", () => {
    if (current < questions.length - 1) {
      current++;
      renderQuestion();
    }
  });

  submitBtn.addEventListener("click", () => {
    // stop timer and hide
    if (window.__examTimer && typeof window.__examTimer.stop === 'function') {
      window.__examTimer.stop();
    }
    if (timerBox) timerBox.style.display = 'none';

    // store result and redirect to submit page
    const payload = {
      score: score,
      total: questions.length,
      percent: Math.round((score / questions.length) * 100),
      timestamp: Date.now(),
      timeLeft: window.__examTimer ? window.__examTimer.remainingSeconds() : null,
      timedOut: false
    };
    try { localStorage.setItem('lastQuizResult', JSON.stringify(payload)); } catch (e) { console.warn(e); }

    // redirect
    window.location.href = 'submit.html';
  });

  resetBtn.addEventListener("click", () => {
    if (window.__examTimer && typeof window.__examTimer.reset === 'function') {
      window.__examTimer.reset();
    }
    if (timerBox) timerBox.style.display = 'flex';
    loadQuestions();
  });

  // ---- Timer module ----
  (function timerModule() {
    const TOTAL_SECONDS = 15 * 60; // 15 minutes
    let remaining = TOTAL_SECONDS;
    let timerInterval = null;
    let timerStarted = false;

    function fmt(s) {
      const mm = Math.floor(s / 60).toString().padStart(2, '0');
      const ss = (s % 60).toString().padStart(2, '0');
      return `${mm}:${ss}`;
    }

    function updateDisplay() {
      if (timerValueEl) timerValueEl.textContent = fmt(remaining);
      if (timerBox) {
        if (remaining <= 30) {
          timerBox.classList.add('low');
          timerValueEl.style.color = '#ffdddd';
          timerValueEl.style.textShadow = '0 0 8px rgba(255,0,0,0.6)';
        } else {
          timerBox.classList.remove('low');
          timerValueEl.style.color = '';
          timerValueEl.style.textShadow = '';
        }
      }
    }

    function timeUp() {
      clearInterval(timerInterval);
      timerInterval = null;
      timerStarted = false;

      try { opts.forEach(b => { b.disabled = true; b.style.cursor = 'default'; }); } catch (e) {}

      if (submitBtn) submitBtn.style.display = "inline-block";
      if (resetBtn) resetBtn.style.display = "inline-block";
      if (nextBtn) nextBtn.style.display = "none";

      if (timerBox) timerBox.style.display = 'none';

      const payload = {
        score,
        total: questions.length,
        percent: Math.round((score / questions.length) * 100),
        timestamp: Date.now(),
        timeLeft: 0,
        timedOut: true
      };
      try { localStorage.setItem('lastQuizResult', JSON.stringify(payload)); } catch (e) {}

      // redirect to submit
      try { window.location.href = 'submit.html'; } catch (e) { alert('Time is up!'); }
    }

    function startTimer() {
      if (timerStarted) return;
      timerStarted = true;
      if (!remaining || remaining <= 0) remaining = TOTAL_SECONDS;
      updateDisplay();
      timerInterval = setInterval(() => {
        remaining--;
        updateDisplay();
        if (remaining <= 0) timeUp();
      }, 1000);
    }

    function stopTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      timerStarted = false;
    }

    function resetTimer() {
      stopTimer();
      remaining = TOTAL_SECONDS;
      updateDisplay();
    }

    // Wait for questions to be ready then start
    (function waitAndStart() {
      const waitInterval = setInterval(() => {
        if (Array.isArray(questions) && questions.length > 0) {
          clearInterval(waitInterval);
          startTimer();
        }
      }, 200);
      setTimeout(() => clearInterval(waitInterval), 20000);
    })();

    // expose controls
    window.__examTimer = {
      start: startTimer,
      stop: stopTimer,
      reset: resetTimer,
      remainingSeconds: () => remaining
    };
  })();

}); // DOMContentLoaded end