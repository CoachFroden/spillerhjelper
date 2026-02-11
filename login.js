import { auth, db } from "./firebase-refleksjon.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


/* ==== DOM ==== */
const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginStatus = document.getElementById("loginStatus");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerPasswordConfirm =
  document.getElementById("registerPasswordConfirm");
const registerBtn = document.getElementById("registerBtn");
const registerStatus = document.getElementById("registerStatus");

const showRegisterBtn = document.getElementById("showRegisterBtn");
const showLoginBtn = document.getElementById("showLoginBtn");

/* ================= UI ================= */

showRegisterBtn.onclick = () => {
  loginBox.hidden = true;
  registerBox.hidden = false;
};

showLoginBtn.onclick = () => {
  registerBox.hidden = true;
  loginBox.hidden = false;
};

/* ================= REGISTRERING ================= */

registerBtn.onclick = async () => {
  const name = registerName.value.trim();

  const rawUsername = registerEmail.value.trim().toLowerCase();
  const username = rawUsername.replace(/[^a-z0-9.-]/g, "");

  const password = registerPassword.value;
  const passwordConfirm = registerPasswordConfirm.value;

  if (!name || !username || !password || !passwordConfirm) {
    registerStatus.textContent = "Alle felt må fylles ut.";
    return;
  }

  if (password !== passwordConfirm) {
    registerStatus.textContent = "Passordene er ikke like.";
    return;
  }

  if (password.length < 8) {
    registerStatus.textContent = "Passordet må være minst 8 tegn.";
    return;
  }

  registerStatus.textContent = "Oppretter bruker…";

  try {
    const internalEmail = `${username}@samnanger.local`;

    const cred = await createUserWithEmailAndPassword(
      auth,
      internalEmail,
      password
    );

    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
      name: name,
      username: username,
      role: "player",
      approved: false,
      createdAt: new Date().toISOString()
    });

    registerStatus.textContent =
      "Registrert. Venter på godkjenning av trener.";

  } catch (err) {
    console.error(err);
    registerStatus.textContent =
      "Kunne ikke opprette bruker. Prøv igjen.";
  }
};


/* ================= LOGIN ================= */

loginBtn.onclick = async () => {
  const rawUsername = loginEmail.value.trim().toLowerCase();
  const username = rawUsername.replace(/[^a-z0-9.-]/g, "");
  const password = loginPassword.value;

  if (!username || !password) {
    loginStatus.textContent = "Brukernavn og passord må fylles ut.";
    return;
  }

  const email = `${username}@samnanger.local`;

  loginStatus.textContent = "Logger inn…";

  try {
    await signInWithEmailAndPassword(auth, email, password);

    const uid = auth.currentUser.uid;
    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {
      loginStatus.textContent = "Brukerprofil mangler.";
      return;
    }

    const data = snap.data();

    if (data.approved !== true) {
      loginStatus.textContent =
        "Kontoen venter på godkjenning av trener.";
      return;
    }

    // ✅ GODKJENT SPILLER
    window.location.href = "minside.html";

  } catch (err) {
    console.error(err);
    loginStatus.textContent =
      "Feil brukernavn eller passord.";
  }
};

async function loadPlayersIntoDropdown() {
  const select = document.getElementById("registerName");
  const picker = document.getElementById("playerPicker");
  const toggle = document.getElementById("playerToggle");
  const label = document.getElementById("playerLabel");
  const list = document.getElementById("playerList");

  // reset
  select.innerHTML = "";
  list.innerHTML = "";
  select.value = "";
  label.textContent = "Velg navnet ditt";
  toggle.setAttribute("aria-expanded", "false");
  picker.classList.remove("open");

  // Placeholder option i native select (for validering)
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Velg navnet ditt";
  ph.disabled = true;
  ph.selected = true;
  select.appendChild(ph);

  const snap = await getDocs(collection(db, "spillere"));

  // Bygg både native select + custom list
snap.forEach(docSnap => {
  const data = docSnap.data();

  // Hopp over spillere som allerede har UID
  if (data.uid) return;

  const name = docSnap.id;

  // native select
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  select.appendChild(opt);

  // custom list item
  const li = document.createElement("li");
  li.textContent = name;
  li.setAttribute("role", "option");
  li.setAttribute("aria-selected", "false");

  li.addEventListener("click", () => {
    select.value = name;
    label.textContent = name;

    [...list.children].forEach(x =>
      x.setAttribute("aria-selected", "false")
    );

    li.setAttribute("aria-selected", "true");

    picker.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  });

  list.appendChild(li);
});


  // Toggle open/close
  toggle.addEventListener("click", () => {
    const isOpen = picker.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Lukk ved klikk utenfor
  document.addEventListener("click", (e) => {
    if (!picker.contains(e.target)) {
      picker.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Lukk med ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      picker.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}


loadPlayersIntoDropdown();


onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    loginStatus.textContent = "Brukerprofil mangler.";
    return;
  }

  const data = snap.data();

  // 🚦 Spiller må være godkjent
  if (data.approved !== true) {
    loginStatus.textContent =
      "Kontoen venter på godkjenning av trener.";
    return;
  }

  // ✅ Godkjent spiller
  window.location.href = "minside.html";
});
