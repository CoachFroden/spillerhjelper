import { db,auth } from "./firebase-refleksjon.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const levelXP = [
0, 500, 1000, 1800, 2600, 3400, 4200, 5200,
6400, 7800, 9400, 11200, 13200, 15400,
17800, 20400, 23200, 26200, 29400, 32800
];

function calculateLevel(xp){

  for(let i = levelXP.length - 1; i >= 0; i--){
    if(xp >= levelXP[i]){
      return i + 1;
    }
  }
  return 1;
}

let mode = "month";

const leaderboardDiv = document.getElementById("leaderboard");

async function loadLeaderboard(){

  const statsSnap = await getDocs(collection(db, "gameStats"));
  const playersSnap = await getDocs(collection(db, "spillere"));

  let playersMap = {};

  playersSnap.forEach(doc => {
    const data = doc.data();
    if(data.uid){
      playersMap[data.uid] = data.navn;
    }
  });

  let players = [];

  statsSnap.forEach(doc => {
    const data = doc.data();

players.push({
  uid: data.uid,
  name: playersMap[data.uid] || data.navn || "Ukjent",

  wheels: data.monthlyWheels || 0,
  xp: mode === "month"
    ? (data.monthXP || 0)
    : (data.seasonXP || 0),

  streak: data.streak || 0,
  stars: data.stars || 0
});
  });

  // 🔥 SORTERING
  if(mode === "month"){
    players.sort((a,b) => {
      if(b.wheels !== a.wheels) return b.wheels - a.wheels;
      return b.streak - a.streak; // tiebreaker
    });
  } else {
    players.sort((a,b) => {
  const levelDiff = calculateLevel(b.xp) - calculateLevel(a.xp);
  if(levelDiff !== 0) return levelDiff;
  return b.xp - a.xp;
});
  }

  render(players);
}

function render(players){

  leaderboardDiv.innerHTML = "";

  players.forEach((p, index) => {

    const row = document.createElement("div");
    row.className = "leaderRow";
	if(auth.currentUser && p.uid === auth.currentUser.uid){
  row.classList.add("me");
}

if(index === 0) row.classList.add("gold");
if(index === 1) row.classList.add("silver");
if(index === 2) row.classList.add("bronze");

if(mode === "month"){
  row.innerHTML = `
    <div class="left">
      <span class="rank">${index+1}</span>
      <span class="name">${p.name}</span>
    </div>

    <div class="right">
      <div class="badges">
        <span class="badge star">⭐ ${p.wheels}</span>
        <span class="badge streak">🔥 ${p.streak}</span>
      </div>
    </div>
  `;
} else {
     row.innerHTML = `
  <div class="left">
    <span class="rank">${index+1}</span>
    <span class="name">${p.name}</span>
  </div>

<div class="right">
<div class="badges">
  <span class="badge level">Lv ${calculateLevel(p.xp)}</span>
  <span class="badge star">⭐ ${p.stars}</span>
  <span class="badge streak">🔥 ${p.streak}</span>
</div>
</div>
`;
    }

    leaderboardDiv.appendChild(row);
  });
}

document.getElementById("monthBtn").onclick = () => {
  mode = "month";
  setActive();
  loadLeaderboard();
};

document.getElementById("seasonBtn").onclick = () => {
  mode = "season";
  setActive();
  loadLeaderboard();
};

function setActive(){
  document.getElementById("monthBtn").classList.toggle("active", mode==="month");
  document.getElementById("seasonBtn").classList.toggle("active", mode==="season");
}

loadLeaderboard();

window.openInfo = function(){
  document.getElementById("infoModal").style.display = "flex";
}

window.closeInfo = function(){
  document.getElementById("infoModal").style.display = "none";
}