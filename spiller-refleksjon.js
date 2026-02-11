console.log("✅ spiller-refleksjon.js LASTET");

import { auth, db } from "./firebase-refleksjon.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ==== DOM ==== */
const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");
/* resten av JS-koden din er UENDRET */
const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginStatus = document.getElementById("loginStatus");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerBtn = document.getElementById("registerBtn");
const registerStatus = document.getElementById("registerStatus");

const showRegisterBtn = document.getElementById("showRegisterBtn");
const showLoginBtn = document.getElementById("showLoginBtn");

const logoutBtn = document.getElementById("logoutBtn");

const weeklyForm = document.getElementById("weeklyForm");
const effortEl = document.getElementById("effort");
const energyEl = document.getElementById("energy");
const workedEl = document.getElementById("workedOnSeasonGoal");
const goodEl = document.getElementById("goodThing");
const improveEl = document.getElementById("improveThing");
const coachEl = document.getElementById("coachNote");
const weeklyStatusEl = document.getElementById("weeklyStatus");
const registerPasswordConfirm =
  document.getElementById("registerPasswordConfirm");
  const coachEmail = document.getElementById("coachEmail");
const coachPassword = document.getElementById("coachPassword");
const coachLoginBtn = document.getElementById("coachLoginBtn");
const coachLoginStatus = document.getElementById("coachLoginStatus");
const showCoachLogin = document.getElementById("showCoachLogin");
const coachLoginBox = document.getElementById("coachLoginBox");

showCoachLogin.onclick = () => {
  coachLoginBox.hidden = !coachLoginBox.hidden;
};




/* =========================
   Helpers
========================= */
function pad2(n){ return String(n).padStart(2,"0"); }
function isoDate(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function formatNorDate(d){ return `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${d.getFullYear()}`; }
function getISOWeek(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
function setStatus(el, msg){
  el.textContent = msg || "";
}

async function loadSeasonGoal(uid) {
  const goalRef = doc(db, "users", uid);
  const snap = await getDoc(goalRef);

  if (!snap.exists()) return;

  const data = snap.data();

  const seasonGoalInput = document.getElementById("seasonGoal");
  const seasonBadge = document.getElementById("seasonBadge");
  const seasonUpdated = document.getElementById("seasonUpdated");

  if (!seasonGoalInput || !seasonBadge || !seasonUpdated) return;

  if (data.seasonGoal && data.seasonGoal.trim() !== "") {
    seasonGoalInput.value = data.seasonGoal;
    seasonBadge.textContent = "Satt";

    if (data.seasonGoalUpdatedAt) {
      const d = new Date(data.seasonGoalUpdatedAt);
      seasonUpdated.textContent =
        "Oppdatert: " + d.toLocaleDateString("nb-NO");
    } else {
      seasonUpdated.textContent = "";
    }
  } else {
    seasonGoalInput.value = "";
    seasonBadge.textContent = "Ikke satt";
    seasonUpdated.textContent = "";
  }
}

/* =========================
   Sesongmål (localStorage)
========================= */
const seasonGoalEl = document.getElementById("seasonGoal");
const seasonBadgeEl = document.getElementById("seasonBadge");
const seasonUpdatedEl = document.getElementById("seasonUpdated");
const seasonStatusEl = document.getElementById("seasonStatus");
const saveSeasonBtn = document.getElementById("saveSeasonBtn");
const clearSeasonBtn = document.getElementById("clearSeasonBtn");

saveSeasonBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const goal = seasonGoalEl.value.trim();

  await setDoc(doc(db, "users", user.uid), {
    seasonGoal: goal,
    seasonGoalUpdatedAt: new Date().toISOString()
  }, { merge: true });

  setStatusAuto(seasonStatusEl, "Sesongmål lagret ✔️", "ok", 3000);
  await loadSeasonGoal(user.uid);
};

clearSeasonBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, "users", user.uid), {
    seasonGoal: "",
    seasonGoalUpdatedAt: ""
  }, { merge: true });

  await loadSeasonGoal(user.uid);
  setStatusAuto(seasonStatusEl, "Sesongmål slettet.", "warn", 3000);
};

let statusTimeout = null;

function setStatusAuto(el, text, type = "ok", delay = 3000) {
  if (!el) return;

  // Sett melding
  setStatus(el, text, type);

  // Nullstill tidligere timer
  if (statusTimeout) {
    clearTimeout(statusTimeout);
  }

  // Auto-fjern etter delay
  statusTimeout = setTimeout(() => {
    setStatus(el, "");
    statusTimeout = null;
  }, delay);
}


/* =========================
   Tøm ukefelter
========================= */
const resetWeeklyBtn = document.getElementById("resetWeeklyBtn");

resetWeeklyBtn.onclick = () => {
  weeklyForm.reset();
  setStatus(weeklyStatusEl, "Feltene er tømt.", "warn");
};


/* =========================
   Weekly reflection submit
========================= */
weeklyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!effortEl.value || !energyEl.value || !workedEl.value) {
    setStatus(weeklyStatusEl, "Fyll ut de tre første punktene.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    setStatus(weeklyStatusEl, "Du må være innlogget.");
    return;
  }

  const now = new Date();
  const uid = user.uid;

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

   const userData = userSnap.exists() ? userSnap.data() : {};
const email = user.email || "";

const updates = {
  email: email,
  updatedAt: now.toISOString()
};

if (!userData.name || userData.name === "Ukjent") {
  updates.name = email ? email.split("@")[0] : "Ukjent";
}

await setDoc(userRef, updates, { merge: true });

// 🔹 Sørg for at parent-dokumentet finnes
await setDoc(
  doc(db, "refleksjoner", uid),
  { createdAt: serverTimestamp() },
  { merge: true }
);

const weekId = String(getISOWeek(now)); // f.eks "6"

await setDoc(
  doc(db, "refleksjoner", uid, "entries", weekId),
  {
    createdAt: serverTimestamp(),   // settes kun første gang
    updatedAt: serverTimestamp(),   // alltid ny
    dateISO: isoDate(now),
    dateNor: formatNorDate(now),
    week: getISOWeek(now),
    year: now.getFullYear(),

    effort: effortEl.value,
    energy: energyEl.value,
    workedOnSeasonGoal: workedEl.value,
    goodThing: goodEl.value,
    improveThing: improveEl.value,
    coachNote: coachEl.value
  },
  { merge: true } // 🔑 muliggjør redigering samme uke
);

await addDoc(
  collection(db, "refleksjoner", uid, "entries", weekId, "updates"),
  {
    updatedAt: serverTimestamp(),
    effort: effortEl.value,
    energy: energyEl.value,
    workedOnSeasonGoal: workedEl.value,
    goodThing: goodEl.value,
    improveThing: improveEl.value,
    coachNote: coachEl.value
  }
);

    weeklyForm.reset();
    setStatus(weeklyStatusEl, "Ukerefleksjon sendt 👍");
  } catch (err) {
  console.error("LAGRINGSFEIL:", err);
  setStatus(weeklyStatusEl, "Kunne ikke lagre. Prøv igjen.");
}

});

/* =========================
   Auth state → UI
========================= */

function showLoggedOutUI() {
  // Vis login / skjul app
  appBox.hidden = true;
  authBox.hidden = false;

  loginBox.hidden = false;
  registerBox.hidden = true;

  setStatus(loginStatus, "");
  setStatus(registerStatus, "");

  // 🔴 Tøm ukerefleksjon
  const weeklyForm = document.getElementById("weeklyForm");
  if (weeklyForm) weeklyForm.reset();

  // 🔴 Skjul innlogget bruker
  const userBox = document.getElementById("loggedInUser");
  if (userBox) userBox.hidden = true;

  // 🔴 Tøm login-felter
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  if (loginEmail) loginEmail.value = "";
  if (loginPassword) loginPassword.value = "";
  
  setStatus(seasonStatusEl, "");
}

const backBtn = document.getElementById("backBtn");

if (backBtn) {
  backBtn.onclick = () => {
    window.location.href = "minside.html";
  };
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // 🔐 Ikke innlogget → tilbake til login
    window.location.href = "login.html";
    return;
  }

  // ✅ Innlogget → refleksjon kan brukes
  await loadSeasonGoal(user.uid);
});
