/* ================= IMPORTS ================= */

import { db, auth } from "./firebase-refleksjon.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

async function loadPlayerInfo(uid) {
  try {
    const q = query(
      collection(db, "spillere"),
      where("uid", "==", uid)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn("Fant ingen spiller i 'spillere' med uid =", uid);
      return;
    }

    const playerData = snap.docs[0].data();

    const nameEl = document.getElementById("player-name");
    const subEl  = document.getElementById("player-sub");

    if (nameEl) {
      nameEl.textContent = playerData.navn || "Spiller";
    }

    if (subEl) {
      const pos = playerData.posisjon || "Ukjent posisjon";
      subEl.textContent = `# • ${pos}`;
    }

  } catch (err) {
    console.error("Feil ved lasting av spillerinfo:", err);
  }
}


/* ================= LOAD UTVIKLINGSPLAN ================= */

async function loadPlan(uid) {
  try {

    // 🔍 Finn utviklingsplan via uid-felt
    const q = query(
      collection(db, "evalueringer"),
      where("uid", "==", uid)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn("Ingen utviklingsplan funnet for spiller.");
      return;
    }

    // Det skal kun være ÉN plan per spiller
    const docSnap = snap.docs[0];
    const data = docSnap.data();

    const contentEl = document.getElementById("plan-content");

if (contentEl) {
  contentEl.innerHTML = `
<div class="plan-section fysisk">
  <div class="plan-section-title fysisk">FYSISKE MÅL</div>

  <ul class="plan-list">
    <li>${data.fys1 || ""}</li>
    <li>${data.fys2 || ""}</li>
  </ul>

  ${data.fys3 ? `
    <div class="exercise-line">
      <span class="exercise-label">Forslag til øvelse</span>
      ${data.fys3}
    </div>
  ` : ""}
</div>

<div class="plan-section teknisk">
  <div class="plan-section-title teknisk">TEKNISKE MÅL</div>

  <ul class="plan-list">
    <li>${data.tek1 || ""}</li>
    <li>${data.tek2 || ""}</li>
  </ul>

  ${data.tek3 ? `
    <div class="exercise-line">
      <span class="exercise-label">Forslag til øvelse</span>
      ${data.tek3}
    </div>
  ` : ""}
</div>

<div class="plan-section taktisk">
  <div class="plan-section-title taktisk">TAKTISKE MÅL</div>

  <ul class="plan-list">
    <li>${data.tak1 || ""}</li>
    <li>${data.tak2 || ""}</li>
  </ul>

  ${data.tak3 ? `
    <div class="exercise-line">
      <span class="exercise-label">Forslag til øvelse</span>
      ${data.tak3}
    </div>
  ` : ""}
</div>

 <div class="plan-comment">
  <div class="plan-comment-title">Kommentar fra CoachFroden</div>
  <div class="plan-comment-text">
    ${data.kommentar || ""}
  </div>
</div>



`;

}


    // Eksempel: oppdatert-dato
const updatedEl = document.getElementById("plan-updated");
if (updatedEl && data.oppdatert) {
  const date = new Date(data.oppdatert);

  const formatted = date.toLocaleString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  updatedEl.textContent = "Oppdatert: " + formatted;
}


    // TODO: fyll inn resten av UI-et slik du allerede gjør

  } catch (err) {
    console.error("Feil ved lasting av utviklingsplan:", err);
  }
}



/* ================= AUTH GUARD ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  await loadPlayerInfo(user.uid);
  await loadPlan(user.uid);
});


const closeBtn = document.getElementById("closeBtn");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    window.location.href = "minside.html";
  });
}
