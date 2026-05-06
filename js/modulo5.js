// ══════════════════════════════════════════
//   MÓDULO 5 — CLASIFICACIÓN POR DENOMINACIÓN
// ══════════════════════════════════════════

const dineroClasificar = [
  { value: 1, label: '$1', tipo: 'Moneda', img: '../img/1PESO.png' },
  { value: 2, label: '$2', tipo: 'Moneda', img: '../img/2PESOS.png' },
  { value: 5, label: '$5', tipo: 'Moneda', img: '../img/5PESOS.png' },
  { value: 10, label: '$10', tipo: 'Moneda', img: '../img/10PESOS.png' },
  { value: 20, label: '$20', tipo: 'Billete', img: '../img/20pesos.png' },
  { value: 50, label: '$50', tipo: 'Billete', img: '../img/50.png' },
  { value: 100, label: '$100', tipo: 'Billete', img: '../img/100.png' },
  { value: 200, label: '$200', tipo: 'Billete', img: '../img/200.png' },
  { value: 500, label: '$500', tipo: 'Billete', img: '../img/500.png' }
];

// ══════════════════════════════════════════
//   ESTADO
// ══════════════════════════════════════════
let score = 0;
let currentQ = 0;
const totalQ = 10;
let answered = false;
let muted = false;
let currentQuestion = null;

// ══════════════════════════════════════════
//   MENSAJES
// ══════════════════════════════════════════
const mensajesCorrecto = [
  '¡Excelente!',
  '¡Muy bien!',
  '¡Perfecto!',
  '¡Qué bien!',
  '¡Lo lograste!'
];

const mensajesError = [
  'Buen intento',
  'Vamos otra vez',
  'Casi',
  'Tú puedes',
  'Intentemos de nuevo'
];

function mensajeAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function mostrarMensaje(texto, color) {
  const msg = document.getElementById('mensajeFeedback');
  msg.textContent = texto;
  msg.style.background = color;
  msg.style.display = 'block';

  setTimeout(() => {
    msg.style.display = 'none';
  }, 1300);
}

// ══════════════════════════════════════════
//   AYUDAS
// ══════════════════════════════════════════
function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function obtenerDineroAleatorio() {
  return dineroClasificar[randomInt(dineroClasificar.length)];
}

function generarOpciones(correcta) {
  const opciones = new Set();
  opciones.add(correcta);

  while (opciones.size < 3) {
    const candidata = dineroClasificar[randomInt(dineroClasificar.length)].label;
    opciones.add(candidata);
  }

  return shuffle([...opciones]);
}

// ══════════════════════════════════════════
//   PREGUNTA
// ══════════════════════════════════════════
function buildQuestion() {
  let pool = dineroClasificar;

  // Al inicio, solo valores pequeños para que sea más amable
  if (currentQ < 4) {
    pool = dineroClasificar.filter(item => item.value <= 20);
  }

  const money = pool[randomInt(pool.length)];
  const options = generarOpciones(money.label);

  currentQuestion = {
    money,
    options,
    correctLabel: money.label,
    promptHTML: '¿Cuál es su valor?',
    speakText: `¿Cuál es su valor?`
  };
}

// ══════════════════════════════════════════
//   CARGAR PREGUNTA
// ══════════════════════════════════════════
function loadQuestion() {
  answered = false;
  buildQuestion();

  document.getElementById('qCounter').textContent = `Pregunta ${currentQ + 1} de ${totalQ}`;
  document.getElementById('progressFill').style.width = `${(currentQ / totalQ) * 100}%`;
  document.getElementById('questionText').innerHTML = currentQuestion.promptHTML;

  document.getElementById('moneyImg').src = currentQuestion.money.img;
  document.getElementById('moneyImg').alt = currentQuestion.money.label;
  document.getElementById('moneyDisplayLabel').textContent = currentQuestion.money.tipo;

  renderOptions();
}

function renderOptions() {
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  currentQuestion.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-classify-btn';
    btn.textContent = opt;
    btn.onclick = () => selectOption(btn, opt);
    container.appendChild(btn);
  });
}

// ══════════════════════════════════════════
//   RESPUESTA
// ══════════════════════════════════════════
function selectOption(btn, value) {
  if (answered) return;
  answered = true;

  const allBtns = document.querySelectorAll('.option-classify-btn');
  const isCorrect = value === currentQuestion.correctLabel;

  allBtns.forEach(b => {
    b.disabled = true;
    if (b.textContent === currentQuestion.correctLabel) {
      b.classList.add('correct');
    }
  });

  if (isCorrect) {
    score++;
    document.getElementById('scoreDisplay').textContent = score;
    mostrarMensaje(mensajeAleatorio(mensajesCorrecto), '#28a745');
    setTimeout(nextQuestion, 1400);
  } else {
    btn.classList.add('wrong');
    mostrarMensaje(mensajeAleatorio(mensajesError), '#355cdc');

    setTimeout(() => {
      answered = false;
      allBtns.forEach(b => {
        b.disabled = false;
        b.classList.remove('correct', 'wrong');
      });
    }, 1400);
  }
}

function nextQuestion() {
  currentQ++;

  if (currentQ >= totalQ) {
    window.location.href = `felicidades.html?score=${score}&module=5`;
    return;
  }

  loadQuestion();
}

// ══════════════════════════════════════════
//   VOZ
// ══════════════════════════════════════════
function escucharPregunta() {
  if (muted || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(currentQuestion?.speakText || '¿Cuál es su valor?');
  u.lang = 'es-MX';
  u.rate = 0.95;
  u.pitch = 1.2;
  window.speechSynthesis.speak(u);
}

function toggleMute() {
  muted = !muted;

  const btn = document.getElementById('mute-btn');
  btn.innerHTML = muted
    ? '<i class="fa-solid fa-volume-xmark"></i>'
    : '<i class="fa-solid fa-volume-high"></i>';

  if (muted && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  showToast(muted ? 'Sonido desactivado' : 'Sonido activado');
}

// ══════════════════════════════════════════
//   MODALS / SETTINGS
// ══════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function toggleSetting(id) {
  document.getElementById(id).classList.toggle('on');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ══════════════════════════════════════════
//   TOAST
// ══════════════════════════════════════════
let toastTimer;

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = '1';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.opacity = '0';
  }, 2200);
}

// ══════════════════════════════════════════
//   INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadQuestion();
});

let musica;

document.addEventListener('DOMContentLoaded', () => {
  const musicMuted = localStorage.getItem('music_muted') === 'true';
  if (musicMuted) return;

  musica = new Audio('../audio/musica.mp3');
  musica.loop = true;
  musica.volume = 0.2;

  const savedTime = parseFloat(localStorage.getItem('music_time') || '0');
  musica.currentTime = savedTime;

  document.body.addEventListener('click', () => {
    musica.play().catch(() => {});
  }, { once: true });

  window.addEventListener('beforeunload', () => {
    if (!musica) return;
    localStorage.setItem('music_time', String(musica.currentTime));
  });
});