const DAYS = ["Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма"];
const DAY_SHORT = {"Дүйсенбі":"Дс","Сейсенбі":"Сс","Сәрсенбі":"Ср","Бейсенбі":"Бс","Жұма":"Жм"};
const JS_DAY_TO_KK = [null, "Дүйсенбі", "Сейсенбі", "Сәрсенбі", "Бейсенбі", "Жұма", null];

const state = { data: null, shift: "1", classId: "", day: "Дүйсенбі" };
const els = {
  classSelect: document.querySelector("#classSelect"),
  dayTabs: document.querySelector("#dayTabs"),
  lessonList: document.querySelector("#lessonList"),
  scheduleTitle: document.querySelector("#scheduleTitle"),
  selectedShift: document.querySelector("#selectedShift"),
  classMeta: document.querySelector("#classMeta"),
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
  els.lessonList.innerHTML = lessons.map(item => `
    <li class="lesson">
      <span class="lesson-number">${item.number}</span>
      <span class="lesson-subject${item.subject ? "" : " lesson-free"}">${item.subject || "—"}</span>
      <span class="lesson-badge">${item.subject ? "Сабақ" : "Бос"}</span>
    </li>`).join("");
  els.lessonList.hidden = activeLessons.length === 0;
  els.emptyState.hidden = activeLessons.length !== 0;
  els.panel.setAttribute("aria-busy", "false");
  document.title = `${selectedClass.name} — ${state.day} | №202`;
}

function updateAll() {
  renderClassOptions();
  renderDays();
  renderSchedule();
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
    const response = await fetch("schedule-data.json", { cache: "no-store" });
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
