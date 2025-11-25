/* --------------------------------------------------
   FitFlex — Main App Script
   Data stored in localStorage["fitflex"]
-------------------------------------------------- */

/* ---------- Shortcuts ---------- */
const el = sel => document.querySelector(sel);
const els = sel => [...document.querySelectorAll(sel)];

/* ---------- Local Storage DB ---------- */
const db = {
  load() {
    const raw = localStorage.getItem("fitflex");
    return raw
      ? JSON.parse(raw)
      : {
          theme: "dark",
          points: 0,
          calories: 0,
          workouts: 0,
          todayGoal: 30,
          history: [],
          badges: [],
          plan: ["Push-ups", "Squats", "Plank", "Lunges"],
        };
  },
  save() {
    localStorage.setItem("fitflex", JSON.stringify(state));
  },
};

let state = db.load();

/* --------------------------------------------------
   WORKOUT DATA
-------------------------------------------------- */
const WORKOUTS = [
  {
    id: "pushups",
    name: "Push-ups",
    type: "strength",
    level: "Beginner",
    seconds: 30,
    calories: 8,
    gif: "https://media.tenor.com/2h3qjGZ4YkIAAAAd/pushup.gif",
    desc: "Keep your body straight from head to heels, lower your body until your chest nearly touches the floor, then push back up.",
  },

  {
    id: "squats",
    name: "Bodyweight Squats",
    type: "strength",
    level: "Beginner",
    seconds: 30,
    calories: 10,
    gif: "https://media.tenor.com/9zX2hZLPpKMAAAAd/squat-exercise.gif",
    desc: "Feet shoulder-width apart, back straight, sit back and down, then rise.",
  },

  {
    id: "mountain",
    name: "Mountain Climbers",
    type: "cardio",
    level: "Intermediate",
    seconds: 30,
    calories: 12,
    gif: "https://media.tenor.com/6n63Pjv0UQkAAAAd/mountain-climber.gif",
    desc: "From plank position, rapidly drive knees toward your chest one at a time.",
  },

  {
    id: "plank",
    name: "Plank Hold",
    type: "core",
    level: "All",
    seconds: 30,
    calories: 6,
    gif: "https://media.tenor.com/VnKJ5KRlJVkAAAAd/plank-exercise.gif",
    desc: "Body in a straight line, elbows under shoulders, hold your core tight.",
  },

  {
    id: "jumpingjacks",
    name: "Jumping Jacks",
    type: "cardio",
    level: "All",
    seconds: 30,
    calories: 12,
    gif: "https://media.tenor.com/whV2wO_XmKkAAAAd/jumping-jacks.gif",
    desc: "Jump feet out while raising arms overhead, then return to start.",
  },

  {
    id: "lunges",
    name: "Alternating Lunges",
    type: "strength",
    level: "Intermediate",
    seconds: 30,
    calories: 9,
    gif: "https://media.tenor.com/p-euWQ64K_QAAAAd/lunges.gif",
    desc: "Step forward, lower your body until both knees are 90 degrees, alternate legs.",
  },

  {
    id: "highknees",
    name: "High Knees",
    type: "cardio",
    level: "All",
    seconds: 30,
    calories: 14,
    gif: "https://media.tenor.com/Gv34nQUwL2gAAAAd/high-knees.gif",
    desc: "Run in place while lifting knees high toward your chest.",
  },

  {
    id: "bicycle",
    name: "Bicycle Crunch",
    type: "core",
    level: "Intermediate",
    seconds: 30,
    calories: 8,
    gif: "https://media.tenor.com/vHQT590KqH0AAAAd/bicycle-crunch.gif",
    desc: "Lie on your back, bring opposite elbow to knee while extending the other leg.",
  },
];

/* --------------------------------------------------
   INITIALIZE UI
-------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  loadDashboard();
  loadPlan();
  loadWorkouts();
  loadHistory();
  initTabs();
  initControls();
});

/* --------------------------------------------------
   THEME
-------------------------------------------------- */

function applyTheme() {
  document.body.setAttribute("data-theme", state.theme);
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  db.save();
}

/* --------------------------------------------------
   TABS
-------------------------------------------------- */

function initTabs() {
  els(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      els(".tab").forEach((t) => t.classList.remove("active"));
      els(".page").forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      el(btn.dataset.target).classList.add("active");
    });
  });
}

/* --------------------------------------------------
   DASHBOARD
-------------------------------------------------- */

function loadDashboard() {
  el("#statWorkouts").textContent = state.workouts;
  el("#statCalories").textContent = state.calories;
  el("#statPoints").textContent = state.points;

  const percent = Math.min(
    100,
    Math.round((state.workouts / state.todayGoal) * 100)
  );
  el("#progressPercent").textContent = percent + "%";

  const offset = 327 - (327 * percent) / 100;
  el("#progressRing").style.strokeDashoffset = offset;

  loadBadges();
}

function loadBadges() {
  const box = el("#badges");
  box.innerHTML = "";

  state.badges.forEach((b) => {
    const div = document.createElement("div");
    div.className = "badge";
    div.textContent = b;
    box.appendChild(div);
  });
}

/* --------------------------------------------------
   WORKOUT LIBRARY
-------------------------------------------------- */

function loadWorkouts() {
  const grid = el("#workoutGrid");
  grid.innerHTML = "";

  WORKOUTS.forEach((w) => {
    const card = document.createElement("div");
    card.className = "workout-card";
    card.innerHTML = `
      <img src="${w.gif}">
      <h3>${w.name}</h3>
      <p>${w.level} • ${w.type}</p>
    `;
    card.onclick = () => openWorkout(w);
    grid.appendChild(card);
  });
}

/* --------------------------------------------------
   WORKOUT MODAL
-------------------------------------------------- */

let timer = null;
let timeLeft = 0;

function openWorkout(w) {
  el("#modalTitle").textContent = w.name;
  el("#modalDesc").textContent = w.desc;
  el("#modalGif").src = w.gif;

  timeLeft = w.seconds;
  updateTimerDisplay();

  el("#workoutModal").classList.remove("hidden");
}

function updateTimerDisplay() {
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  el("#countdown").textContent = `${mm}:${ss}`;

  const bar = (timeLeft / 30) * 100;
  el("#timeBar").style.width = bar + "%";
}

function startTimer() {
  if (timer) return;

  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      pauseTimer();
      alert("Time up!");
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  timer = null;
}

function completeWorkout() {
  pauseTimer();

  state.workouts++;
  state.calories += 10;
  state.points += 5;

  state.history.push({
    date: new Date().toLocaleString(),
    note: "Completed workout",
  });

  if (state.workouts >= 10 && !state.badges.includes("🔥 10 Workouts")) {
    state.badges.push("🔥 10 Workouts");
  }

  db.save();
  loadDashboard();
  loadHistory();

  el("#workoutModal").classList.add("hidden");
}

el("#closeModal").onclick = () =>
  el("#workoutModal").classList.add("hidden");

el("#startTimer").onclick = startTimer;
el("#pauseTimer").onclick = pauseTimer;
el("#completeWorkout").onclick = completeWorkout;

/* --------------------------------------------------
   PLANNER
-------------------------------------------------- */

function loadPlan() {
  const list = el("#todayPlan");
  list.innerHTML = "";
  state.plan.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p;
    list.appendChild(li);
  });
}

el("#shufflePlan").onclick = () => {
  state.plan.sort(() => Math.random() - 0.5);
  db.save();
  loadPlan();
};

el("#completePlan").onclick = () => {
  alert("Great job! All tasks completed!");
  state.points += 15;
  db.save();
  loadDashboard();
};

/* --------------------------------------------------
   HISTORY
-------------------------------------------------- */

function loadHistory() {
  const list = el("#historyList");
  list.innerHTML = "";

  state.history.forEach((h) => {
    const li = document.createElement("li");
    li.textContent = `${h.date} — ${h.note}`;
    list.appendChild(li);
  });
}

/* --------------------------------------------------
   EXPORT DATA
-------------------------------------------------- */

el("#exportData").onclick = () => {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "fitflex_data.json";
  a.click();
};

/* --------------------------------------------------
   SETTINGS BUTTONS
-------------------------------------------------- */

el("#themeToggle").onclick = toggleTheme;

el("#resetData").onclick = () => {
  if (confirm("Reset all data?")) {
    localStorage.removeItem("fitflex");
    location.reload();
  }
};
