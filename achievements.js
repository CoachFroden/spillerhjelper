import { auth, db } from "./firebase-refleksjon.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const container = document.getElementById("achievements");

let starsCount = 0;
let streakCount = 0;
let totalExercisesCount = 0;
let monthlyWheels = 0;

function render(){

  container.innerHTML = "";

  const achievements = [

    {
      name: "Første stjerne",
      icon: "⭐",
      current: starsCount,
      target: 1
    },

    {
      name: "5 dager aktiv",
      icon: "⭐",
      current: monthlyWheels,
      target: 5
    },
    {
      name: "10 dager aktiv",
      icon: "⭐",
      current: monthlyWheels,
      target: 10
    },
    {
      name: "20 dager aktiv",
      icon: "⭐",
      current: monthlyWheels,
      target: 20
    },
    {
      name: "30 dager aktiv",
      icon: "⭐",
      current: monthlyWheels,
      target: 30
    },

    {
      name: "3 dager på rad",
      icon: "🔥",
      current: streakCount,
      target: 3
    },
    {
      name: "7 dager på rad",
      icon: "🔥",
      current: streakCount,
      target: 7
    },
    {
      name: "14 dager på rad",
      icon: "🔥",
      current: streakCount,
      target: 14
    },
    {
      name: "30 dager på rad",
      icon: "🔥",
      current: streakCount,
      target: 30
    },

    {
      name: "10 øvelser",
      icon: "⚽",
      current: totalExercisesCount,
      target: 10
    },
    {
      name: "50 øvelser",
      icon: "⚽",
      current: totalExercisesCount,
      target: 50
    },
    {
      name: "100 øvelser",
      icon: "⚽",
      current: totalExercisesCount,
      target: 100
    },
    {
      name: "250 øvelser",
      icon: "⚽",
      current: totalExercisesCount,
      target: 250
    },
    {
      name: "500 øvelser",
      icon: "⚽",
      current: totalExercisesCount,
      target: 500
    }

  ];

  achievements.forEach(a => {

    const progress = Math.min(a.current / a.target, 1);
    const percent = Math.floor(progress * 100);
    const unlocked = progress >= 1;

    const div = document.createElement("div");
    div.className = "achievement";

    div.innerHTML = `
      <div class="icon">${a.icon}</div>
      <div class="content">
        <div class="title">${a.name}</div>
        <div class="bar">
          <div class="fill" style="width:${percent}%"></div>
        </div>
        <div class="progress">${a.current} / ${a.target}</div>
      </div>
    `;

    if(!unlocked){
      div.classList.add("locked");
    }

    container.appendChild(div);
  });
}

onAuthStateChanged(auth, async (user) => {
  if(!user) return;

  const snap = await getDoc(doc(db, "gameStats", user.uid));

  if(snap.exists()){
    const data = snap.data();

    starsCount = data.stars || 0;
    streakCount = data.streak || 0;
    totalExercisesCount = data.totalExercises || 0;
    monthlyWheels = data.monthlyWheels || 0;
  }

  render();
});

window.openInfo = function(){
  document.getElementById("infoModal").style.display = "flex";
}

window.closeInfo = function(){
  document.getElementById("infoModal").style.display = "none";
}