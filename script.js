// Nahid Exam's World - frontend-only exam app (localStorage)
// Change ADMIN_PASS if you want another admin password.

const QUESTIONS = [
  { q: "HTML কী জন্য ব্যবহৃত হয়?", options: ["স্টাইল", "স্ট্রাকচার", "ডাটাবেস", "সার্ভার"], answer: 1 },
  { q: "CSS দিয়ে আমরা কি করি?", options: ["অ্যানিমেশন", "স্টাইল প্রয়োগ", "ডাটাবেস কুয়েরি", "ইমেইল পাঠাই"], answer: 1 },
  { q: "JavaScript প্রধানত কোথায় চলবে?", options: ["সার্ভারে", "ব্রাউজারে", "ডাটাবেসে", "নেটওয়ার্কে"], answer: 1 },
  { q: "localStorage কি?", options: ["ব্রাউজারের স্থায়ী স্টোরেজ", "র‍্যাম মেমোরি", "সার্ভার স্টোরেজ", "টাইমার"], answer: 0 },
  { q: "DOM মানে কি?", options: ["Document Object Model", "Data Output Method", "Desktop OS Manager", "Direct Object Map"], answer: 0 }
];

const STORAGE_KEY = "nahid_exam_attempts_v1";
const ADMIN_PASS = "nahid23";

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

/* UI refs */
const studentIdInput = document.getElementById("studentId");
const startBtn = document.getElementById("startBtn");
const entryMsg = document.getElementById("entryMsg");

const quizSection = document.getElementById("quizSection");
const questionsDiv = document.getElementById("questions");
const quizForm = document.getElementById("quizForm");

const resultSection = document.getElementById("resultSection");
const scoreText = document.getElementById("scoreText");
const doneBtn = document.getElementById("doneBtn");

const viewIdInput = document.getElementById("viewId");
const viewBtn = document.getElementById("viewBtn");
const viewMsg = document.getElementById("viewMsg");

const adminPassInput = document.getElementById("adminPass");
const adminBtn = document.getElementById("adminBtn");
const allAttemptsDiv = document.getElementById("allAttempts");

/* Start exam */
startBtn.addEventListener("click", () => {
  entryMsg.textContent = "";
  const id = (studentIdInput.value || "").trim();
  if(!id){ entryMsg.textContent = "আইডি দিন"; return; }
  const attempts = loadAttempts();
  if(attempts[id]){
    entryMsg.textContent = "এই আইডি দিয়ে ইতিমধ্যে পরীক্ষা করা হয়েছে। ফল দেখতে 'ফল দেখুন' অংশে আইডি দিন।";
    return;
  }
  renderQuestions();
  document.getElementById("entry").classList.add("hidden");
  quizSection.classList.remove("hidden");
});

/* Render questions */
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

/* Submit exam */
quizForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = (studentIdInput.value || "").trim();
  if(!id) return;
  const answers = [];
  let score = 0;
  for(let i=0;i<QUESTIONS.length;i++){
    const sel = quizForm.querySelector(`input[name="q${i}"]:checked`);
    const val = sel ? parseInt(sel.value,10) : null;
    answers.push(val);
    if(val === QUESTIONS[i].answer) score++;
  }

  const attempts = loadAttempts();
  if(attempts[id]){
    alert("এই আইডি দিয়ে ইতিমধ্যেই পরীক্ষা রেকর্ড আছে।");
    resetToEntry();
    return;
  }
  attempts[id] = {
    score,
    total: QUESTIONS.length,
    answers,
    timestamp: new Date().toISOString()
  };
  saveAttempts(attempts);

  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");
  scoreText.textContent = `আপনি ${score} / ${QUESTIONS.length} পেয়েছেন। (${Math.round((score/QUESTIONS.length)*100)}%)`;
});

/* Done button */
doneBtn.addEventListener("click", resetToEntry);

function resetToEntry(){
  studentIdInput.value = "";
  quizSection.classList.add("hidden");
  resultSection.classList.add("hidden");
  document.getElementById("entry").classList.remove("hidden");
  entryMsg.textContent = "";
  questionsDiv.innerHTML = "";
}

/* View own result */
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

/* Admin view */
adminBtn.addEventListener("click", () => {
  allAttemptsDiv.classList.add("hidden");
  allAttemptsDiv.innerHTML = "";
  const provided = adminPassInput.value || "";
  if(provided !== ADMIN_PASS){ alert("ভুল admin পাসওয়ার্ড।"); return; }
  const attempts = loadAttempts();
  const keys = Object.keys(attempts);
  if(keys.length === 0){
    allAttemptsDiv.textContent = "কোনো রেকর্ড নেই।";
    allAttemptsDiv.classList.remove("hidden");
    return;
  }
  keys.forEach(k => {
    const r = attempts[k];
    const item = document.createElement("div");
    item.className = "attempt-item";
    item.innerHTML = `<strong>${k}</strong> — স্কোর: ${r.score}/${r.total} — সময়: ${new Date(r.timestamp).toLocaleString()}`;
    allAttemptsDiv.appendChild(item);
  });
  allAttemptsDiv.classList.remove("hidden");

});
