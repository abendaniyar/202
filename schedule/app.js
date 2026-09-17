const DAYS = ["Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма"];
const DAY_SHORT = {"Дүйсенбі":"Дс","Сейсенбі":"Сс","Сәрсенбі":"Ср","Бейсенбі":"Бс","Жұма":"Жм"};
const JS_DAY_TO_KK = [null, "Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", null];
const BELLS = {
  "1": [
    { time: "08:00-08:45", break: "5 мин" },
    { time: "08:50-09:35", break: "10 мин" },
    { time: "09:45-10:30", break: "10 мин" },
    { time: "10:40-11:25", break: "5 мин" },
    { time: "11:30-12:15", break: "5 мин" },
    { time: "12:20-13:05", break: "5 мин" },
    { time: "13:10-13:55", break: "—" }
  ],
  "2": [
    { time: "14:00-14:45", break: "5 мин" },
    { time: "14:50-15:35", break: "10 мин" },
    { time: "15:45-16:30", break: "10 мин" },
    { time: "16:40-17:25", break: "5 мин" },
    { time: "17:30-18:15", break: "5 мин" },
    { time: "18:20-19:05", break: "5 мин" },
    { time: "19:10-19:55", break: "—" }
  ]
};

const state = { data: null, shift: "1", classId: "", day: "Дүйсенбі" };
const els = {
  classSelect: document.querySelector("#classSelect"),
  dayTabs: document.querySelector("#dayTabs"),
  lessonList: document.querySelector("#lessonList"),
  scheduleTitle: document.querySelector("#scheduleTitle"),
  selectedShift: document.querySelector("#selectedShift"),
  classMeta: document.querySelector("#classMeta"),
  bellGrid: document.querySelector("#bellGrid"),
  emptyState: document.querySelector("#emptyState"),
  panel: document.querySelector(".schedule-panel"),
  todayLabel: document.querySelector("#todayLabel"),
  errorToast: document.querySelector("#errorToast")
};

function currentSchoolDay() {
  return JS_DAY_TO_KK[new Date().getDay()] || "Дүйсенбі";
}

function setTodayLabel() {
  const now = new Date();
  const label = new Intl.DateTimeFormat("kk-KZ", { weekday: "long", day: "numeric", month: "long" }).format(now);
  els.todayLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);
}

function renderClassOptions() {
  const classes = state.data.shifts[state.shift].classes;
  const remembered = localStorage.getItem(`schedule-class-${state.shift}`);
  if (!state.classId || !classes.some(item => item.id === state.classId)) {
    state.classId = classes.some(item => item.id === remembered) ? remembered : classes[0].id;
  }
  els.classSelect.innerHTML = classes.map(item => `<option value="${item.id}">${item.name}</option>`).join("");
  els.classSelect.value = state.classId;
}

function renderDays() {
  const today = currentSchoolDay();
  els.dayTabs.innerHTML = DAYS.map(day => `
    <button type="button" class="day-button${day === state.day ? " active" : ""}${day === today ? " today" : ""}" data-day="${day}">
      <span class="day-full">${day}</span><span class="day-short" hidden>${DAY_SHORT[day]}</span>
    </button>`).join("");
}

function renderSchedule() {
  const shift = state.data.shifts[state.shift];
  const selectedClass = shift.classes.find(item => item.id === state.classId);
  if (!selectedClass) return;
  const lessons = selectedClass.days[state.day] || [];
  const activeLessons = lessons.filter(item => item.subject);

  els.selectedShift.textContent = `${state.shift}-ауысым · ${selectedClass.grade}-сынып`;
  els.scheduleTitle.textContent = `${selectedClass.name} · ${state.day}`;
  const details = [];
  if (selectedClass.teacher) details.push(`<span>Сынып жетекшісі: <strong>${selectedClass.teacher}</strong></span>`);
  if (selectedClass.room) details.push(`<span>Кабинет: <strong>${selectedClass.room.replace(/^каб\s*№?/i, "").trim()}</strong></span>`);
  els.classMeta.innerHTML = details.join("<br>");
  els.lessonList.innerHTML = lessons.map((item, index) => {
    const bell = BELLS[state.shift][index];
    return `
    <li class="lesson">
      <span class="lesson-number">${item.number}</span>
      <span class="lesson-subject${item.subject ? "" : " lesson-free"}">${item.subject || "—"}</span>
      <span class="lesson-time"><strong>${bell.time}</strong><small>${bell.break === "—" ? "Соңғы сабақ" : `Үзіліс: ${bell.break}`}</small></span>
    </li>`;
  }).join("");
  els.lessonList.hidden = activeLessons.length === 0;
  els.emptyState.hidden = activeLessons.length !== 0;
  els.panel.setAttribute("aria-busy", "false");
  document.title = `${selectedClass.name} — ${state.day} | №202`;
}

function renderBellSchedule() {
  els.bellGrid.innerHTML = Object.entries(BELLS).map(([shift, rows]) => `
    <article class="bell-card${shift === state.shift ? " active" : ""}">
      <h3>${shift}-ауысым</h3>
      <table class="bell-table">
        <thead><tr><th>№</th><th>Сабақ уақыты</th><th>Үзіліс</th></tr></thead>
        <tbody>${rows.map((row, index) => `
          <tr><td>${index + 1}</td><td>${row.time}</td><td>${row.break}</td></tr>
        `).join("")}</tbody>
      </table>
    </article>
  `).join("");
}

function updateAll() {
  renderClassOptions();
  renderDays();
  renderSchedule();
  renderBellSchedule();
}

document.querySelectorAll(".shift-button").forEach(button => {
  button.addEventListener("click", () => {
    state.shift = button.dataset.shift;
    state.classId = "";
    document.querySelectorAll(".shift-button").forEach(item => item.classList.toggle("active", item === button));
    updateAll();
  });
});

els.classSelect.addEventListener("change", event => {
  state.classId = event.target.value;
  localStorage.setItem(`schedule-class-${state.shift}`, state.classId);
  renderSchedule();
});

els.dayTabs.addEventListener("click", event => {
  const button = event.target.closest("[data-day]");
  if (!button) return;
  state.day = button.dataset.day;
  renderDays();
  renderSchedule();
});

document.querySelector("#printButton").addEventListener("click", () => window.print());

async function init() {
  setTodayLabel();
  state.day = currentSchoolDay();
  try {
    const response = await fetch("schedule-data.json?v=20260917-2", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    updateAll();
  } catch (error) {
    console.error(error);
    els.errorToast.hidden = false;
    els.scheduleTitle.textContent = "Кесте жүктелмеді";
    els.panel.setAttribute("aria-busy", "false");
  }
}

init();
