/* --------------------------------------------------
   FitFlex — Main App Script
   Cleaned & Production-Ready Version
   Uses localStorage["fitflex"]
-------------------------------------------------- */

/* ---------- Shortcuts ---------- */
const el = sel => document.querySelector(sel);
const els = sel => [...document.querySelectorAll(sel)];

/* ---------- Local Storage DB ---------- */
const db = {
  load() {
    const raw = localStorage.getItem('fitflex');
    return raw ? JSON.parse(raw) : {
      theme: 'dark',
      points: 0,
      caloriesToday: 0,
      workoutsToday: 0,
      goalMinutes: 30,
      goalType: 'stay-fit',
      history: [],
      bmi: null,
      todayPlan: [],
      week: genEmptyWeek()
    };
  },
  save() {
    localStorage.setItem('fitflex', JSON.stringify(state));
  }
};

const state = db.load();

/* ---------- Login Page Styles ---------- */
const loginStyles = `
#loginPage {
  height:100vh; display:flex; flex-direction:column;
  justify-content:center; align-items:center; text-align:center;
}
#loginBox {
  background:rgba(255,255,255,0.1);
  padding:30px; width:320px; border-radius:15px;
  backdrop-filter:blur(10px);
}
#loginBox input, #loginBox button {
  width:100%; padding:12px; margin:10px 0;
  border:none; border-radius:8px; font-size:16px;
}
#loginBox button { background:#ff007f; color:#fff; cursor:pointer; }
`;
document.head.insertAdjacentHTML("beforeend", `<style>${loginStyles}</style>`);

/* ---------- Workout Library ---------- */
const WORKOUTS = [
  { id:'pushups', name:'Push-ups', type:'strength', level:'Beginner', seconds:30, calories:8, gif:'https://i.imgur.com/8Vq2m0T.gif', desc:'Keep your body straight...' },
  { id:'squats', name:'Bodyweight Squats', type:'strength', level:'Beginner', seconds:30, calories:10, gif:'https://i.imgur.com/2C0z8u8.gif', desc:'Feet shoulder-width apart...' },
  { id:'mountain', name:'Mountain Climbers', type:'cardio', level:'Intermediate', seconds:30, calories:12, gif:'https://i.imgur.com/ZzA7sQH.gif', desc:'From plank drive knees...' },
  { id:'plank', name:'Plank Hold', type:'core', level:'All', seconds:30, calories:6, gif:'https://i.imgur.com/v2ZQk7C.gif', desc:'Body straight line...' },
  { id:'jumpingjacks', name:'Jumping Jacks', type:'cardio', level:'All', seconds:30, calories:12, gif:'https://i.imgur.com/sqM8t8t.gif', desc:'Land softly...' },
  { id:'lunges', name:'Alternating Lunges', type:'strength', level:'Intermediate', seconds:30, calories:9, gif:'https://i.imgur.com/t1bM9tO.gif', desc:'Step forward and lower...' },
  { id:'highknees', name:'High Knees', type:'cardio', level:'All', seconds:30, calories:14, gif:'https://i.imgur.com/2mDqz6R.gif', desc:'Run in place...' },
  { id:'bicycle', name:'Bicycle Crunch', type:'core', level:'Intermediate', seconds:30, calories:8, gif:'https://i.imgur.com/9n0Wl2U.gif', desc:'Elbow to opposite knee...' }
];

/* ---------- Week Structure ---------- */
function genEmptyWeek() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  return [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d.toISOString().slice(0,10), calories:0, workouts:0 };
  });
}

/* ---------- TAB Navigation ---------- */
els('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    els('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    els('.page').forEach(p => p.classList.remove('active'));
    document.querySelector(btn.dataset.target).classList.add('active');

    if (btn.dataset.target === '#progress') {
      drawWeekChart();
      refreshHistory();
    }
  });
});

/* ---------- Theme Handling ---------- */
function applyTheme() {
  document.body.classList.toggle('light', state.theme === 'light');
}
applyTheme();

el('#themeToggle')?.addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  db.save();
  applyTheme();
});

/* ---------- Daily Plan ---------- */
function shufflePlan() {
  state.todayPlan = [...WORKOUTS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => ({ id: w.id, done:false }));

  db.save();
  renderPlan();
}

function renderPlan() {
  const ul = el('#todayPlan');
  ul.innerHTML = '';

  if (!state.todayPlan.length) {
    shufflePlan();
    return;
  }

  state.todayPlan.forEach(item => {
    const w = WORKOUTS.find(x => x.id === item.id);
    const li = document.createElement('li');

    li.innerHTML = `
      <div><strong>${w.name}</strong>
        <span class="tag">${w.type}</span>
        <span class="tag">${w.seconds}s</span></div>
      <div>
        <button class="btn tiny start-btn" data-id="${w.id}">Start</button>
        <span class="tag ${item.done ? '' : 'pending'}">
          ${item.done ? 'Done ✔' : 'Pending'}
        </span>
      </div>
    `;
    ul.appendChild(li);
  });

  ul.querySelectorAll('.start-btn').forEach(b =>
    b.addEventListener('click', () => openWorkout(b.dataset.id))
  );
}

el('#shufflePlan')?.addEventListener('click', () => { shufflePlan(); rotateQuote(); });
el('#completePlan')?.addEventListener('click', () => {
  state.todayPlan = state.todayPlan.map(w => ({ ...w, done:true }));
  db.save();
  renderPlan();
});
renderPlan();

/* ---------- Stats ---------- */
function updateStats() {
  el('#statWorkouts').textContent = state.workoutsToday;
  el('#statCalories').textContent = state.caloriesToday;
  el('#statPoints').textContent = state.points;

  const goal = Math.max(10, state.goalMinutes || 30);
  const percent = Math.min(100, Math.round((state.workoutsToday * 10) / goal * 100));

  el('#progressPercent').textContent = percent + '%';

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (percent / 100) * circumference;
  el('#progressRing').style.strokeDashoffset = offset;
}
updateStats();

/* ---------- Badges ---------- */
const BADGES = [
  {id:'first', name:'First Steps', need:1, icon:'🥇'},
  {id:'streak5', name:'5 Workouts', need:5, icon:'🎖️'},
  {id:'burn100', name:'100 Calories', need:100, icon:'🔥', mode:'cal'},
  {id:'points200', name:'200 Points', need:200, icon:'🏆', mode:'pts'}
];

function renderBadges() {
  const wrap = el('#badges');
  wrap.innerHTML = '';

  BADGES.forEach(b => {
    const unlocked =
      b.mode === 'cal' ? state.caloriesToday >= b.need :
      b.mode === 'pts' ? state.points >= b.need :
      state.workoutsToday >= b.need;

    const d = document.createElement('div');
    d.className = 'badge ' + (unlocked ? '' : 'locked');
    d.innerHTML = `<span class="icon">${b.icon}</span><span class="name">${b.name}</span>`;
    wrap.appendChild(d);
  });
}
renderBadges();

/* ---------- Motivational Quotes ---------- */
const QUOTES = [
  "Don’t limit your challenges. Challenge your limits.",
  "It never gets easier, you just get stronger.",
  "Small progress is still progress.",
  "Consistency is a superpower.",
  "You don’t have to be extreme, just consistent."
];

function rotateQuote() {
  el('#quote').textContent = "“" + QUOTES[Math.floor(Math.random()*QUOTES.length)] + "”";
}
rotateQuote();
setInterval(rotateQuote, 8000);

/* ---------- Workout Library Rendering ---------- */
function renderWorkouts(list = WORKOUTS) {
  const grid = el('#workoutGrid');
  grid.innerHTML = '';

  list.forEach(w => {
    const card = document.createElement('div');
    card.className = 'w-card';

    card.innerHTML = `
      <div class="thumb"><img src="${w.gif}"></div>
      <div class="content">
        <div class="row space-between">
          <strong>${w.name}</strong>
          <span class="tag-chip">${w.level}</span>
        </div>
        <div class="tag-row">
          <span class="tag-chip">#${w.type}</span>
          <span class="tag-chip">${w.seconds}s</span>
          <span class="tag-chip">${w.calories} kcal</span>
        </div>
        <div class="actions">
          <button class="btn tiny" data-id="${w.id}">Start</button>
          <button class="btn outline tiny" data-info="${w.id}">Info</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });

  grid.querySelectorAll('button[data-id]').forEach(b =>
    b.addEventListener('click', () => openWorkout(b.dataset.id))
  );

  grid.querySelectorAll('button[data-info]').forEach(b =>
    b.addEventListener('click', () => openWorkout(b.dataset.info, true))
  );
}
renderWorkouts();


/* ---------- Search ---------- */
el('#searchInput')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  renderWorkouts(
    WORKOUTS.filter(w => (w.name + w.type + w.level).toLowerCase().includes(q))
  );
});

/* ---------- Workout Modal & Timer ---------- */
let timer = null;
let remaining = 30;
let total = 30;
let activeWorkout = null;

function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2,'0');
  const s = (sec % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function openWorkout(id, pauseOnly=false) {
  const w = WORKOUTS.find(x => x.id === id);
  if (!w) return;

  activeWorkout = w;
  remaining = total = w.seconds;

  el('#modalGif').src = w.gif;
  el('#modalTitle').textContent = w.name;
  el('#modalDesc').textContent = w.desc;
  el('#countdown').textContent = fmt(remaining);
  el('#timeBar').style.width = '0%';

  el('#workoutModal').classList.remove('hidden');
  if (!pauseOnly) start();
}

function closeModal() {
  stop();
  el('#workoutModal').classList.add('hidden');
}
el('#closeModal')?.addEventListener('click', closeModal);

function tick() {
  remaining--;

  if (remaining < 0) {
    finish();
    return;
  }

  el('#countdown').textContent = fmt(remaining);
  el('#timeBar').style.width = `${100 * (1 - remaining / total)}%`;
}

function start() { stop(); timer = setInterval(tick, 1000); }
function pause() { stop(); }
function stop() { if (timer) { clearInterval(timer); timer=null; } }

el('#startTimer')?.addEventListener('click', start);
el('#pauseTimer')?.addEventListener('click', pause);
el('#completeWorkout')?.addEventListener('click', finish);

function finish() {
  stop();
  if (!activeWorkout) return;

  state.points += 10;
  state.workoutsToday++;
  state.caloriesToday += activeWorkout.calories;

  state.todayPlan = state.todayPlan.map(p =>
    p.id === activeWorkout.id ? { ...p, done:true } : p
  );

  const today = new Date().toISOString().slice(0,10);
  state.history.unshift({
    date: today,
    workout: activeWorkout.name,
    calories: activeWorkout.calories,
    seconds: activeWorkout.seconds
  });
  state.history = state.history.slice(0, 30);

  const w = ensureWeekToday();
  w.calories += activeWorkout.calories;
  w.workouts++;

  db.save();
  renderPlan();
  updateStats();
  renderBadges();
  refreshHistory();
  drawWeekChart();

  closeModal();
}

/* ---------- Rolling Week Update ---------- */
function ensureWeekToday() {
  const today = new Date().toISOString().slice(0,10);
  let idx = state.week.findIndex(d => d.date === today);

  if (idx === -1) {
    state.week.shift();
    state.week.push({ date: today, calories:0, workouts:0 });
    idx = 6;
  }
  return state.week[idx];
}

/* ---------- Progress Page ---------- */
let chart = null;

function drawWeekChart() {
  const ctx = el('#weekChart').getContext('2d');
  const labels = state.week.map(w => w.date.slice(5));
  const cals = state.week.map(w => w.calories);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Calories', data: cals }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display:false }},
      scales: { y: { beginAtZero:true }}
    }
  });
}

function refreshHistory() {
  const ul = el('#historyList');
  ul.innerHTML = '';

  if (!state.history.length) {
    ul.innerHTML = `<li><span>No workouts yet.</span><span>Start one from the Library!</span></li>`;
    return;
  }

  state.history.forEach(h => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${h.workout}</span><span>${h.calories} kcal • ${h.seconds}s • ${h.date}</span>`;
    ul.appendChild(li);
  });
}

/* ---------- BMI Calculation ---------- */
function bmiAdvice(bmi){
  if (bmi < 18.5) return 'Underweight — add strength training & more calories.';
  if (bmi < 24.9) return 'Normal — maintain with balanced routine.';
  if (bmi < 29.9) return 'Overweight — focus on cardio + light strength.';
  return 'Obesity — slow fat loss; consider professional guidance.';
}

el('#calcBMI')?.addEventListener('click', () => {
  const h = Number(el('#height').value);
  const w = Number(el('#weight').value);

  if (!h || !w) {
    el('#bmiResult').textContent = "Please enter height & weight.";
    return;
  }

  const bmi = +(w / ((h/100)**2)).toFixed(1);
  state.bmi = bmi;

  db.save();
  el('#bmiResult').innerHTML = `<strong>BMI: ${bmi}</strong><br>${bmiAdvice(bmi)}`;
});

/* ---------- Planner ---------- */
el('#saveGoal')?.addEventListener('click', () => {
  state.goalType = el('#goal').value;
  state.goalMinutes = Number(el('#dailyMinutes').value || 30);
  db.save();
  el('#planSuggest').innerHTML = planSuggestText();
  updateStats();
});

function planSuggestText() {
  const t = state.goalType;
  const m = state.goalMinutes;

  if (t === 'fat-loss')
    return `<strong>Plan:</strong> <b>${m} mins/day</b>. 3× cardio, 2× strength, 2× active rest.`;

  if (t === 'muscle-gain')
    return `<strong>Plan:</strong> <b>${m} mins/day</b>. 3–4× strength, 1–2× cardio, 2× mobility.`;

  return `<strong>Plan:</strong> <b>${m} mins/day</b>. Mixed circuits + mobility + light cardio.`;
}

el('#planSuggest').innerHTML = planSuggestText();

/* ---------- Settings ---------- */
el('#exportData')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fitflex-progress.json';
  a.click();
  URL.revokeObjectURL(url);
});

el('#resetData')?.addEventListener('click', () => {
  if (confirm("Reset all saved progress?")) {
    localStorage.removeItem('fitflex');
    location.reload();
  }
});

/* ---------- Daily Reset ---------- */
(function dailyReset() {
  const key = 'fitflex-date';
  const today = new Date().toISOString().slice(0,10);
  const saved = localStorage.getItem(key);

  if (saved !== today) {
    state.workoutsToday = 0;
    state.caloriesToday = 0;
    localStorage.setItem(key, today);
    db.save();
  }
})();

/* ---------- Global Info Handler ---------- */
function openInfo(id){ openWorkout(id, true); }
window.openInfo = openInfo;
