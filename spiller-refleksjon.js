import { auth, db } from "./firebase-refleksjon.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

console.log("SPILLER REFLEKSJON LASTET");

let reflectionData = [];
let currentOpenIndex = null;

const submitBtn = document.getElementById("submitBtn");

// ==============================
// AUTH CHECK
// ==============================

auth.onAuthStateChanged(async (user) => {

  if (!user) {
    console.log("Ingen bruker → sender til login");
    window.location.href = "login.html";
    return;
  }

  console.log("Innlogget som:", user.uid);

  document.getElementById("appBox").hidden = false;

  await loadHistory(user.uid);
  await loadSeasonGoal(user.uid);

});


// ==============================
// LAST HISTORIKK
// ==============================

async function loadHistory(uid) {

  const historyDiv = document.getElementById("historyList");
  historyDiv.innerHTML = "Laster...";

  const entriesRef = collection(db, "refleksjoner", uid, "entries");
  const q = query(entriesRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    historyDiv.innerHTML = "<p>Ingen refleksjoner enda.</p>";
    return;
  }

  historyDiv.innerHTML = "";

  reflectionData = [];

snapshot.forEach(docSnap => {
  reflectionData.push(docSnap.data());
});
populateWeekSelector();
}

function populateWeekSelector() {

  const selector = document.getElementById("weekSelector");
  selector.innerHTML = "";

  reflectionData.forEach((entry, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `Uke ${entry.week} (${entry.year})`;
    selector.appendChild(option);
  });

selector.addEventListener("change", (e) => {

  const selectedIndex = e.target.value;

  // Hvis tom verdi → lukk visningen
  if (selectedIndex === "") {
    document.getElementById("historyList").innerHTML = "";
    currentOpenIndex = null;
    return;
  }

  showReflection(selectedIndex);
  currentOpenIndex = selectedIndex;

});

  const defaultOption = document.createElement("option");
defaultOption.textContent = "Velg uke";
defaultOption.value = "";
defaultOption.disabled = false;
defaultOption.selected = true;
selector.prepend(defaultOption);

}

function showReflection(index) {

  const historyDiv = document.getElementById("historyList");
  const data = reflectionData[index];

  let content = `
    <p><strong>Innsats:</strong> ${data.effort}</p>
    <p><strong>Energi:</strong> ${data.energy}</p>
    <p><strong>Jobbet med sesongmål:</strong> ${data.workedOnSeasonGoal}</p>
  `;

  if (data.type === "training") {
    content += `
      <p><strong>Fornøyd med:</strong> ${data.goodThing || ""}</p>
      <p><strong>Neste uke:</strong> ${data.improveThing || ""}</p>
      <p><strong>Til trener:</strong> ${data.coachNote || ""}</p>
    `;
  }

  if (data.type === "match") {
    content += `
      <p><strong>Situasjon:</strong> ${data.matchSituation || ""}</p>
      <p><strong>Gjorde bra:</strong> ${data.matchGood || ""}</p>
      <p><strong>Kunne vært annerledes:</strong> ${data.matchImprove || ""}</p>
      <p><strong>Påvirkning på laget:</strong> ${data.matchImpact || ""}</p>
      <p><strong>Tar med videre:</strong> ${data.matchTransfer || ""}</p>
    `;
  }

  historyDiv.innerHTML = `
    <div id="openReflection" class="history-card">
      <h3>Uke ${data.week} (${data.year})</h3>
      ${content}
    </div>
  `;

  setTimeout(() => {
    const card = document.getElementById("openReflection");
    if (card) card.classList.add("show");
  }, 10);
}


document.addEventListener("click", function (event) {

  const openCard = document.getElementById("openReflection");
  const selector = document.getElementById("weekSelector");

  if (!openCard) return;

  if (openCard.contains(event.target)) return;
  if (selector.contains(event.target)) return;

  openCard.classList.remove("show");
  openCard.classList.add("hide");

  setTimeout(() => {
    document.getElementById("historyList").innerHTML = "";
    selector.value = "";
  }, 250);

});

async function loadSeasonGoal(uid) {

  try {

    const goalRef = doc(db, "seasonGoals", uid);
    const goalSnap = await getDoc(goalRef);

    if (goalSnap.exists()) {

      const data = goalSnap.data();

      document.getElementById("seasonGoal").value = data.goal || "";

      if (data.updatedAt) {
        const date = data.updatedAt.toDate();
        document.getElementById("seasonUpdated").textContent =
          "Oppdatert: " + date.toLocaleDateString("no-NO");
      }

      document.getElementById("seasonBadge").textContent = "Satt";

    } else {

      document.getElementById("seasonBadge").textContent = "Ikke satt";

    }

  } catch (error) {
    console.error("Feil ved lasting av sesongmål:", error);
  }

}

document.querySelectorAll("textarea").forEach(el => {
  el.addEventListener("input", updateXP);
});

document.querySelectorAll(".choice-buttons button, .score-buttons button")
  .forEach(btn => {
    btn.addEventListener("click", updateXP);
});

document.querySelectorAll(".mode-toggle button")
  .forEach(btn => {
    btn.addEventListener("click", updateXP);
});


// ==============================
// LAGRE NY REFLEKSJON
// ==============================

const weeklyForm = document.getElementById("weeklyForm");

if (weeklyForm) {

  weeklyForm.addEventListener("submit", async (e) => {

    e.preventDefault(); // VIKTIG – stopper reload

    const user = auth.currentUser;
    if (!user) return;

    const effort = document.getElementById("effort").value;
    const energy = document.getElementById("energy").value;
	const energyMap = { Lav: 1, Middels: 2, Høy: 3 };
    const energyValue = energyMap[energy];
	console.log("Energy:", energy, "=>", energyValue);
    const workedOnSeasonGoal = document.getElementById("workedOnSeasonGoal").value;
    const goodThing = document.getElementById("goodThing").value;
    const improveThing = document.getElementById("improveThing").value;
    const coachNote = document.getElementById("coachNote").value;

    try {

      const entriesRef = collection(db, "refleksjoner", user.uid, "entries");
	  
	  const now = new Date();
const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

const year = new Date().getFullYear();

const selectedType = document.getElementById("reflectionType").value;

let reflectionPayload = {
  effort,
  energy,
  workedOnSeasonGoal,
  year,
  week,
  type: selectedType,
  createdAt: serverTimestamp()
};

if (selectedType === "training") {
  reflectionPayload.goodThing =
    document.getElementById("goodThing").value;
  reflectionPayload.improveThing =
    document.getElementById("improveThing").value;
  reflectionPayload.coachNote =
    document.getElementById("coachNote").value;
}

if (selectedType === "match") {
  reflectionPayload.matchSituation =
    document.getElementById("matchSituation").value;
  reflectionPayload.matchGood =
    document.getElementById("matchGood").value;
  reflectionPayload.matchImprove =
    document.getElementById("matchImprove").value;
}

await addDoc(
  collection(db, "refleksjoner", user.uid, "entries"),
  reflectionPayload
);

weeklyStatus.textContent = "🔥 Refleksjon lagret!";
weeklyStatus.style.color = "#22c55e";

weeklyForm.reset();
matchFields.hidden = true;
trainingFields.hidden = false;

await loadHistory(user.uid);

} catch (error) {
  console.error("Feil ved lagring:", error);
}
});
}

// ==============================
// SESONGMÅL
// ==============================

const saveSeasonBtn = document.getElementById("saveSeasonBtn");
console.log("saveSeasonBtn:", saveSeasonBtn);

const clearSeasonBtn = document.getElementById("clearSeasonBtn");
const seasonGoalInput = document.getElementById("seasonGoal");
const seasonStatus = document.getElementById("seasonStatus");

if (saveSeasonBtn) {

  saveSeasonBtn.addEventListener("click", async () => {

    const user = auth.currentUser;
    if (!user) return;

    const goalText = seasonGoalInput.value.trim();

    if (!goalText) {
      seasonStatus.textContent = "Du må skrive et mål.";
      return;
    }

    try {

      const goalRef = doc(db, "seasonGoals", user.uid);

      await setDoc(goalRef, {
        goal: goalText,
        updatedAt: serverTimestamp()
      });

      seasonStatus.textContent = "Mål lagret!";

    } catch (error) {
      console.error(error);
      seasonStatus.textContent = "Noe gikk galt.";
    }

  });
}

const trainingFields = document.getElementById("trainingFields");
const matchFields = document.getElementById("matchFields");

const modeButtons = document.querySelectorAll(".mode-toggle button");
const reflectionTypeInput = document.getElementById("reflectionType");

modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    // Reset form values
    weeklyForm.reset();

    // Fjern alle active-klasser på valgknapper
    document.querySelectorAll(".score-buttons button, .choice-buttons button")
      .forEach(el => el.classList.remove("active", "low", "mid", "high"));

    // Sett riktig toggle aktiv
    modeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Oppdater type
    reflectionTypeInput.value = btn.dataset.value;

    // Vis riktig felt
    if (btn.dataset.value === "match") {
      trainingFields.hidden = true;
      matchFields.hidden = false;
    } else {
      trainingFields.hidden = false;
      matchFields.hidden = true;
    }
	

    // Nullstill XP eksplisitt
    xpBar.style.width = "0%";
    xpText.textContent = "0% Complete";
    submitBtn.disabled = true;
	
  });
});

const effortButtons = document.querySelectorAll("#effortButtons button");
const effortInput = document.getElementById("effort");

effortButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    effortButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    effortInput.value = btn.dataset.value;
  });
});

const energyButtons = document.querySelectorAll("#energyButtons button");
const energyInput = document.getElementById("energy");

energyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    energyButtons.forEach(b => b.classList.remove("active", "low", "mid", "high"));

    btn.classList.add("active");

    if (btn.dataset.value === "Lav") btn.classList.add("low");
    if (btn.dataset.value === "Middels") btn.classList.add("mid");
    if (btn.dataset.value === "Høy") btn.classList.add("high");

    energyInput.value = btn.dataset.value;
  });
});


const seasonGoalButtons = document.querySelectorAll("#seasonGoalButtons button");
const workedOnSeasonGoalInput = document.getElementById("workedOnSeasonGoal");

seasonGoalButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    seasonGoalButtons.forEach(b => b.classList.remove("active", "low", "mid", "high"));

    btn.classList.add("active");

    if (btn.dataset.value === "Nei") btn.classList.add("low");
    if (btn.dataset.value === "Litt") btn.classList.add("mid");
    if (btn.dataset.value === "Ja") btn.classList.add("high");

    workedOnSeasonGoalInput.value = btn.dataset.value;
  });
});

const xpBar = document.getElementById("xpBar");
const xpText = document.getElementById("xpText");

function updateXP() {

  let total = 0;
  let filled = 0;

  // Innsats
  total++;
  if (document.getElementById("effort").value) filled++;

  // Energi
  total++;
  if (document.getElementById("energy").value) filled++;

  // Sesongmål-jobbing
  total++;
  if (document.getElementById("workedOnSeasonGoal").value) filled++;

  const selectedType = document.getElementById("reflectionType").value;

  if (selectedType === "training") {
    total += 2;
    if (document.getElementById("goodThing").value.trim()) filled++;
    if (document.getElementById("improveThing").value.trim()) filled++;
  }

  if (selectedType === "match") {
    total += 3;
    if (document.getElementById("matchSituation").value.trim()) filled++;
    if (document.getElementById("matchGood").value.trim()) filled++;
    if (document.getElementById("matchImprove").value.trim()) filled++;
  }

  const percent = Math.round((filled / total) * 100);

  xpBar.style.width = percent + "%";
  xpText.textContent = percent + "% Complete";
  
  if (percent === 100) {
  submitBtn.disabled = false;
} else {
  submitBtn.disabled = true;
}

}


// ==============================
// TILBAKE KNAPP
// ==============================

window.goBack = function () {
  window.location.href = "minside.html";
};
