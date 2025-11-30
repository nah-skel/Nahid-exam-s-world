// Nahid Exam's World - Admin can add questions and control whether answers are shown
// LocalStorage keys
const ATTEMPTS_KEY = "nahid_exam_attempts_v1";
const SETTINGS_KEY = "nahid_exam_settings_v1";
const QUESTIONS_KEY = "nahid_exam_questions_v1";

// Default admin password (change as you like)
const ADMIN_PASS = "admin123";

/* --- Default questions (used if no questions in storage) --- */
const DEFAULT_QUESTIONS = [
  {
    q: "HTML কী জন্য ব্যবহৃত হয়?",
    options: ["স্টাইল", "স্ট্রাকচার", "ডাটাবেস", "সার্ভার"],
    answer: 1
  },
  {
    q: "CSS দিয়ে আমরা কি করি?",
    options: ["অ্যানিমেশন", "স্টাইল প্রয়োগ", "ডাটাবেস কুয়েরি", "ইমেইল পাঠাই"],
    answer: 1
  },
  {
    q: "JavaScript প্রধানত কোথায় চলবে?",
    options: ["সার্ভারে", "ব্রাউজারে", "ডাটাবেসে", "নেটওয়ার্কে"],
    answer: 1
  }
];

/* --- Helpers for storage --- */
function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){
    console.error("loadJSON", e);
    return fallback;
  }
}
function saveJSON(key, obj){
  try{
    localStorage.setItem(key, JSON.stringify(obj));
  }catch(e){ console.error("saveJSON", e); }
}

/* --- Load/Save domain data --- */
function loadAttempts(){ return loadJSON(ATTEMPTS_KEY, {}); }
function saveAttempts(o){ saveJSON(ATTEMPTS_KEY, o); }

function loadSettings(){
  const d = loadJSON(SETTINGS_KEY, null);
  if(!d){
    const init = { defaultTimeMinutes: 5, allowShowAnswers: true };
    saveJSON(SETTINGS_KEY, init);
    return init;
  }
  return d;
}
function saveSettings(s){ saveJSON(SETTINGS_KEY, s); }

function loadQuestions(){
  const qs = loadJSON(QUESTIONS_KEY, null);
  if(!qs){
    saveJSON(QUESTIONS_KEY, DEFAULT_QUESTIONS.slice());
    return DEFAULT_QUESTIONS.slice();
  }
  return qs;
}
function saveQuestions(qs){ saveJSON(QUESTIONS_KEY, qs); }

/* --- UI refs --- */
const studentIdInput = document.getElementById("studentId");
const startBtn = document.getElementById("startBtn");
const entryMsg = document.getElementById("entryMsg");
const currentDefaultTimeEl = document.getElementById("currentDefaultTime");

const quizSection = document.getElementById("quizSection");
const quizForm = document.getElementById("quizForm");
const timerEl = document.getElementById("timer");
const currentIdEl = document.getElementById("currentId");
const cancelBtn = document.getElementById("cancelBtn");

const resultSection = document.getElementById("resultSection");
const scoreText = document.getElementById("scoreText");
const answersList = document.getElementById("answersList");
const detailedAnswers = document.getElementById("detailedAnswers");
const doneBtn = document.getElementById("doneBtn");

const viewBtnResult = document.getElementById("viewBtnResult");
const viewIdInput = document.getElementById("viewId");
const viewBtn = document.getElementById("viewBtn");
const viewMsg = document.getElementById("viewMsg");

const adminPassInput = document.getElementById("adminPass");
const adminBtn = document.getElementById("adminBtn");
const logoutAdminBtn = document.getElementById("logoutAdminBtn");
const adminControlsDiv = document.getElementById("adminControls");

const addQuestionForm = document.getElementById("addQuestionForm");
const q_text = document.getElementById("q_text");
const q_o0 = document.getElementById("q_o0");
const q_o1 = document.getElementById("q_o1");
const q_o2 = document.getElementById("q_o2");
const q_o3 = document.getElementById("q_o3");
const q_ans = document.getElementById("q_ans");
const addQBtn = document.getElementById("addQBtn");
const clearQFormBtn = document.getElementById("clearQFormBtn");
const questionList = document.getElementById("questionList");

const defaultTimeInput = document.getElementById("defaultTimeInput");
const setDefaultTimeBtn = document.getElementById("setDefaultTimeBtn");
const allowShowAnswers = document.getElementById("allowShowAnswers");
const exportBtn = document.getElementById("exportBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

/* --- App state --- */
let questions = loadQuestions();
let settings = loadSettings();
let attempts = loadAttempts();

let timerInterval = null;
let remainingSeconds = 0;
let examRunning = false;

/* --- Utility --- */
function formatTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,"0");
  const s = Math.floor(sec%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

/* --- UI render functions --- */
function refreshSettingsUI(){
  currentDefaultTimeEl.textContent = settings.defaultTimeMinutes;
  if(defaultTimeInput) defaultTimeInput.value = settings.defaultTimeMinutes;
  if(allowShowAnswers) allowShowAnswers.checked = !!settings.allowShowAnswers;
}

function renderQuestionsForStudent(){
  quizForm.innerHTML = "";
  questions.forEach((it, idx) => {
    const card = document.createElement("div");
    card.className = "question-card";
    card.innerHTML = `<h4>${idx+1}. ${escapeHtml(it.q)}</h4>`;
    const opts = document.createElement("div");
    opts.className = "options";
    (it.options || []).forEach((opt, oi) => {
      const id = `q${idx}_opt${oi}`;
      const label = document.createElement("label");
      label.innerHTML = `<input type="radio" name="q${idx}" value="${oi}" id="${id}" /> <span>${escapeHtml(opt)}</span>`;
      opts.appendChild(label);
    });
    card.appendChild(opts);
    quizForm.appendChild(card);
  });
}

function renderQuestionListInAdmin(){
  questionList.innerHTML = "";
  if(!questions || questions.length === 0){
    questionList.textContent = "কোনো প্রশ্ন সেভ করা নেই।";
    return;
  }
  questions.forEach((it, idx) => {
    const item = document.createElement("div");
    item.className = "q-item";
    const left = document.createElement("div");
    left.innerHTML = `<div class="q-title">${idx+1}. ${escapeHtml(it.q)}</div>
                      <div class="muted">অপশন: ${it.options.map(o => escapeHtml(o)).join(" | ")}</div>`;
    const right = document.createElement("div");
    right.className = "q-actions";
    const del = document.createElement("button"); del.className = "btn ghost"; del.textContent = "Delete";
    del.addEventListener("click", () => {
      if(!confirm("মুছে ফেলতে চান?")) return;
      questions.splice(idx,1);
      saveQuestions(questions);
      renderQuestionListInAdmin();
    });
    const edit = document.createElement("button"); edit.className = "btn"; edit.textContent = "Edit";
    edit.addEventListener("click", () => {
      // simple edit: populate form then delete existing; admin must click 'Add' to save new
      q_text.value = it.q;
      q_o0.value = it.options[0] || "";
      q_o1.value = it.options[1] || "";
      q_o2.value = it.options[2] || "";
      q_o3.value = it.options[3] || "";
      q_ans.value = (it.answer || 1) + 1;
      // remove current
      questions.splice(idx,1);
      saveQuestions(questions);
      renderQuestionListInAdmin();
      window.scrollTo({ top: document.getElementById("adminCard").offsetTop, behavior: "smooth" });
    });
    right.appendChild(edit);
    right.appendChild(del);
    item.appendChild(left);
    item.appendChild(right);
    questionList.appendChild(item);
  });
}

/* --- Student flow --- */
startBtn.addEventListener("click", () => {
  entryMsg.textContent = "";
  const id = (studentIdInput.value || "").trim();
  if(!id){ entryMsg.textContent = "অনুগ্রহ করে আইডি দিন"; return; }
  attempts = loadAttempts();
  if(attempts[id]){
    entryMsg.textContent = "এই আইডি দিয়ে ইতিমধ্যে পরীক্ষা করা হয়েছে। ফল দেখতে View বাটনে ক্লিক করুন।";
    return;
  }
  if(!questions || questions.length === 0){
    entryMsg.textContent = "এখন সুবিধার জন্য প্রশ্ন নেই — অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।";
    return;
  }

  // Prepare UI
  studentIdInput.disabled = true;
  renderQuestionsForStudent();
  document.getElementById("entry").classList.add("hidden");
  quizSection.classList.remove("hidden");

  currentIdEl.textContent = `ID: ${id}`;
  // start timer using admin-configured default
  startTimer(settings.defaultTimeMinutes * 60);
  examRunning = true;
});

cancelBtn.addEventListener("click", () => {
  if(!confirm("আপনি কি পরীক্ষা বাতিল করতে চান?")) return;
  resetToEntry();
});

/* --- Timer --- */
function updateTimerDisplay(){
  if(remainingSeconds <= 0){
    timerEl.textContent = `সময় শেষ`;
    timerEl.classList.add("done");
  } else {
    timerEl.textContent = `সময়: ${formatTime(remainingSeconds)}`;
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
      if(examRunning){
        alert("সময় শেষ। উত্তর জমা করা হচ্ছে।");
        autoSubmitExam();
      }
    }
  }, 1000);
}
function clearTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval = null; } }

/* --- Evaluate & Save --- */
function evaluateAndSave(){
  const id = (studentIdInput.value || "").trim();
  if(!id) return { saved:false };
  let score = 0;
  const answers = [];
  for(let i=0;i<questions.length;i++){
    const sel = quizForm.querySelector(`input[name="q${i}"]:checked`);
    const val = sel ? parseInt(sel.value,10) : null;
    answers.push(val);
    if(val === questions[i].answer) score++;
  }
  attempts = loadAttempts();
  if(attempts[id]) return { saved:false, reason:"already" };
  attempts[id] = { score, total: questions.length, answers, timestamp: new Date().toISOString() };
  saveAttempts(attempts);
  return { saved:true, score, total: questions.length, answers };
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
    showResult(res);
  } else {
    alert("এই আইডি দিয়ে আগে থেকেই পরীক্ষা রেকর্ড আছে।");
    resetToEntry();
  }
});

document.getElementById("submitBtn").addEventListener("click", (e) => {
  // delegate to form submit
  quizForm.requestSubmit();
});

/* Auto submit when time up */
function autoSubmitExam(){
  if(!examRunning) return;
  const res = evaluateAndSave();
  examRunning = false;
  studentIdInput.disabled = false;
  if(res.saved){
    showResult(res, true);
  } else {
    scoreText.textContent = `সময় শেষ — কিন্তু এই আইডি দিয়ে আগে থেকেই রেকর্ড আছে।`;
    detailedAnswers.classList.add("hidden");
    resultSection.classList.remove("hidden");
  }
}

/* Show result (and answers if allowed) */
function showResult(res, auto=false){
  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");
  scoreText.textContent = `আপনি ${res.score} / ${res.total} পেয়েছেন। (${Math.round((res.score/res.total)*100)}%)${auto ? " (Auto-submitted)" : ""}`;

  // Show detailed answers only if admin allowed
  if(settings.allowShowAnswers){
    detailedAnswers.classList.remove("hidden");
    renderDetailedAnswers(res.answers);
  } else {
    detailedAnswers.classList.add("hidden");
  }
}

/* Render detailed answers */
function renderDetailedAnswers(studentAnswers){
  answersList.innerHTML = "";
  questions.forEach((it, idx) => {
    const userAns = studentAnswers ? studentAnswers[idx] : null;
    const correct = it.answer;
    const item = document.createElement("div");
    item.className = "answer-item " + (userAns === correct ? "correct" : "wrong");
    const qHtml = `<div><strong>${idx+1}. ${escapeHtml(it.q)}</strong></div>`;
    const user = userAns === null ? `<em class="muted">No answer</em>` : escapeHtml(it.options[userAns] || "");
    const corr = escapeHtml(it.options[correct] || "");
    item.innerHTML = qHtml +
      `<div class="meta">Your answer: ${user} — Correct: ${corr}</div>`;
    answersList.appendChild(item);
  });
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
  quizForm.innerHTML = "";
  timerEl.textContent = "সময়: 00:00";
  currentIdEl.textContent = "";
}

/* --- View own result quick --- */
viewBtnResult.addEventListener("click", () => {
  const id = (studentIdInput.value || "").trim();
  if(!id){ entryMsg.textContent = "আইডি দিন"; return; }
  const all = loadAttempts();
  const rec = all[id];
  if(!rec){ entryMsg.textContent = "এই আইডি দিয়ে কোনো রেকর্ড নেই"; return; }
  // show popup-like result area
  const ok = confirm(`আইডি: ${id}\nস্কোর: ${rec.score}/${rec.total}\nসময়: ${new Date(rec.timestamp).toLocaleString()}\n\nকীভাবে বিস্তারিত দেখতে চান?`);
  if(ok && settings.allowShowAnswers){
    // populate answers view
    resultSection.classList.remove("hidden");
    scoreText.textContent = `আইডি: ${id} — আপনি ${rec.score}/${rec.total} পেয়েছেন।`;
    detailedAnswers.classList.remove("hidden");
    renderDetailedAnswers(rec.answers);
  } else {
    alert("বিস্তারিত দেখার অনুমতি নেই অথবা বাতিল করা হয়েছে।");
  }
});

/* --- Admin flow --- */
adminBtn.addEventListener("click", () => {
  const provided = (adminPassInput.value || "").trim();
  if(provided !== ADMIN_PASS){ alert("ভুল admin পাসওয়ার্ড।"); return; }

  // show admin controls
  adminControlsDiv.classList.remove("hidden");
  logoutAdminBtn.classList.remove("hidden");
  renderQuestionListInAdmin();
  refreshSettingsUI();
});

logoutAdminBtn.addEventListener("click", () => {
  adminControlsDiv.classList.add("hidden");
  logoutAdminBtn.classList.add("hidden");
  adminPassInput.value = "";
});

/* Add question */
addQuestionForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = (q_text.value || "").trim();
  if(!q){ alert("প্রশ্ন লিখুন"); return; }
  const opts = [
    (q_o0.value || "").trim(),
    (q_o1.value || "").trim(),
    (q_o2.value || "").trim(),
    (q_o3.value || "").trim()
  ].filter(Boolean); // allow less than 4
  if(opts.length < 2){ alert("কমপক্ষে ২টি অপশন দিন"); return; }
  const ansIdx = Math.max(0, Math.min(opts.length-1, (parseInt(q_ans.value || "2",10) - 1)));
  const newQ = { q, options: opts, answer: ansIdx };
  questions.push(newQ);
  saveQuestions(questions);
  renderQuestionListInAdmin();
  addQuestionForm.reset();
  q_ans.value = 2;
  alert("প্রশ্ন যোগ করা হয়েছে।");
});

/* Clear question form */
clearQFormBtn.addEventListener("click", (e) => { e.preventDefault(); addQuestionForm.reset(); q_ans.value = 2; });

/* Admin: set default time */
setDefaultTimeBtn.addEventListener("click", () => {
  const v = parseInt(defaultTimeInput.value,10);
  if(isNaN(v) || v < 1 || v > 180){ alert("১ থেকে ১৮০ মিনিটের মধ্যে মান দিন"); return; }
  settings.defaultTimeMinutes = v;
  settings.allowShowAnswers = !!allowShowAnswers.checked;
  saveSettings(settings);
  refreshSettingsUI();
  alert("সেটিংস সেভ হয়েছে।");
});

/* Admin: export CSV */
exportBtn.addEventListener("click", () => {
  const data = loadAttempts();
  const rows = [["id","score","total","timestamp","answers"]];
  Object.keys(data).forEach(id => {
    const r = data[id];
    rows.push([id, r.score, r.total, r.timestamp, JSON.stringify(r.answers)]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "nahid_exam_attempts.csv"; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

/* Admin: clear all attempts */
clearAllBtn.addEventListener("click", () => {
  if(!confirm("সব রেকর্ড মুছে ফেলতে চান?")) return;
  localStorage.removeItem(ATTEMPTS_KEY);
  attempts = {};
  alert("সব রেকর্ড মুছে ফেলা হয়েছে।");
  renderQuestionListInAdmin();
});

/* --- Utils --- */
function escapeHtml(s){
  if(!s) return "";
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

/* --- Init --- */
(function init(){
  questions = loadQuestions();
  settings = loadSettings();
  attempts = loadAttempts();
  refreshSettingsUI();
  renderQuestionListInAdmin();
  timerEl.textContent = "সময়: 00:00";
})();