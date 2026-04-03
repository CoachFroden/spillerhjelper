// ===== JS =====
import { auth, db } from "./firebase-refleksjon.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

function getWeekNumber(date) {
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + firstJan.getDay() + 1) / 7);
}

const selections = {
  training: { effort:null, energy:null, fun:null, more:[] },
  match: { effort:null, energy:null, fun:null, moreMatch:[] },
  current: "training"
};

const submitBtn = document.getElementById("submitBtn");

// ===== SESONGMÅL =====
const goalToggleBtn = document.getElementById("goalToggleBtn");
const goalBox = document.getElementById("goalBox");
const saveGoalBtn = document.getElementById("saveGoalBtn");

function setupSingle(id, key) {
  const buttons = document.querySelectorAll(`#${id} button`);

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      selections[selections.current][key] = btn.dataset.value;

      checkReady(); // ← DETTE ER DET SOM MANGLER
    });
  });
}

function setupMulti(id, key) {
  const buttons = document.querySelectorAll(`#${id} button`);

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");

      const current = selections.current;
      const value = btn.dataset.value;
      const targetKey = current === "match" ? "moreMatch" : "more";

      if (!selections[current][targetKey]) {
        selections[current][targetKey] = [];
      }

      if (selections[current][targetKey].includes(value)) {
        selections[current][targetKey] =
          selections[current][targetKey].filter(v => v !== value);
      } else {
        selections[current][targetKey].push(value);
      }

      checkReady();
    });
  });
}

const coachNoteToggleBtn = document.getElementById("coachNoteToggleBtn");
const coachNoteBox = document.getElementById("coachNoteBox");

coachNoteToggleBtn.addEventListener("click", () => {
  coachNoteBox.hidden = !coachNoteBox.hidden;
});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector('#type button[data-value="training"]');
  if (btn) btn.click();

  const backBtn = document.getElementById("backBtn");

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "./minside.html";
    });
  }
});

function checkReady() {
  const current = selections.current;

  const effort = selections[current].effort !== null;
  const energy = selections[current].energy !== null;
  const fun = selections[current].fun !== null;

  const moreArray = current === "match"
    ? selections[current].moreMatch
    : selections[current].more;

  const more = moreArray && moreArray.length > 0;

  let score = 0;
  if (effort) score++;
  if (energy) score++;
  if (fun) score++;
  if (more) score++;

  submitBtn.disabled = score < 2;
}

setupSingle("effort","effort");
setupSingle("energy","energy");
setupSingle("fun","fun");
setupMulti("more","more");
setupMulti("moreMatchButtons","moreMatch"); // ← LEGG TIL DENNE

document.querySelectorAll("#type button").forEach(btn => {
  btn.addEventListener("click", () => {

    // fjern aktiv fra begge
    document.querySelectorAll("#type button")
      .forEach(b => b.classList.remove("active"));

    // marker valgt
    btn.classList.add("active");

    // sett current (training eller match)
    selections.current = btn.dataset.value;
	checkReady();
	
	const isMatch = selections.current === "match";
	
	document.getElementById("funTitle").textContent =
  isMatch
    ? "🔥 Kva synest du om kampen denne veka?"
    : "😄 Kor gøy var treninga denne veka?";
	
	document.getElementById("moreTitle").textContent =
  isMatch
    ? "🏆 Kva vil du bli bedre på i kamp?"
    : "🎯 Kva vil du ha mer av på trening?";

const more = document.getElementById("more");

if (isMatch) {
  more.style.display = "none";
} else {
  more.style.display = "flex";
}

const moreMatch = document.getElementById("moreMatch");

if (isMatch) {
  moreMatch.hidden = false;
  moreMatch.style.display = "flex";
} else {
  moreMatch.hidden = true;
  moreMatch.style.display = "none"; // ← LEGG TIL DENNE
}

    // oppdater UI med lagrede verdier
    loadValues();
  });
});


function loadValues() {
  const current = selections.current;

  ["effort","energy","fun"].forEach(key => {
    const value = selections[current][key];

    document.querySelectorAll(`#${key} button`)
      .forEach(b => {
        b.classList.remove("active");
        if (b.dataset.value === value) {
          b.classList.add("active");
        }
      });
  });
}

submitBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

const current = selections.current;
const data = selections[current];

const now = new Date();

if (!data.effort || !data.energy) {
  alert("Du må velge innsats og energi");
  return;
}

const coachNote = document.getElementById("coachNote")?.value || "";

await setDoc(
  doc(db, "refleksjoner", user.uid, "entries", Date.now().toString()),
  {
    type: current,
    effort: parseInt(data.effort),
    energy: parseInt(data.energy),
    fun: parseInt(data.fun),

    more: current === "match"
      ? data.moreMatch || []
      : data.more || [],

    coachNote: coachNote, // 👈 NY

    week: getWeekNumber(now),
    year: now.getFullYear(),
    day: now.toLocaleDateString("en-US", { weekday: "short" }),

    createdAt: serverTimestamp()
  }
);

  document.getElementById("status").textContent = "🔥 Bra jobba!";
  submitBtn.disabled = true;
});

goalToggleBtn.addEventListener("click", () => {
  goalBox.hidden = !goalBox.hidden;
});



