console.log("TILBAKEMELDINGER JS LASTET");

import { auth, db } from "./firebase-refleksjon.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const list = document.getElementById("fbList");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    const q = query(
      collection(db, "feedback"),
      where("playerId", "==", user.uid),
      where("status", "==", "sent"),
      orderBy("updatedAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      list.innerHTML = "Ingen tilbakemeldinger ennå.";
      return;
    }

    const entries = snap.docs.map(d => d.data());

    list.innerHTML = entries.map(e => {

      const text = e.editedText?.trim()
        ? e.editedText
        : e.generatedText;

      return `
        <div class="fb-entry">
          <p>${text}</p>
        </div>
      `;

    }).join("");

  } catch (err) {
    console.error(err);
    list.innerHTML = "Feil ved henting av tilbakemeldinger.";
  }

});

document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "minside.html";
    });
  }
});
