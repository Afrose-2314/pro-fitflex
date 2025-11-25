/* FitFlex — Frontend logic */
/* Data is stored in localStorage under the "fitflex" key */

const el = sel => document.querySelector(sel);
const els = sel => [...document.querySelectorAll(sel)];

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
      history: [], // {date, workout, calories, seconds}
      bmi: null,
      todayPlan: [],
      week: genEmptyWeek()
    };
  },
  save() { localStorage.setItem('fitflex', JSON.stringify(state)); }
};

const state = db.load();

/* ---------- Workouts Library ---------- */
const WORKOUTS = [
  {
    id:'pushups', name:'Push-ups', type:'strength', level:'Beginner', seconds:30, calories:8,
    gif:'https://i.imgur.com/8Vq2m0T.gif',
    desc:'Keep your body straight, hands under shoulders. Lower until elbows are ~90°, then push back.'
  },
  {
    id:'squats', name:'Bodyweight Squats', type:'strength', level:'Beginner', seconds:30, calories:10,
    gif:'https://i.imgur.com/2C0z8u8.gif',
    desc:'Feet shoulder-width apart, sit back and down, keep chest up and knees tracking toes.'
  },
  {
    id:'mountain', name:'Mountain Climbers', type:'cardio', level:'Intermediate', seconds:30, calories:12,
    gif:'https://i.imgur.com/ZzA7sQH.gif',
    desc:'From plank, drive knees towards chest alternately. Keep core tight and hips level.'
  },
  {
    id:'plank', name:'Plank Hold', type:'core', level:'All', seconds:30, calories:6,
    gif:'https://i.imgur.com/v2ZQk7C.gif',
    desc:'Elbows under shoulders, body in a straight line. Brace core, don’t let hips sag.'
  },
  {
    id:'jumpingjacks', name:'Jumping Jacks', type:'cardio', level:'All', seconds:30, calories:12,
    gif:'https://i.imgur.com/sqM8t8t.gif',
    desc:'Land softly, keep arms straight but relaxed. Breathe rhythmically.'
  },
  {
    id:'lunges', name:'Alternating Lunges', type:'strength', level:'Intermediate', seconds:30, calories:9,
    gif:'https://i.imgur.com/t1bM9tO.gif',
    desc:'Step forward, lower until both knees ~90°. Push through the front heel to stand.'
  },
  {
    id:'highknees', name:'High Knees', type:'cardio', level:'All', seconds:30, calories:14,
    gif:'https://i.imgur.com/2mDqz6R.gif',
    desc:'Run in place bringing knees above hip height. Pump arms for momentum.'
  },
  {
    id:'bicycle', name:'Bicycle Crunch', type:'core', level:'Intermediate', seconds:30, calories:8,
    gif:'https://i.imgur.com/9n0Wl2U.gif',
    desc:'Alternate elbow to opposite knee, extend the other leg straight. Don’t yank your neck.'
  }
];

function genEmptyWeek(){
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const arr = [];
  for(let i=0;i<7;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    arr.push({date:d.toISOString().slice(0,10), calories:0, workouts:0});
  }
  return arr;
}

/* ---------- Tabs ---------- */
els('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    els('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    els('.page').forEach(p=>p.classList.remove('active'));
    document.querySelector(btn.dataset.target).classList.add('active');
    if(btn.dataset.target==='#progress'){ drawWeekChart(); refreshHistory(); }
  });
});

/* ---------- Theme ---------- */
function applyTheme(){
  if(state.theme==='light'){ document.body.classList.add('light'); }
  else { document.body.classList.remove('light'); }
}
applyTheme();
el('#themeToggle').addEventListener('click', ()=>{
  state.theme = state.theme==='dark' ? 'light' : 'dark';
  db.save(); applyTheme();
});

/* ---------- Dashboard ---------- */
function shufflePlan(){
  const pick = [...WORKOUTS].sort(()=>Math.random()-0.5).slice(0,3);
  state.todayPlan = pick.map(w=>({id:w.id, done:false}));
  db.save(); renderPlan();
}
function renderPlan(){
  const ul = el('#todayPlan'); ul.innerHTML='';
  if(!state.todayPlan || state.todayPlan.length===0){ shufflePlan(); return; }
  state.todayPlan.forEach(item=>{
    const w = WORKOUTS.find(x=>x.id===item.id);
    const li = document.createElement('li');
    li.innerHTML = `
      <div><strong>${w.name}</strong> <span class="tag">${w.type}</span> <span class="tag">${w.seconds}s</span></div>
      <div>
        <button data-id="${w.id}" class="btn tiny start-btn">Start</button>
        <span class="tag ${item.done?'':'pending'}">${item.done?'Done ✔':'Pending'}</span>
      </div>
    `;
    ul.appendChild(li);
  });
  ul.querySelectorAll('.start-btn').forEach(b=>b.addEventListener('click', ()=> openWorkout(b.dataset.id)));
}
el('#shufflePlan').addEventListener('click', shufflePlan);
el('#completePlan').addEventListener('click', ()=>{
  state.todayPlan = state.todayPlan.map(x=>({...x, done:true}));
  db.save(); renderPlan();
});
renderPlan();

/* Stats + ring */
function updateStats(){
  el('#statWorkouts').textContent = state.workoutsToday;
  el('#statCalories').textContent = state.caloriesToday;
  el('#statPoints').textContent = state.points;

  const goal = Math.max(10, Number(state.goalMinutes||30));
  const percent = Math.min(100, Math.round((state.workoutsToday*10)/goal*100)); // rough mapping
  el('#progressPercent').textContent = percent + '%';
  const circumference = 2*Math.PI*52; // stroke-dasharray set in HTML (approx 327)
  const offset = circumference - (percent/100)*circumference;
  el('#progressRing').style.strokeDashoffset = offset;
}
updateStats();

/* Badges */
const BADGES = [
  {id:'first', name:'First Steps', need:1, icon:'🥇'},
  {id:'streak5', name:'5 Workouts', need:5, icon:'🎖️'},
  {id:'burn100', name:'100+ Calories', need:100, icon:'🔥', mode:'cal'},
  {id:'points200', name:'200 Points', need:200, icon:'🏆', mode:'pts'}
];
function renderBadges(){
  const wrap = el('#badges'); wrap.innerHTML='';
  BADGES.forEach(b=>{
    let unlocked = false;
    if(b.mode==='cal') unlocked = state.caloriesToday>=b.need;
    else if(b.mode==='pts') unlocked = state.points>=b.need;
    else unlocked = state.workoutsToday>=b.need;
    const d = document.createElement('div');
    d.className='badge '+(unlocked?'':'locked');
    d.innerHTML = `<span class="icon">${b.icon}</span><span class="name">${b.name}</span>`;
    wrap.appendChild(d);
  });
}
renderBadges();

/* Quotes */
const QUOTES = [
  "Don’t limit your challenges. Challenge your limits.",
  "It never gets easier, you just get stronger.",
  "Small progress is still progress.",
  "Consistency is a superpower.",
  "You don’t have to be extreme, just consistent."
];
function rotateQuote(){
  const q = QUOTES[Math.floor(Math.random()*QUOTES.length)];
  el('#quote').textContent = '“'+q+'”';
}
rotateQuote();
setInterval(rotateQuote, 8000);

/* ---------- Workouts Rendering ---------- */
function renderWorkouts(list=WORKOUTS){
  const grid = el('#workoutGrid'); grid.innerHTML='';
  list.forEach(w=>{
    const card = document.createElement('div');
    card.className='w-card';
    card.innerHTML = `
      <div class="thumb"><img src="${w.gif}" alt="${w.name}"></div>
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

  grid.querySelectorAll('button.btn.tiny').forEach(b=>b.addEventListener('click',()=>openWorkout(b.dataset.id)));
  grid.querySelectorAll('button[data-info]').forEach(b=>b.addEventListener('click',()=>openWorkout(b.dataset.info, true)));
}
renderWorkouts();

/* Search */
el('#searchInput').addEventListener('input', e=>{
  const q = e.target.value.toLowerCase().trim();
  const filtered = WORKOUTS.filter(w => [w.name,w.type,w.level].join(' ').toLowerCase().includes(q));
  renderWorkouts(filtered);
});

/* ---------- Workout Modal & Timer ---------- */
let timer=null, remaining=30, total=30, activeWorkout=null;

function openWorkout(id, pauseOnly=false){
  const w = WORKOUTS.find(x=>x.id===id); if(!w) return;
  activeWorkout = w;
  remaining = total = w.seconds;

  el('#modalGif').src = w.gif;
  el('#modalTitle').textContent = w.name;
  el('#modalDesc').textContent = w.desc;
  el('#countdown').textContent = fmt(remaining);
  el('#timeBar').style.width = '0%';

  el('#workoutModal').classList.remove('hidden');
  if(!pauseOnly){ start(); }
}
function closeModal(){
  stop(); el('#workoutModal').classList.add('hidden');
}
el('#closeModal').addEventListener('click', closeModal);

function fmt(s){
  const m = Math.floor(s/60).toString().padStart(2,'0');
  const sec = Math.floor(s%60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}
function tick(){
  remaining -= 1;
  if(remaining < 0){ finish(); return; }
  el('#countdown').textContent = fmt(remaining);
  el('#timeBar').style.width = `${100*(1-remaining/total)}%`;
}
function start(){
  stop();
  timer = setInterval(tick, 1000);
}
function pause(){ stop(); }
function stop(){ if(timer){ clearInterval(timer); timer=null; } }

el('#startTimer').addEventListener('click', start);
el('#pauseTimer').addEventListener('click', pause);
el('#completeWorkout').addEventListener('click', finish);

function finish(){
  stop();
  if(!activeWorkout) return;

  // Gamified rewards
  state.points += 10;
  state.workoutsToday += 1;
  state.caloriesToday += activeWorkout.calories;

  // mark in plan if present
  state.todayPlan = state.todayPlan.map(p => p.id===activeWorkout.id ? {...p, done:true}:p);

  // history & week
  const today = new Date().toISOString().slice(0,10);
  state.history.unshift({date: today, workout: activeWorkout.name, calories: activeWorkout.calories, seconds: activeWorkout.seconds});
  // keep last 30 history items
  state.history = state.history.slice(0,30);

  // update week entry
  const w = ensureWeekToday();
  w.calories += activeWorkout.calories;
  w.workouts += 1;

  db.save();
  renderPlan(); updateStats(); renderBadges();
  drawWeekChart(); refreshHistory();
  closeModal();
}

/* Ensure week array covers the last 7 days rolling */
function ensureWeekToday(){
  const today = new Date().toISOString().slice(0,10);
  let idx = state.week.findIndex(d=>d.date===today);
  if(idx===-1){
    // shift and push today
    state.week.shift();
    state.week.push({date:today, calories:0, workouts:0});
    idx = 6;
  }
  return state.week[idx];
}

/* ---------- Progress Page ---------- */
let chart=null;
function drawWeekChart(){
  const ctx = el('#weekChart').getContext('2d');
  const labels = state.week.map(w=> w.date.slice(5));
  const cals = state.week.map(w=> w.calories);
  if(chart){ chart.destroy(); }
  chart = new Chart(ctx, {
    type:'bar',
    data:{
      labels,
      datasets:[
        {label:'Calories', data:cals},
      ]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{y:{beginAtZero:true}}
    }
  });
}
function refreshHistory(){
  const ul = el('#historyList'); ul.innerHTML='';
  if(state.history.length===0){
    ul.innerHTML = '<li><span>No workouts yet.</span><span>Start one from the Library!</span></li>'; return;
  }
  state.history.forEach(h=>{
    const li=document.createElement('li');
    li.innerHTML = `<span>${h.workout}</span><span>${h.calories} kcal • ${h.seconds}s • ${h.date}</span>`;
    ul.appendChild(li);
  });
}

/* ---------- BMI & Planner ---------- */
function bmiAdvice(bmi){
  if(bmi < 18.5) return 'Underweight — include strength training and calorie surplus.';
  if(bmi < 24.9) return 'Normal — maintain with balanced training & nutrition.';
  if(bmi < 29.9) return 'Overweight — focus on fat loss with cardio + light strength.';
  return 'Obesity — prioritize steady fat loss; consult a professional if possible.';
}
el('#calcBMI').addEventListener('click', ()=>{
  const h = Number(el('#height').value);
  const w = Number(el('#weight').value);
  if(!h || !w) { el('#bmiResult').textContent = 'Please enter height & weight.'; return; }
  const bmi = +(w / ((h/100)**2)).toFixed(1);
  state.bmi = bmi; db.save();
  el('#bmiResult').innerHTML = `<strong>BMI: ${bmi}</strong><br>${bmiAdvice(bmi)}`;
});

el('#saveGoal').addEventListener('click', ()=>{
  state.goalType = el('#goal').value;
  state.goalMinutes = Number(el('#dailyMinutes').value || 30);
  db.save();
  el('#planSuggest').innerHTML = planSuggestText();
  updateStats();
});

function planSuggestText(){
  const type = state.goalType;
  const mins = state.goalMinutes;
  let blocks='';
  if(type==='fat-loss'){ blocks='30–45 min/day: 3× cardio (HIIT/steady), 2× full‑body strength, 2× active rest (walk/stretch).'; }
  else if(type==='muscle-gain'){ blocks='30–60 min/day: 3–4× strength (upper/lower split), 1–2× light cardio, 1–2× mobility.'; }
  else { blocks='~30 min/day: 3× mixed circuits, 2× mobility, 2× light cardio (walk/jog/cycle).'; }
  return `<strong>Plan:</strong> Aim for <b>${mins} minutes/day</b>. ${blocks}`;
}
el('#planSuggest').innerHTML = planSuggestText();

/* ---------- Settings ---------- */
el('#exportData').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='fitflex-progress.json'; a.click();
  URL.revokeObjectURL(url);
});

el('#resetData').addEventListener('click', ()=>{
  if(confirm('Reset all saved progress?')){ localStorage.removeItem('fitflex'); location.reload(); }
});

/* ---------- Today rollover (simple) ---------- */
(function ensureTodayCounters(){
  const key = 'fitflex-date';
  const stored = localStorage.getItem(key);
  const today = new Date().toISOString().slice(0,10);
  if(stored !== today){
    // new day: reset daily counters
    state.workoutsToday = 0;
    state.caloriesToday = 0;
    db.save();
    localStorage.setItem(key, today);
  }
})();

/* ---------- Hook up plan buttons also count ---------- */
el('#shufflePlan').addEventListener('click', ()=> rotateQuote());

/* ---------- Utilities ---------- */
function openInfo(id){
  openWorkout(id, true);
}

/* expose openInfo for “Info” buttons if needed */
window.openInfo = openInfo;
