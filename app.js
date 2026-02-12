const artistas = [
  {
    nombre: "Bad Bunny",
    generacion: "Nueva",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Bad_Bunny_2019.jpg"
  },
  {
    nombre: "Taylor Swift",
    generacion: "Nueva",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Taylor_Swift_2019.jpg"
  },
  {
    nombre: "Billie Eilish",
    generacion: "Nueva",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Billie_Eilish_2019.jpg"
  },
  {
    nombre: "Michael Jackson",
    generacion: "Pasada",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/5/55/Michael_Jackson_1988.jpg"
  },
  {
    nombre: "Madonna",
    generacion: "Pasada",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Madonna_2015.jpg"
  },
  {
    nombre: "The Beatles",
    generacion: "Pasada",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/d/df/The_Fabs.JPG"
  }
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
const STORAGE_KEY = "impactogeneracional_v1";

function defaultState(){
  const buckets = {};
  for (const seg of Object.keys(segmentos)){
    for (const ctx of Object.keys(contextos)){
      const key = `${seg}__${ctx}`;
      buckets[key] = {};
      artistas.forEach(a => buckets[key][a.nombre] = RATING_INICIAL);
    }
  }
  return { buckets, votes: [] };
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  return JSON.parse(raw);
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

  const sa = winner === "A" ? 1 : 0;
  const sb = winner === "B" ? 1 : 0;

  bucket[a] = ra + K * (sa - ea);
  bucket[b] = rb + K * (sb - eb);
}

function randomPair(){
  const a = artistas[Math.floor(Math.random() * artistas.length)];
  let b = a;
  while (b === a){
    b = artistas[Math.floor(Math.random() * artistas.length)];
  }
  return [a, b];
}

function bucketKey(seg, ctx){
  return `${seg}__${ctx}`;
}

function topN(bucket, n=10){
  const arr = Object.entries(bucket).map(([nombre, rating]) => ({nombre, rating}));
  arr.sort((a,b) => b.rating - a.rating);
  return arr.slice(0, n);
}

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const questionEl = document.getElementById("question");
const btnA = document.getElementById("btnA");
const btnB = document.getElementById("btnB");
const topBox = document.getElementById("topBox");
const btnNewPair = document.getElementById("btnNewPair");
const btnReset = document.getElementById("btnReset");
const btnShowTop = document.getElementById("btnShowTop");

let currentA = null;
let currentB = null;

function fillSelect(select, obj){
  for (const [k,v] of Object.entries(obj)){
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = v;
    select.appendChild(opt);
  }
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

function renderArtist(button, artista){
  button.innerHTML = `
    <img src="${artista.imagen}">
    <h3>${artista.nombre}</h3>
  `;
}

function newDuel(){
  [currentA, currentB] = randomPair();
  renderArtist(btnA, currentA);
  renderArtist(btnB, currentB);
  questionEl.textContent = contextos[contextSelect.value];
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

btnA.onclick = ()=> vote("A");
btnB.onclick = ()=> vote("B");
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
