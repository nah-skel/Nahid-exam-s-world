// Nahid Exam's World - frontend-only exam app (localStorage)
// Updated: admin must login before seeing questions list.
// Admin-only controls (set default time, view attempts, export, clear).
// NOTE: This is client-side protection (UI). For true security move admin auth to server.

const QUESTIONS = [
  { q: "HTML কী জন্য ব্যবহৃত হয়?", options: ["স্টাইল", "স্ট্রাকচার", "ডাটাবেস", "সার্ভার"], answer: 1 },
  { q: "CSS দিয়ে আমরা কি করি?", options: ["অ্যানিমেশন", "স্টাইল প্রয়োগ", "ডাটাবেস কুয়েরি", "ইমেইল পাঠাই"], answer: 1 },
  { q: "JavaScript প্রধানত কোথায় চলবে?", options: ["সার্ভারে", "ব্রাউজারে", "ডাটাবেসে", "নেটওয়ার্কে"], answer: 1 },
  { q: "localStorage কি?", options: ["ব্রাউজারের স্থায়ী স্টোরেজ", "র‍্যাম মেমোরি", "সার্ভার স্টোরেজ", "টাইমার"], answer: 0 },
  { q: "DOM মানে কি?", options: ["Document Object Model", "Data Output Method", "Desktop OS Manager", "Direct Object Map"], answer: 0 }
];

const STORAGE_KEY = "nahid_exam_attempts_v1";
const SETTINGS_KEY = "nahid_exam_settings_v1";
const ADMIN_PASS = "admin123";

/* --- storage helpers --- */
function loadAttempts(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){
    console.error(e);
    return {};
  }
}
function saveAttempts(obj){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

/* Settings (admin controlled) */
function loadSettings(){
  try{
    const raw = localStorage.getItem(SETTINGS_KEY);
    if(!raw) return { defaultTimeMinutes: 5 };
    return JSON.parse(raw);
  }catch(e){
    console.error("settings load", e);
    return { defaultTimeMinutes: 5 };
  }
}
function saveSettings(s){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

/* --- UI refs --- */
const studentIdInput = document.getElementById("studentId");
const startBtn = document.getElementById("startBtn");
const entryMsg = document.getElementById("entryMsg");
const currentDefaultTimeEl = document.getElementById("currentDefaultTime");

const quizSection = document.getElementById("quizSection");
const questionsDiv = document.getElementById("questions");
const quizForm = document.getElementById("quizForm");
const timerEl = document.getElementById("timer");
const currentIdEl = document.getElementById("currentId");

const resultSection = document.getElementById("resultSection");
const scoreText = document.getElementById("scoreText");
const doneBtn = document.getElementById("doneBtn");

const viewIdInput = document.getElementById("viewId");
const viewBtn = document.getElementById("viewBtn");
const viewMsg = document.getElementById("viewMsg");

const adminPassInput = document.getElementById("adminPass");
const adminBtn = document.getElementById("adminBtn");
const adminControlsDiv = document.getElementById("adminControls");
const defaultTimeInput = document.getElementById("defaultTimeInput");
const setDefaultTimeBtn = document.getElementById("setDefaultTimeBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const exportBtn = document.getElementById("exportBtn");
const allAttemptsDiv = document.getElementById("allAttempts");

const showQuestionsBtn = document.getElementById("showQuestionsBtn");
const adminQuestionsDiv = document.getElementById("adminQuestions");

/* --- Timer state --- */
let timerInterval = null;
let remainingSeconds = 0;
let examRunning = false;

/* --- Settings load --- */
let settings = loadSettings();
function refreshSettingsUI(){
  currentDefaultTimeEl.textContent = settings.defaultTimeMinutes;
  if(defaultTimeInput) defaultTimeInput.value = settings.defaultTimeMinutes;
}

/* --- Start exam (students cannot change time) --- */
startBtn.addEventListener("click", () => {
  entryMsg.textContent = "";
  const id = (studentIdInput.value || "").trim();
  if(!id){ entryMsg.textContent = "আইডি দিন"; return; }

  const attempts = loadAttempts();
  if(attempts[id]){
    entryMsg.textContent = "এই আইডি দিয়ে ইতিমধ্যে পরীক্ষা করা হয়েছে। ফল দেখতে 'ফল দেখুন' অংশে আইডি দিন।";
    return;
  }

  // Prepare quiz
  studentIdInput.disabled = true;
  renderQuestions();
  document.getElementById("entry").classList.add("hidden");
  quizSection.classList.remove("hidden");

  currentIdEl.textContent = `ID: ${id} — সময়সীমা: ${settings.defaultTimeMinutes} মিনিট`;
  startTimer(settings.defaultTimeMinutes * 60);
  examRunning = true;
});

/* --- Render questions for student (same as before) --- */
function renderQuestions(){
  questionsDiv.innerHTML = "";
  QUESTIONS.forEach((it, idx) => {
    const card = document.createElement("div");
    card.className = "question-card";
    const q = document.createElement("h4");
    q.textContent = `${idx+1}. ${it.q}`;
    card.appendChild(q);

    const opts = document.createElement("div");
    opts.className = "options";
    it.options.forEach((opt, oi) => {
      const id = `q${idx}_opt${oi}`;
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${idx}`;
      input.value = oi;
      input.id = id;
      label.appendChild(input);
      const span = document.createElement("span");
      span.style.marginLeft = "8px";
      span.textContent = opt;
      label.appendChild(span);
      opts.appendChild(label);
    });
    card.appendChild(opts);
    questionsDiv.appendChild(card);
  });
}

/* --- Timer functions --- */
function formatTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,"0");
  const s = Math.floor(sec%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

function updateTimerDisplay(){
  if(remainingSeconds <= 0){
    timerEl.textContent = `সময় শেষ`;
    timerEl.classList.remove("warn");
    timerEl.classList.add("done");
  } else {
    timerEl.textContent = `সময়: ${formatTime(remainingSeconds)}`;
    timerEl.classList.remove("done");
    if(remainingSeconds <= 10) timerEl.classList.add("warn");
    else timerEl.classList.remove("warn");
  }
}

function startTimer(seconds){
  clearTimer();
  remainingSeconds = Math.max(1, Math.floor(seconds));
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();
    if(remainingSeconds <= 0){
      clearTimer();
      // Auto-submit when time up
      if(examRunning){
        alert("সময় শেষ হয়ে গেছে। আপনার উত্তর জমা দেওয়া হচ্ছে।");
        autoSubmitExam();
      }
    }
  }, 1000);
}

function clearTimer(){
  if(timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/* --- Evaluate and save --- */
function evaluateAndSave(){
  const id = (studentIdInput.value || "").trim();
  if(!id) return;
  // Calculate score
  let score = 0;
  const answers = [];
  for(let i=0;i<QUESTIONS.length;i++){
    const sel = quizForm.querySelector(`input[name="q${i}"]:checked`);
    const val = sel ? parseInt(sel.value,10) : null;
    answers.push(val);
    if(val === QUESTIONS[i].answer) score++;
  }

  const attempts = loadAttempts();
  if(attempts[id]){
    // already exists
    return {saved:false, reason:"already"};
  }
  attempts[id] = {
    score,
    total: QUESTIONS.length,
    answers,
    timestamp: new Date().toISOString()
  };
  saveAttempts(attempts);
  return {saved:true, score, total: QUESTIONS.length};
}

/* Manual submit */
quizForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if(!examRunning) return;
  clearTimer();
  const res = evaluateAndSave();
  examRunning = false;
  studentIdInput.disabled = false;
  if(res.saved){
    quizSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
    scoreText.textContent = `আপনি ${res.score} / ${res.total} পেয়েছেন। (${Math.round((res.score/res.total)*100)}%)`;
  } else {
    alert("এই আইডি দিয়ে ইতিমধ্যে পরীক্ষা রেকর্ড আছে।");
    resetToEntry();
  }
});

/* Auto-submit when time is up */
function autoSubmitExam(){
  if(!examRunning) return;
  const res = evaluateAndSave();
  examRunning = false;
  studentIdInput.disabled = false;
  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");
  if(res.saved){
    scoreText.textContent = `সময় শেষ — আপনি ${res.score} / ${res.total} পেয়েছেন। (${Math.round((res.score/res.total)*100)}%)`;
  } else {
    scoreText.textContent = `সময় শেষ — কিন্তু এই আইডি দিয়ে আগে থেকেই রেকর্ড আছে।`;
  }
}

/* Done button */
doneBtn.addEventListener("click", resetToEntry);

function resetToEntry(){
  clearTimer();
  examRunning = false;
  studentIdInput.value = "";
  studentIdInput.disabled = false;
  quizSection.classList.add("hidden");
  resultSection.classList.add("hidden");
  document.getElementById("entry").classList.remove("hidden");
  entryMsg.textContent = "";
  questionsDiv.innerHTML = "";
  timerEl.textContent = "সময়: 00:00";
  timerEl.classList.remove("warn","done");
  currentIdEl.textContent = "";
}

/* --- View own result --- */
viewBtn.addEventListener("click", () => {
  viewMsg.textContent = "";
  const id = (viewIdInput.value || "").trim();
  if(!id){ viewMsg.textContent = "আইডি দিন"; return; }
  const attempts = loadAttempts();
  const rec = attempts[id];
  if(!rec){ viewMsg.textContent = "এই আইডি দিয়ে এখনও কোনো রেকর্ড নেই।"; return; }
  viewMsg.style.color = "green";
  viewMsg.textContent = `আইডি: ${id} — স্কোর: ${rec.score}/${rec.total} — সময়: ${new Date(rec.timestamp).toLocaleString()}`;
  setTimeout(()=> viewMsg.style.color = "", 2000);
});

/* --- Admin: login and controls --- */
adminBtn.addEventListener("click", () => {
  const provided = (adminPassInput.value || "").trim();
  allAttemptsDiv.classList.add("hidden");
  allAttemptsDiv.innerHTML = "";
  adminControlsDiv.classList.add("hidden");
  adminControlsDiv.setAttribute("aria-hidden", "true");
  adminQuestionsDiv.classList.add("hidden");
  adminQuestionsDiv.setAttribute("aria-hidden", "true");

  if(provided !== ADMIN_PASS){
    alert("ভুল admin পাসওয়ার্ড।");
    return;
  }

  // show admin controls and list attempts
  adminControlsDiv.classList.remove("hidden");
  adminControlsDiv.setAttribute("aria-hidden", "false");
  renderSettingsInAdmin();
  renderAllAttempts();

  // ensure "Show Questions" button only works after correct login
  showQuestionsBtn.addEventListener("click", onShowQuestions);
});

function renderAllAttempts(){
  const attempts = loadAttempts();
  const keys = Object.keys(attempts).sort();
  if(keys.length === 0){
    allAttemptsDiv.textContent = "কোনো রেকর্ড নেই।";
    allAttemptsDiv.classList.remove("hidden");
    allAttemptsDiv.setAttribute("aria-hidden", "false");
    return;
  }
  allAttemptsDiv.innerHTML = "";
  keys.forEach(k => {
    const r = attempts[k];
    const item = document.createElement("div");
    item.className = "attempt-item";
    item.innerHTML = `<strong>${k}</strong> — স্কোর: ${r.score}/${r.total} — সময়: ${new Date(r.timestamp).toLocaleString()}`;
    allAttemptsDiv.appendChild(item);
  });
  allAttemptsDiv.classList.remove("hidden");
  allAttemptsDiv.setAttribute("aria-hidden", "false");
}

function renderSettingsInAdmin(){
  // populate current default into admin UI
  if(defaultTimeInput) defaultTimeInput.value = settings.defaultTimeMinutes;
}

/* --- Admin: show questions (only after login) --- */
function onShowQuestions(){
  // toggle
  if(!adminQuestionsDiv.classList.contains("hidden")){
    adminQuestionsDiv.classList.add("hidden");
    adminQuestionsDiv.setAttribute("aria-hidden", "true");
    return;
  }
  // render questions (with correct answer highlighted)
  adminQuestionsDiv.innerHTML = "";
  QUESTIONS.forEach((it, idx) => {
    const card = document.createElement("div");
    card.className = "question-card";
    const q = document.createElement("h4");
    q.textContent = `${idx+1}. ${it.q}`;
    card.appendChild(q);

    const opts = document.createElement("div");
    opts.className = "options";
    it.options.forEach((opt, oi) => {
      const p = document.createElement("div");
      p.textContent = `${String.fromCharCode(65+oi)}. ${opt}`;
      if(oi === it.answer) {
        p.className = "correct-answer";
        p.textContent += " (সঠিক)";
      }
      opts.appendChild(p);
    });
    card.appendChild(opts);
    adminQuestionsDiv.appendChild(card);
  });
  adminQuestionsDiv.classList.remove("hidden");
  adminQuestionsDiv.setAttribute("aria-hidden", "false");
}

/* --- Admin: set default time --- */
setDefaultTimeBtn.addEventListener("click", () => {
  const v = parseInt(defaultTimeInput.value, 10);
  if(isNaN(v) || v <= 0){
    alert("সঠিক মিনিট দিন (১ থেকে ১৮০)।");
    return;
  }
  settings.defaultTimeMinutes = Math.min(180, Math.max(1, v));
  saveSettings(settings);
  refreshSettingsUI();
  alert(`ডিফল্ট সময়সীমা ${settings.defaultTimeMinutes} মিনিটে সেট করা হয়েছে।`);
});

/* --- Admin: clear all attempts --- */
clearAllBtn.addEventListener("click", () => {
  if(!confirm("আপনি কি নিশ্চিত যে সব রেকর্ড মুছতে চান? এই ক্রিয়াটি পূর্বাবস্থায় ফিরানো যাবে না।")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderAllAttempts();
  alert("সব রেকর্ড মুছে ফেলা হয়েছে।");
});

/* --- Admin: export CSV --- */
exportBtn.addEventListener("click", () => {
  const attempts = loadAttempts();
  const rows = [["id","score","total","timestamp","answers"]];
  Object.keys(attempts).forEach(id => {
    const r = attempts[id];
    rows.push([id, r.score, r.total, r.timestamp, JSON.stringify(r.answers)]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nahid_exam_attempts.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

/* --- Init --- */
(function init(){
  settings = loadSettings();
  refreshSettingsUI();
  // reset timer display
  timerEl.textContent = "সময়: 00:00";
})();