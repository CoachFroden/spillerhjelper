import { db } from "./firebase-refleksjon.js";
import { doc, getDoc } 
from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= UKENUMMER ================= */

function getWeekNumber() {
  const date = new Date();
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((date.getDay() + 1 + days) / 7);
}

const currentWeek = getWeekNumber();

/* ================= ELEMENTER ================= */

const weekSelect = document.getElementById("weekSelect");
const exerciseList = document.getElementById("exerciseList");

/* ================= FYLL UKEVELGER ================= */

weekSelect.innerHTML = "";

const firstOption = document.createElement("option");
firstOption.text = "Velg uke";
firstOption.value = "";
weekSelect.appendChild(firstOption);

for (let i = 0; i < 8; i++) {

  const option = document.createElement("option");
  const weekNumber = currentWeek + i;

  if (i === 0) {
    option.text = "Denne uken";
  } 
  else if (i === 1) {
    option.text = "Neste uke";
  } 
  else {
    option.text = "Uke " + weekNumber;
  }

  option.value = "week" + weekNumber;

  weekSelect.appendChild(option);
}

/* ================= LAST ØVELSER ================= */

async function loadExercises() {

  const weekChoice = weekSelect.value;

  if (!weekChoice) {
    exerciseList.innerHTML = `
      <div style="padding:20px;text-align:center;">
        <h3>Ingen øvelser klar for denne uken</h3>
      </div>
    `;
    return;
  }

  const ref = doc(db, "weeklyExercises", weekChoice);
  const snap = await getDoc(ref);

  exerciseList.innerHTML = "";

  if (!snap.exists()) {
exerciseList.innerHTML = `
  <div class="no-exercises">
    <h3>Ingen øvelser klar for denne uken</h3>
  </div>
`;
    return;
  }

  const data = snap.data();

  if (!data.exercises || data.exercises.length === 0) {
    exerciseList.innerHTML = `
      <div style="padding:20px;text-align:center;">
        <h3>Ingen øvelser klar for denne uken</h3>
      </div>
    `;
    return;
  }

  data.exercises.forEach(ex => {

    const div = document.createElement("div");
    div.className = "exercise-card";

    div.innerHTML = `
      <div class="exercise-title">⚽ ${ex.title}</div>
      <video controls>
        <source src="${ex.video}" type="video/mp4">
      </video>
    `;

    exerciseList.appendChild(div);

  });

}

/* ================= VELG UKE ================= */

weekSelect.addEventListener("change", loadExercises);