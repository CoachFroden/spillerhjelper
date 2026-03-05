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

const typeSelect = document.getElementById("feedbackType");
const filterWrap = document.getElementById("filterWrap");
const filterLabel = document.getElementById("filterLabel");
const filterSelect = document.getElementById("filterSelect");

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

// Start-UI
list.innerHTML = "Velg type for å lese tilbakemeldinger.";
filterWrap.style.display = "none";

// Hjelpefunksjoner
function resetFilterSelect(placeholderText) {
  filterSelect.innerHTML = "";
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = placeholderText;
  filterSelect.appendChild(opt);
}

function renderEntry(e) {
  const text = e.editedText?.trim() ? e.editedText : e.generatedText;
  return `
    <div class="fb-entry">
      <p>${text}</p>
    </div>
  `;
}

function renderList(filtered) {
  if (!filtered.length) {
    list.innerHTML = "Ingen tilbakemeldinger for dette valget.";
    return;
  }
  list.innerHTML = filtered.map(renderEntry).join("");
}

// Når spiller velger type
typeSelect.addEventListener("change", () => {
  const type = typeSelect.value;

  // reset
  filterWrap.style.display = "none";
  resetFilterSelect("Velg");
  list.innerHTML = "Velg et alternativ for å lese tilbakemeldingen.";

  if (!type) {
    list.innerHTML = "Velg type for å lese tilbakemeldinger.";
    return;
  }

  filterWrap.style.display = "block";

  if (type === "weekly") {
    filterLabel.textContent = "Velg uke";
    resetFilterSelect("Velg uke");

    const weeks = [...new Set(entries
      .filter(e => e.type === "weekly" && e.week != null)
      .map(e => e.week)
    )].sort((a,b) => b-a);

    weeks.forEach(w => {
      const option = document.createElement("option");
      option.value = String(w);
      option.textContent = "Uke " + w;
      filterSelect.appendChild(option);
    });

  } else if (type === "monthly") {
    filterLabel.textContent = "Velg måned";
    resetFilterSelect("Velg måned");

    // unik nøkkel: YYYY-MM
    const keys = [...new Set(entries
      .filter(e => e.type === "monthly" && e.year != null && e.month != null)
      .map(e => `${e.year}-${String(e.month).padStart(2,"0")}`)
    )].sort().reverse();

    keys.forEach(key => {
      const [yy, mm] = key.split("-");
      const mNum = Number(mm);
      const option = document.createElement("option");
      option.value = key;
      option.textContent = `${monthNames[mNum - 1]} ${yy}`;
      filterSelect.appendChild(option);
    });

  } else if (type === "season") {
    filterLabel.textContent = "Velg sesong";
    resetFilterSelect("Velg sesong");

    // unik nøkkel: YYYY-spring / YYYY-fall
    const keys = [...new Set(entries
      .filter(e => e.type === "season" && e.year != null && e.season)
      .map(e => `${e.year}-${e.season}`)
    )].sort().reverse();

    keys.forEach(key => {
      const [yy, season] = key.split("-");
      const option = document.createElement("option");
      option.value = key;
      option.textContent = (season === "spring" ? `Vår ${yy}` : `Høst ${yy}`);
      filterSelect.appendChild(option);
    });
  }
});

// Når spiller velger uke/måned/sesong
filterSelect.addEventListener("change", () => {
  const type = typeSelect.value;
  const val = filterSelect.value;

  if (!type || !val) {
    list.innerHTML = "Velg et alternativ for å lese tilbakemeldingen.";
    return;
  }

  let filtered = [];

  if (type === "weekly") {
    filtered = entries.filter(e => e.type === "weekly" && String(e.week) === val);

  } else if (type === "monthly") {
    const [yy, mm] = val.split("-");
    filtered = entries.filter(e =>
      e.type === "monthly" &&
      String(e.year) === yy &&
      String(e.month).padStart(2,"0") === mm
    );

  } else if (type === "season") {
    const [yy, season] = val.split("-");
    filtered = entries.filter(e =>
      e.type === "season" &&
      String(e.year) === yy &&
      String(e.season) === season
    );
  }

  renderList(filtered);
});

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