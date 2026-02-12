const artistas = [
  { nombre: "Bad Bunny", generacion: "Nueva", imagen: "images/badbunny.jpg" },
  { nombre: "Taylor Swift", generacion: "Nueva", imagen: "images/taylorswift.jpg" },
  { nombre: "Billie Eilish", generacion: "Nueva", imagen: "images/billie.jpg" },
  { nombre: "Michael Jackson", generacion: "Pasada", imagen: "images/mj.jpg" },
  { nombre: "Madonna", generacion: "Pasada", imagen: "images/madonna.jpg" },
  { nombre: "The Beatles", generacion: "Pasada", imagen: "images/beatles.jpg" }
];

const segmentos = {
  "GZ": "Generación Z",
  "ML": "Millennials",
  "GX": "Generación X",
  "BB": "Baby Boomers"
};

const contextos = {
  "P": "¿Quién tuvo mayor impacto político/social?",
  "C": "¿Quién tuvo mayor impacto cultural?",
  "D": "¿Quién domina el entorno digital?",
  "H": "¿Quién tiene mayor impacto histórico?"
};

const RATING_INICIAL = 1000;
const K = 32;
const STORAGE_KEY = "impactogeneracional_v2";

function defaultState(){
  const buckets = {};
  for (const seg in segmentos){
    for (const ctx in contextos){
      const key = `${seg}__${ctx}`;
      buckets[key] = {};
      artistas.forEach(a => buckets[key][a.nombre] = RATING_INICIAL);
    }
  }
  return { buckets, votes: [] };
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : defaultState();
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function expectedScore(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, a, b, winner){
  const ra = bucket[a], rb = bucket[b];
  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  bucket[a] = ra + K * ((winner === "A" ? 1 : 0) - ea);
  bucket[b] = rb + K * ((winner === "B" ? 1 : 0) - eb);
}

function randomPair(){
  const a = artistas[Math.floor(Math.random() * artistas.length)];
  let b = a;
  while (b === a){
    b = artistas[Math.floor(Math.random() * artistas.length)];
  }
  return [a, b];
}

function renderArtist(button, artista){
  button.innerHTML = `
    <img src="${artista.imagen}" onerror="this.src='images/default.jpg'">
    <h3>${artista.nombre}</h3>
  `;
}

function newDuel(){
  [currentA, currentB] = randomPair();
  renderArtist(btnA, currentA);
  renderArtist(btnB, currentB);
  question.textContent = contextos[contextSelect.value];
}

function bucketKey(seg, ctx){
  return `${seg}__${ctx}`;
}

function topN(bucket){
  return Object.entries(bucket)
    .map(([nombre, rating]) => ({nombre, rating}))
    .sort((a,b)=>b.rating-a.rating)
    .slice(0,10);
}

function renderTop(){
  const bucket = state.buckets[bucketKey(segmentSelect.value, contextSelect.value)];
  const top = topN(bucket);
  topBox.innerHTML = top.map((r,i)=>`
    <div class="toprow">
      <div><b>${i+1}.</b> ${r.nombre}</div>
      <div>${r.rating.toFixed(0)}</div>
    </div>
  `).join("");
}

function vote(winner){
  const bucket = state.buckets[bucketKey(segmentSelect.value, contextSelect.value)];
  updateElo(bucket, currentA.nombre, currentB.nombre, winner);
  saveState();
  renderTop();
  newDuel();
}

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const btnA = document.getElementById("btnA");
const btnB = document.getElementById("btnB");
const btnNewPair = document.getElementById("btnNewPair");
const btnReset = document.getElementById("btnReset");
const btnShowTop = document.getElementById("btnShowTop");
const topBox = document.getElementById("topBox");
const question = document.getElementById("question");

let currentA, currentB;

for (const [k,v] of Object.entries(segmentos)){
  segmentSelect.innerHTML += `<option value="${k}">${v}</option>`;
}

for (const [k,v] of Object.entries(contextos)){
  contextSelect.innerHTML += `<option value="${k}">${v}</option>`;
}

btnA.onclick = ()=>vote("A");
btnB.onclick = ()=>vote("B");
btnNewPair.onclick = newDuel;
btnShowTop.onclick = renderTop;

btnReset.onclick = ()=>{
  state = defaultState();
  saveState();
  renderTop();
  newDuel();
};

newDuel();
renderTop();
