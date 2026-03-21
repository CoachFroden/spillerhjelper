import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { auth, db } from "./firebase-refleksjon.js";
import { getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { updateDoc, increment } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { query, where } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

async function getPlayerName(user){

  const q = query(
    collection(db, "spillere"),
    where("uid", "==", user.uid)
  );

  const snap = await getDocs(q);

  if(!snap.empty){
    return snap.docs[0].data().navn;
  }

  return "Spiller";
}

function getTodayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function parseDateKey(key){
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m, d);
}

const today = getTodayKey();

if(!localStorage.getItem("lastPlayDate")){
  localStorage.setItem("lastPlayDate", today);
}

let categoryCounts = JSON.parse(localStorage.getItem("categoryCounts")) || {};
let recentCategories = JSON.parse(localStorage.getItem("recentCategories")) || [];
let xpModeTimeout = null;
let dailyXP = Number(localStorage.getItem("dailyXP")) || 0
let monthXP = Number(localStorage.getItem("monthXP")) || 0
let stars = Number(localStorage.getItem("stars")) || 0
let lastStars = stars;
let monthlyWheels = Number(localStorage.getItem("monthlyWheels")) || 0
let currentMonth = Number(localStorage.getItem("currentMonth")) || -1
let teamWheels = 0;
let totalExercises = Number(localStorage.getItem("totalExercises")) || 0
let totalXP = Number(localStorage.getItem("totalXP")) || 0
let seasonXP = Number(localStorage.getItem("seasonXP")) || 0
let exerciseHistory = JSON.parse(localStorage.getItem("exerciseHistory")) || [];
let lockIndex = JSON.parse(localStorage.getItem("lockIndex")) || {};
let starAnimationPlayed = localStorage.getItem("starAnimationPlayed") === "true";
let xpMode = localStorage.getItem("xpMode") || "month"; // "month" | "season"
let streak = Number(localStorage.getItem("streak")) || 0
let longestStreak = Number(localStorage.getItem("longestStreak")) || 0
let lastWheelDate = localStorage.getItem("lastWheelDate") || ""
let lastPlayDate = localStorage.getItem("lastPlayDate") || ""
let lastLockState = {};

function isCategoryLocked(category){

  const count = categoryCounts[category] || 0;

  if(count < 4) return false;

  const index = lockIndex[category];

  if(index === undefined) return true; // 🔥 fallback = lås

  const afterLock = recentCategories.slice(index + 1);

  const uniqueOthers = [...new Set(
    afterLock.filter(c => c !== category)
  )];

  return uniqueOthers.length < 2;
}

if(lastPlayDate && lastPlayDate !== today){

  categoryCounts = {};
  recentCategories = [];
  lockIndex = {}; // 👈 LEGG DENNE HER
  
  exerciseHistory = []; // 👈 LEGG TIL
  localStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));

  dailyXP = 0

  localStorage.setItem("dailyXP", dailyXP)
  localStorage.setItem("lastPlayDate", today)

  localStorage.setItem("categoryCounts", JSON.stringify(categoryCounts))
  localStorage.setItem("recentCategories", JSON.stringify(recentCategories))
  localStorage.setItem("lockIndex", JSON.stringify(lockIndex))
  
  starAnimationPlayed = false;
localStorage.setItem("starAnimationPlayed", "false");

  document.querySelectorAll(".exerciseBtn").forEach(btn => {
    btn.classList.remove("done");
  });
}

const goal = 100
const teamGoal = 250

const dailyXPText = document.getElementById("dailyXP")
const starsText = document.getElementById("starsText")
const monthlyWheelsText = document.getElementById("monthlyWheelsText")
const streakText = document.getElementById("streakText")
const longestStreakText = document.getElementById("longestStreakText")

const monthXPDisplay = document.getElementById("monthXPText")
const levelText = document.getElementById("levelText")
const wheel = document.querySelector(".wheel")

const testBtn = document.getElementById("testBtn")
const xpCurrentText = document.getElementById("xpCurrent")

const teamWheelsText = document.getElementById("teamWheels")
const teamBarFill = document.getElementById("teamBarFill")

const totalXPText = document.getElementById("monthXP")
const xpBox = totalXPText?.parentElement;
if(xpBox){

xpBox.addEventListener("click", () => {

  // 🔥 animasjon
  xpBox.classList.remove("xpSwitch");
  void xpBox.offsetWidth;
  xpBox.classList.add("xpSwitch");

  // 🔁 toggle
  if(xpMode === "month"){
    xpMode = "season";
  }else{
    xpMode = "month";
  }

  updateUI();

  // 🧠 clear tidligere timer
  if(xpModeTimeout){
    clearTimeout(xpModeTimeout);
  }

  // ⏱️ auto tilbake til måned
  if(xpMode === "season"){
    xpModeTimeout = setTimeout(() => {

      xpMode = "month";

      // liten animasjon tilbake også
      xpBox.classList.remove("xpSwitch");
      void xpBox.offsetWidth;
      xpBox.classList.add("xpSwitch");

      updateUI();

    }, 3000); // ← juster (3000 = 3 sek)

  }

});

}

const segmentGroup = document.getElementById("segments")

if(segmentGroup){

const totalSegments = 20
const startAngle = 225
const endAngle = 495
const arc = (endAngle - startAngle) / totalSegments

const radiusOuter = 100
const radiusInner = 80
const center = 110



function polarToCartesian(cx, cy, r, angle){
  const rad = (angle - 90) * Math.PI / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  }
}

for(let i=0;i<totalSegments;i++){

  const a1 = startAngle + arc * i
  const a2 = a1 + arc - 2

  const p1 = polarToCartesian(center,center,radiusOuter,a1)
  const p2 = polarToCartesian(center,center,radiusOuter,a2)
  const p3 = polarToCartesian(center,center,radiusInner,a2)
  const p4 = polarToCartesian(center,center,radiusInner,a1)

  const path = `
  M ${p1.x} ${p1.y}
  A ${radiusOuter} ${radiusOuter} 0 0 1 ${p2.x} ${p2.y}
  L ${p3.x} ${p3.y}
  A ${radiusInner} ${radiusInner} 0 0 0 ${p4.x} ${p4.y}
  Z
  `

  const seg = document.createElementNS("http://www.w3.org/2000/svg","path")

  seg.setAttribute("d",path)
  seg.classList.add("segment")
  seg.style.fill = `hsl(${60 - i*3},100%,50%)`

  segmentGroup.appendChild(seg)

}
} 

const segments = document.querySelectorAll(".segment")

const levelXP = [
0,
500,
1000,
1800,
2600,
3400,
4200,
5200,
6400,
7800,
9400,
11200,
13200,
15400,
17800,
20400,
23200,
26200,
29400,
32800
]


function calculateLevel(xp){

for(let i = levelXP.length - 1; i >= 0; i--){

if(xp >= levelXP[i]){
return i + 1
}

}

return 1

}

function showXPPopup(amount){

  const el = document.getElementById("xpPopup");

  const messages = [
  `+${amount} XP`,
  `Bra! +${amount}`,
  `Nice! +${amount}`,
  `💪 +${amount}`,
  `🔥 +${amount}`
];

const random = messages[Math.floor(Math.random() * messages.length)];

el.textContent = random;

  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 400);

}

let lastLevel = calculateLevel(seasonXP)

async function addXP(xp){

dailyXP += xp
monthXP += xp
seasonXP += xp
totalXP += xp

  localStorage.setItem("totalXP", totalXP)
  localStorage.setItem("seasonXP", seasonXP)
  localStorage.setItem("lastPlayDate", today)

  const user = auth.currentUser;
  if(user){
await setDoc(doc(db, "gameStats", user.uid), {
  monthXP: monthXP,
  totalXP: totalXP,
  seasonXP: seasonXP   // 🔥 DETTE ER FIXEN
}, { merge: true });
  }

  updateUI()
}

const month = new Date().getMonth()

async function loadGameStats(){
	
  const teamRef = doc(db, "teamStats", "global");
  const teamSnap = await getDoc(teamRef);
  const serverMonth = teamSnap.data()?.month ?? -1;
  const serverSeason = teamSnap.data()?.season ?? -1;
  const currentSeason = new Date().getFullYear(); // enkel løsning = kalenderår

  const month = new Date().getMonth()

if(serverMonth !== month){

  lastWheelDate = "";
  localStorage.setItem("lastWheelDate", "");

  monthlyWheels = 0
  currentMonth = month

  dailyXP = 0;
  localStorage.setItem("dailyXP", 0);
  
  monthXP = 0;
  localStorage.setItem("monthXP", 0);

  starAnimationPlayed = false;
  localStorage.setItem("starAnimationPlayed", "false");

  localStorage.setItem("monthlyWheels", monthlyWheels)
  localStorage.setItem("currentMonth", month)

    try{
     await setDoc(doc(db, "teamStats", "global"), {
  teamWheels: 0,
  month: month,
  season: currentSeason   // 🔥 VIKTIG
}, { merge: true });
	  
	    const statsSnap = await getDocs(collection(db, "gameStats"));

  const updates = [];

  statsSnap.forEach(docSnap => {
    updates.push(
setDoc(doc(db, "gameStats", docSnap.id), {
  monthlyWheels: 0,
  monthXP: 0 
}, { merge: true })
    );
  });

  await Promise.all(updates);

}catch(e){
  console.error("Feil ved reset av teamWheels", e);
}

  }
  
  if(serverSeason !== currentSeason){

  seasonXP = 0;
  stars = 0;
  streak = 0;
  longestStreak = 0;

  localStorage.setItem("seasonXP", 0);
  localStorage.setItem("stars", 0);
  localStorage.setItem("streak", 0);
  localStorage.setItem("longestStreak", 0);

  try{
    await setDoc(doc(db, "teamStats", "global"), {
      season: currentSeason
    }, { merge: true });

    const statsSnap = await getDocs(collection(db, "gameStats"));

    const updates = [];

    statsSnap.forEach(docSnap => {
      updates.push(
        setDoc(doc(db, "gameStats", docSnap.id), {
          seasonXP: 0,
          stars: 0,
          streak: 0,
          longestStreak: 0
        }, { merge: true })
      );
    });

    await Promise.all(updates);

  }catch(e){
    console.error("Feil ved reset av season", e);
  }
}

const freshTeamSnap = await getDoc(teamRef);

if(!freshTeamSnap.exists()){
  teamWheels = 0;
} else {
  teamWheels = freshTeamSnap.data().teamWheels || 0;
}

  const user = auth.currentUser;
  if(!user) return;
  
const nameEl = document.getElementById("playerName");

if(nameEl){

  const playerName = await getPlayerName(user);

  nameEl.textContent = playerName;
}

const docRef = doc(db, "gameStats", user.uid);
const snap = await getDoc(docRef);

if(snap.exists()){
  const data = snap.data();

  stars = data.stars || 0;
  monthlyWheels = data.monthlyWheels || 0;
  streak = data.streak || 0;
  longestStreak = data.longestStreak || 0;
  totalExercises = data.totalExercises || 0;

  monthXP = data.monthXP || 0;
  seasonXP = data.seasonXP || 0;

} else {

  stars = 0;
  monthlyWheels = 0;
  streak = 0;
  longestStreak = 0;
  totalExercises = 0;
  monthXP = 0;
  seasonXP = 0;

  // 🔥 RESET lokal spilldata (dette manglet hos deg)
  categoryCounts = {};
  recentCategories = [];
  exerciseHistory = [];
  lockIndex = {};
  dailyXP = 0;

  localStorage.setItem("categoryCounts", JSON.stringify(categoryCounts));
  localStorage.setItem("recentCategories", JSON.stringify(recentCategories));
  localStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));
  localStorage.setItem("lockIndex", JSON.stringify(lockIndex));
  localStorage.setItem("dailyXP", 0);

  // 🔥 fjern "done" visuelt
  document.querySelectorAll(".exerciseBtn").forEach(btn => {
    btn.classList.remove("done");
  });
  
  // 🔥 reset wheel visuelt
segments.forEach(seg => {
  seg.classList.remove("filled");
});

}

// 🔥 SYNC BACK TO FIRESTORE (fikser Ask)
await setDoc(doc(db, "gameStats", user.uid), {
  stars: stars || 0,
  monthlyWheels: monthlyWheels || 0,
  streak: streak || 0,
  longestStreak: longestStreak || 0,
  totalExercises: totalExercises || 0,
  monthXP: monthXP || 0,
  seasonXP: seasonXP || 0,
  totalXP: totalXP || 0
}, { merge: true });

lastLevel = calculateLevel(seasonXP);
  updateUI();
  
  localStorage.setItem("monthXP", monthXP);
localStorage.setItem("seasonXP", seasonXP);
localStorage.setItem("stars", stars);
localStorage.setItem("monthlyWheels", monthlyWheels);
localStorage.setItem("streak", streak);
localStorage.setItem("longestStreak", longestStreak);
localStorage.setItem("totalExercises", totalExercises);

  if(teamWheelsText){
    teamWheelsText.textContent = teamWheels;
  }

  if(teamBarFill){
    teamBarFill.style.width = "0%";
  }

  updateCategoryUI();
}

async function updateUI(){

  const cappedXP = Math.min(dailyXP, goal)
  const progress = cappedXP / goal

if(dailyXPText) dailyXPText.textContent = cappedXP
if(monthXPDisplay) monthXPDisplay.textContent = monthXP
if(totalXPText){
  if(xpMode === "month"){
    totalXPText.textContent = monthXP;
  }else{
    totalXPText.textContent = seasonXP;
  }
}if(starsText) starsText.textContent = stars

if(stars !== lastStars){
  starsText.classList.add("pop");

  setTimeout(() => {
    starsText.classList.remove("pop");
  }, 400);

  lastStars = stars;
}

if(monthlyWheelsText) monthlyWheelsText.textContent = monthlyWheels
if(streakText) streakText.textContent = streak
if(longestStreakText) longestStreakText.textContent = longestStreak

  const currentLevel = calculateLevel(seasonXP)

if(levelText) levelText.textContent = currentLevel

const levelBadge = document.getElementById("levelBadgeText");

if(levelBadge){
  const lvlNumber = document.getElementById("levelBadgeText");
if(lvlNumber){
  lvlNumber.textContent = currentLevel;
}
}

if(currentLevel > lastLevel){

showLevelUp(currentLevel)

lastLevel = currentLevel

}
  
const nextXP = nextLevelXP(seasonXP)

const remainingXP = nextXP - seasonXP

if(xpCurrentText) xpCurrentText.textContent = remainingXP
 
  const filled = Math.min(Math.floor(dailyXP / 5), 20)

segments.forEach((seg, i) => {

if(i < filled){
seg.classList.add("filled")
}else{
seg.classList.remove("filled")
}

})

const alreadyCompletedToday = lastWheelDate === today;
if(dailyXP >= goal && !alreadyCompletedToday && !starAnimationPlayed){
	
  starAnimationPlayed = true;
  localStorage.setItem("starAnimationPlayed", "true");

  launchFireworks()
  playStarCelebration()

if(lastWheelDate === today){

dailyXP = goal
localStorage.setItem("dailyXP", dailyXP)

starAnimationPlayed = true;
localStorage.setItem("starAnimationPlayed", "true");

return
}

document.getElementById("completeMessage").textContent =
"Sirkelen fullført ⭐ Du fikk en stjerne!"

stars++
starsText.textContent = stars

monthlyWheels++
monthlyWheelsText.textContent = monthlyWheels

const user = auth.currentUser;
let navn = "";

if(user){

const fetchedName = await getPlayerName(user);

if(fetchedName){
  navn = fetchedName;
}

}

try {
  await updateDoc(doc(db, "teamStats", "global"), {
    teamWheels: increment(1)
  });
} catch (e) {
  await setDoc(doc(db, "teamStats", "global"), {
    teamWheels: 1
  });
}

// 🔥 hent riktig verdi på nytt
const updatedSnap = await getDoc(doc(db, "teamStats", "global"));
teamWheels = updatedSnap.data().teamWheels || 0;

teamWheelsText.textContent = teamWheels

const teamProgress = Math.min(teamWheels / teamGoal, 1)
if(teamBarFill){
  teamBarFill.style.width = (teamProgress * 100) + "%"
}

if(teamWheels >= teamGoal){

showBonus("⚽ Lagmål nådd! 250 ⭐!")

}


if(!lastWheelDate){

  streak = 1;

}else{

const lastDate = parseDateKey(lastWheelDate);
const todayDateObj = parseDateKey(today);

const diff = Math.floor((todayDateObj - lastDate) / (1000*60*60*24));

  if(diff === 1){
    streak++;
  }else{
    streak = 1;
  }

}

if(streak > longestStreak){
  longestStreak = streak;
}
longestStreakText.textContent = longestStreak;
streakText.textContent = streak

lastWheelDate = today

// ✅ NÅ lagrer du riktig verdi
await setDoc(doc(db, "gameStats", user.uid), {
  uid: user.uid,
  navn: navn,

  monthlyWheels: monthlyWheels,

  // 🔥 BESKYTTELSE MOT RESET
  stars: stars || 0,
  streak: streak || 0,
  longestStreak: longestStreak || 0,

  totalExercises: totalExercises,

  monthXP: monthXP,
  totalXP: totalXP,
  seasonXP: seasonXP

}, { merge: true });

}

  localStorage.setItem("dailyXP", dailyXP)
  localStorage.setItem("monthXP", monthXP)
  localStorage.setItem("stars", stars)
  localStorage.setItem("monthlyWheels", monthlyWheels)
  localStorage.setItem("teamWheels", teamWheels)
  
  localStorage.setItem("streak", streak)
  localStorage.setItem("longestStreak", longestStreak)
  localStorage.setItem("lastWheelDate", lastWheelDate)
  
if(teamWheelsText){

teamWheelsText.textContent = teamWheels
}
if(teamBarFill){
  const percent = Math.min(teamWheels / teamGoal, 1);
  teamBarFill.style.width = (percent * 100) + "%";
}

}

function launchBonusParticles(){

const canvas = document.getElementById("confettiCanvas")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const wheel = document.querySelector(".wheel")
const rect = wheel.getBoundingClientRect()

const originX = rect.left + rect.width/2
const originY = rect.top + rect.height/2

let pieces = []

for(let i=0;i<120;i++){

const angle = Math.random()*Math.PI*2
const speed = Math.random()*2 + 1.5   // mye roligere startfart

pieces.push({

x:originX,
y:originY,

vx:Math.cos(angle)*speed,
vy:Math.sin(angle)*speed - 0.8,

gravity:0.02,                          // svak tyngdekraft

size:Math.random()*4 + 2,
life:260                                // varer lenger

})

}

function update(){

ctx.clearRect(0,0,canvas.width,canvas.height)

pieces.forEach(p=>{

p.vy += p.gravity

p.x += p.vx
p.y += p.vy

p.life--

ctx.beginPath()
ctx.arc(p.x,p.y,p.size,0,Math.PI*2)

ctx.fillStyle = "rgba(120,230,255,0.9)"
ctx.fill()

})

pieces = pieces.filter(p => p.life > 0 && p.y < canvas.height + 20)

if(pieces.length > 0){
requestAnimationFrame(update)
}else{
ctx.clearRect(0,0,canvas.width,canvas.height)
}

}

update()

}

function playStarCelebration(){

}

function showBonus(text){

const box = document.getElementById("bonusBox")

box.textContent = text
box.style.display = "block"

}

function nextLevelXP(xp){

for(let i = 0; i < levelXP.length; i++){

if(xp < levelXP[i]){
return levelXP[i]
}

}

return levelXP[levelXP.length - 1]

}

function showLevelUp(level){

  const box = document.getElementById("levelUpAnimation")
  const num = box.querySelector(".levelNumber")

  num.textContent = level

  box.classList.remove("show")
  void box.offsetWidth
  box.classList.add("show")

  // 🔥 NY: animasjon på badge
  const badge = document.querySelector(".levelBadge");

  if(badge){
    badge.classList.remove("levelUp");
    void badge.offsetWidth;
    badge.classList.add("levelUp");
  }

}

function showBonusAnimation(text){

const box = document.getElementById("bonusAnimation")
const num = box.querySelector(".bonusNumber")

num.textContent = text

box.classList.remove("show")
void box.offsetWidth
box.classList.add("show")

launchBonusParticles()

}

function launchPyro(){

const pyro = document.getElementById("bonusPyro")
const wheel = document.querySelector(".wheel")

const rect = wheel.getBoundingClientRect()

const x = rect.left + rect.width/2
const y = rect.top + rect.height/2

const before = pyro.querySelector(".before")
const after = pyro.querySelector(".after")

before.style.left = x + "px"
before.style.top = y + "px"

after.style.left = x + "px"
after.style.top = y + "px"

pyro.classList.remove("active")

setTimeout(() => {
  pyro.classList.add("active")
}, 10)


}

function launchPyroBurst(){

for(let i = 0; i < 4; i++){

setTimeout(() => {
  launchPyro()   // ✅ riktig
}, i * 180)

}

}

function launchFireworks(){

const canvas = document.getElementById("fireworksCanvas")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

let particles = []

function createExplosion(x,y){

for(let i = 0; i < 180; i++){

const angle = Math.random()*Math.PI*2
const speed = Math.random()*4 + 1.5

particles.push({
x: x,
y: y,

prevX: x,
prevY: y,

vx: Math.cos(angle)*speed,
vy: Math.sin(angle)*speed,

gravity: 0.015,

life: 380,
maxLife: 380,

color: `hsla(${Math.random()*360},100%,55%,1)`,

size: Math.random()*1.5 + 0.9
})

}

}

let started = false

for(let i=0;i<12;i++){

setTimeout(()=>{

const x = Math.random()*canvas.width
const y = Math.random()*canvas.height*0.8

createExplosion(x,y)

if(!started){
  started = true
  animate()
}

}, i*700)

}

function animate(){

ctx.globalCompositeOperation = "lighter"
ctx.clearRect(0,0,canvas.width,canvas.height)

particles.forEach(p=>{

// lagre forrige posisjon (trail)
p.prevX = p.x
p.prevY = p.y

// fade
const t = p.life / p.maxLife
ctx.globalAlpha = t * t

// fysikk
p.vx *= 0.99
p.vy *= 0.98

p.vy += p.gravity
p.x += p.vx
p.y += p.vy

p.life--

// 🔥 TRAIL
ctx.beginPath()
ctx.moveTo(p.prevX, p.prevY)
ctx.lineTo(p.x, p.y)
ctx.strokeStyle = p.color
ctx.lineWidth = p.size
ctx.lineCap = "round"
ctx.stroke()

// 🔥 glow
ctx.beginPath()
ctx.arc(p.x, p.y, p.size*2.5, 0, Math.PI*2)
ctx.fillStyle = "hsla(0,0%,100%,0.1)"
ctx.fill()

// 🔥 main particle
ctx.beginPath()
ctx.arc(p.x, p.y, p.size, 0, Math.PI*2)
ctx.fillStyle = p.color
ctx.fill()

ctx.globalAlpha = 1

})

particles = particles.filter(p => p.life > 0)

if(particles.length > 0){
requestAnimationFrame(animate)
}else{
ctx.clearRect(0,0,canvas.width,canvas.height)
}

}

}

function openInfo(){
  document.getElementById("infoModal").style.display = "flex";
}

function closeInfo(){
  document.getElementById("infoModal").style.display = "none";
}

function showWarning(text){

  const popup = document.getElementById("warningPopup");

  popup.textContent = text;
  popup.classList.add("show");

  clearTimeout(popup._timeout);

  popup._timeout = setTimeout(() => {
    popup.classList.remove("show");
  }, 1800);

}

/* ================= ØVELSER ================= */

const modal = document.getElementById("exerciseModal")
const startBtn = document.getElementById("startBtn")
if(startBtn && modal){

startBtn.addEventListener("click", () => {

  // 🔽 LUKK ALLE KATEGORIER
  document.querySelectorAll(".exerciseList")
    .forEach(list => list.classList.remove("open"));

  document.querySelectorAll(".categoryHeader")
    .forEach(header => header.classList.remove("active"));

  // åpne modal
  modal.style.display = "flex";
});

}
const closeModal = document.getElementById("closeModal")

if(closeModal && modal){

closeModal.addEventListener("click", () => {

modal.style.display = "none"

})

}

let selectedExercise = null;

document.querySelectorAll(".exerciseBtn").forEach(btn => {

  btn.addEventListener("click", async () => {

    const header = btn.closest(".exerciseList").previousElementSibling;
    const category = header.dataset.category;

    const key = category + "|" + btn.textContent.trim();

    // 🔴 blokk hvis allerede gjort
    if(exerciseHistory.includes(key)){
      showWarning("Du har allerede gjort denne øvelsen");
      return;
    }

    const xp = Number(btn.dataset.xp);
    const name = btn.textContent.trim();

    if(!categoryCounts[category]){
      categoryCounts[category] = 0;
    }

    // 🔒 lås etter 4
    if(isCategoryLocked(category)){
      const index = lockIndex[category];
      const afterLock = recentCategories.slice(index + 1);

      const uniqueOthers = [...new Set(
        afterLock.filter(c => c !== category)
      )];

      const remaining = 2 - uniqueOthers.length;

      showWarning(
        `🔒 ${category.toUpperCase()} er låst\n\n` +
        `Du må gjøre ${remaining} andre kategori${remaining === 1 ? '' : 'er'} til.`
      );
      return;
    }

    // 🔹 1. klikk → velg
    if(selectedExercise !== btn){
      document.querySelectorAll(".exerciseBtn")
        .forEach(b => b.classList.remove("selected"));

      btn.classList.add("selected");
      selectedExercise = btn;
      return;
    }
	
	const logsSnap = await getDocs(
  query(
    collection(db, "exerciseLogs"),
    where("uid", "==", currentUser.uid)
  )
);

// hent siste 10 øvelser
const logs = logsSnap.docs
  .map(doc => doc.data())
  .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

let countSinceLast = 0;
let found = false;

for(const log of logs){
  if(log.exercise === name){
    found = true;
    break;
  }
  countSinceLast++;
}

if(found && countSinceLast < 5){
  showWarning("Du må gjøre flere andre øvelser før du kan velge denne igjen");
  return;
}

    // 🔹 2. klikk → fullfør
addXP(xp);
showXPPopup(xp);

const currentUser = auth.currentUser;

if(currentUser){
const playerName = await getPlayerName(currentUser);

await setDoc(doc(collection(db, "exerciseLogs")), {
  uid: currentUser.uid,
  name: playerName,
  category: category,
  exercise: name,
  timestamp: serverTimestamp()
});
}

categoryCounts[category] = (categoryCounts[category] || 0) + 1;
recentCategories.push(category);

// 🔥 NY
if(categoryCounts[category] === 4){
  lockIndex[category] = recentCategories.length - 1;
}

// history
if(!exerciseHistory.includes(key)){
  exerciseHistory.push(key);
}

if(exerciseHistory.length > 20){
  exerciseHistory.shift();
}

localStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));

// 🔴 så UI
updateCategoryUI();

    setTimeout(() => {
      modal.style.display = "none";
    }, 50);

    if(recentCategories.length > 20){
      recentCategories.shift();

      Object.keys(lockIndex).forEach(cat => {
        lockIndex[cat]--;

        if(lockIndex[cat] < 0){
          delete lockIndex[cat];
        }
      });
    }

    localStorage.setItem("categoryCounts", JSON.stringify(categoryCounts));
    localStorage.setItem("recentCategories", JSON.stringify(recentCategories));

    totalExercises++;
    localStorage.setItem("totalExercises", totalExercises);
	
const user = auth.currentUser;

if(user){
  const playerName = await getPlayerName(user);

  await setDoc(doc(db, "gameStats", user.uid), {
    uid: user.uid,
    navn: playerName,
    totalExercises: totalExercises,
    lastExercise: key
  }, { merge: true });
}

	
	// 🔥 BONUS hver 5. øvelse
if(totalExercises % 5 === 0){

  addXP(20); // bonus xp

  showBonusAnimation("+20 XP"); // animasjon

}

    btn.classList.remove("selected");
    selectedExercise = null;

  });

});

function updateCategoryUI(){

  document.querySelectorAll(".categoryHeader").forEach(header => {

    const category = header.dataset.category;

    let locked = isCategoryLocked(category);
    const wasLocked = lastLockState[category] ?? false;

    // 🔓 UNLOCK → reset alt
if(wasLocked === true && !locked){

  categoryCounts[category] = 0;
  delete lockIndex[category];

  document.querySelectorAll(".exerciseBtn").forEach(btn => {
    const list = btn.closest(".exerciseList");
    const btnHeader = list.previousElementSibling;

    if(btnHeader.dataset.category === category){
      btn.classList.remove("done");

      const key = category + "|" + btn.textContent.trim();
      exerciseHistory = exerciseHistory.filter(item => item !== key);
    }
  });

  localStorage.setItem("categoryCounts", JSON.stringify(categoryCounts));
  localStorage.setItem("lockIndex", JSON.stringify(lockIndex));
  localStorage.setItem("recentCategories", JSON.stringify(recentCategories));
  localStorage.setItem("exerciseHistory", JSON.stringify(exerciseHistory));

  locked = false;
}

    // 🔢 LAG PRIKKER
    const count = categoryCounts[category] || 0;

    let dots = "";
    for(let i = 0; i < 4; i++){
      dots += i < count ? "●" : "○";
    }

    lastLockState[category] = locked;

    // 🎨 RENDER UI
    header.innerHTML = `
      ${category.charAt(0).toUpperCase() + category.slice(1)}
      <span class="dots">${dots}</span>
      ${locked ? '<span class="lock">🔒</span>' : ''}
    `;

    if(locked){
      header.classList.add("locked");
    } else {
      header.classList.remove("locked");
    }

// 🔥 sync øvelser med count (DETTE MANGLER)
document.querySelectorAll(".exerciseList").forEach(list => {

  const header = list.previousElementSibling;
  const category = header.dataset.category;

  const count = categoryCounts[category] || 0;

  const buttons = list.querySelectorAll(".exerciseBtn");

buttons.forEach((btn) => {

const key = category + "|" + btn.textContent.trim();

if(exerciseHistory.includes(key)){
  btn.classList.add("done");
} else {
  btn.classList.remove("done");
}

});

});
  });
localStorage.setItem("categoryCounts", JSON.stringify(categoryCounts));
localStorage.setItem("recentCategories", JSON.stringify(recentCategories));
localStorage.setItem("lockIndex", JSON.stringify(lockIndex));
}



document.querySelectorAll(".categoryHeader").forEach(header => {

  header.addEventListener("click", () => {

    const list = header.nextElementSibling;
    const isOpen = list.classList.contains("open");

    // fjern active
    document.querySelectorAll(".categoryHeader")
      .forEach(h => h.classList.remove("active"));

    // lukk alle
    document.querySelectorAll(".exerciseList")
      .forEach(l => l.classList.remove("open"));

    if(!isOpen){
      list.classList.add("open");
      header.classList.add("active");
    }

  });

});

updateCategoryUI();
document.querySelectorAll(".categoryHeader").forEach(header => {
  const category = header.dataset.category;
  lastLockState[category] = isCategoryLocked(category);
});

setTimeout(() => {
  updateCategoryUI();
}, 0);

window.openInfo = function(){
  document.getElementById("infoModal").style.display = "flex";
}

window.closeInfo = function(){
  document.getElementById("infoModal").style.display = "none";
}

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if(user){
    loadGameStats();
  }
});

window.auth = auth;
window.db = db;