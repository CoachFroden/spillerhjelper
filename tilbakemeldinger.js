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

const monthNames = [
  "Januar","Februar","Mars","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Desember"
];

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

    renderFeed(entries);

  } catch (err) {

    console.error(err);
    list.innerHTML = "Feil ved henting av tilbakemeldinger.";

  }

});


/* =========================
   RENDER FEED
========================= */

function renderFeed(entries){

  list.innerHTML = entries.map(e => {

    const text = e.editedText?.trim() ? e.editedText : e.generatedText;

    const preview = text.split(".")[0] + ".";

    let icon="⚽";
    let title="";

    if(e.type==="weekly"){
      title="Uke " + e.week;
    }

    if(e.type==="monthly"){
      icon="📅";
      title=monthNames[e.month-1] + " " + e.year;
    }

    if(e.type==="season"){
      icon="🏆";
      title="Sesongrapport " + e.year;
    }

return `

<div class="feedback-card">

  <div class="feedback-row">

   <div class="feedback-title">
  ${icon} ${title}
</div>

<div class="feedback-sub">
  ${e.day || ""}
</div>

    <div class="feedback-arrow">
      
    </div>

  </div>

  <div class="feedback-full">
    ${text}
  </div>

</div>

`;

  }).join("");

}

/* =========================
   BACK BUTTON
========================= */

document.addEventListener("click", e => {

  const card = e.target.closest(".feedback-card");

  // Klikk utenfor kort → lukk alle
  if(!card){
    document.querySelectorAll(".feedback-card")
      .forEach(c => c.classList.remove("open"));
    return;
  }

  const isOpen = card.classList.contains("open");

  document.querySelectorAll(".feedback-card")
    .forEach(c => c.classList.remove("open"));

  if(!isOpen){
    card.classList.add("open");
  }

});

document.addEventListener("DOMContentLoaded", () => {

  const backBtn = document.getElementById("backBtn");

  if(backBtn){

    backBtn.addEventListener("click", () => {

      window.location.href = "minside.html";

    });

  }

});