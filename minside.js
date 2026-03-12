"use strict";

import { auth, db } from "./firebase-refleksjon.js";
import { doc, getDoc, collection, query, where, getDocs } 
from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= FIREBASE CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyAKZMu2HZPmmoZ1fFT7DNA9Q6ystbKEPgE",
  authDomain: "samnanger-g14-f10a1.firebaseapp.com",
  projectId: "samnanger-g14-f10a1",
  storageBucket: "samnanger-g14-f10a1.firebasestorage.app",
  messagingSenderId: "926427862844",
  appId: "1:926427862844:web:5e6d11bb689c802d01b039",
  measurementId: "G-EJL3YYC63R"
};

/* ================= AUTH CHECK ================= */

import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

function getWeekNumber(date = new Date()) {
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + firstJan.getDay() + 1) / 7);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Finn spiller koblet til uid
const q = query(
  collection(db, "spillere"),
  where("uid", "==", user.uid)
);

const snap = await getDocs(q);

  if (snap.empty) {
    alert("Fant ingen spiller koblet til brukeren.");
    return;
  }

  const player = snap.docs[0].data();

  document.getElementById("player-name").textContent = player.navn;
  document.getElementById("player-role").textContent = player.rolle || "";

  // Sjekk om spilleren har fått tilbakemelding
  checkForFeedback(user.uid);
});

/* ================= SJEKK TILBAKEMELDINGER ================= */

async function checkForFeedback(uid) {
const snapshot = await getDocs(
  collection(db, "refleksjoner", uid, "entries")
);

  let hasFeedback = false;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.coachFeedback && data.coachFeedback.trim() !== "") {
      hasFeedback = true;
    }
  });

  const badge = document.getElementById("feedbackBadge");

  if (hasFeedback) {
    badge.classList.remove("hidden");
  }
}

async function loadWeeklyExercises(){

  const weekNumber = getWeekNumber();
  const ref = doc(db, "weeklyExercises", "week"+weekNumber);
  const snap = await getDoc(ref);

  if(!snap.exists()) return;

  const data = snap.data();

  const focusEl = document.getElementById("weeklyFocus");
  const card = document.getElementById("weeklyFocusCard");

  if (focusEl) {
    focusEl.textContent = data.focus;
  }

  if (card) {
    card.onclick = () => {
      window.location.href = "ovelser.html";
    };
  }

}

loadWeeklyExercises();

/* ================= NAVIGASJON ================= */

window.goTo = function (page) {
  window.location.href = page;
};

/* ================= LOGG UT ================= */

document.getElementById("logoutBtn").onclick = () => {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
};
