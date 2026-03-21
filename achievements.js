const container = document.getElementById("achievements");

// hent fra localStorage (samme som appen din)
const starsCount = Number(localStorage.getItem("stars")) || 0;
const streakCount = Number(localStorage.getItem("streak")) || 0;
const totalExercisesCount = Number(localStorage.getItem("totalExercises")) || 0;
const monthlyWheels = Number(localStorage.getItem("monthlyWheels")) || 0;

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

render();

function render(){

  container.innerHTML = "";

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

window.addEventListener("storage", () => {
  render();
});

window.openInfo = function(){
  document.getElementById("infoModal").style.display = "flex";
}

window.closeInfo = function(){
  document.getElementById("infoModal").style.display = "none";
}