// ══════════════════════════════════════════
//   MÓDULO 3 — CONTEO BÁSICO
// ══════════════════════════════════════════

const dineroBase = [
  { value: 1, label: '$1', img: '../img/1PESO.png' },
  { value: 2, label: '$2', img: '../img/2PESOS.png' },
  { value: 5, label: '$5', img: '../img/5PESOS.png' },
  { value: 10, label: '$10', img: '../img/10PESOS.png' },
  { value: 20, label: '$20', img: '../img/20pesos.png' },
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
  '¡Lo hiciste muy bien!',
  '¡Perfecto!',
  '¡Qué bien!',
];

const mensajesError = [
  'Buen intento',
  'Vamos otra vez',
  'Casi',
  'Tú puedes',
  'Intentemos de nuevo',
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

function generarPiezasPorPregunta(index) {
  if (index < 3) return 1;
  if (index < 7) return 2;
  return 3;
}

function obtenerPiezaAleatoria() {
  return dineroBase[randomInt(dineroBase.length)];
}

function generarColeccion(cantidad) {
  const piezas = [];
  for (let i = 0; i < cantidad; i++) {
    piezas.push(obtenerPiezaAleatoria());
  }
  return piezas;
}

function calcularTotal(piezas) {
  return piezas.reduce((acc, pieza) => acc + pieza.value, 0);
}

function generarOpciones(correcta) {
  const opciones = new Set();
  opciones.add(correcta);

  while (opciones.size < 3) {
    let variacion = randomInt(6) + 1;
    let candidata = Math.random() < 0.5 ? correcta - variacion : correcta + variacion;

    if (candidata > 0) {
      opciones.add(candidata);
    }
  }

  return shuffle([...opciones]).map(v => `$${v}`);
}

// ══════════════════════════════════════════
//   PREGUNTA
// ══════════════════════════════════════════
function buildQuestion() {
  const cantidadPiezas = generarPiezasPorPregunta(currentQ);
  const piezas = generarColeccion(cantidadPiezas);
  const total = calcularTotal(piezas);
  const options = generarOpciones(total);

  currentQuestion = {
    piezas,
    total,
    options,
    correctLabel: `$${total}`,
    promptHTML: '¿Cuánto dinero hay?',
    speakText: `¿Cuánto dinero hay?`,
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

  renderMoney();
  renderOptions();
}

function renderMoney() {
  const area = document.getElementById('moneyArea');
  area.innerHTML = '';

  currentQuestion.piezas.forEach(pieza => {
    const item = document.createElement('div');
    item.className = 'money-item';

    const img = document.createElement('img');
    img.src = pieza.img;
    img.alt = pieza.label;

    const label = document.createElement('div');
    label.className = 'money-value';
    label.textContent = pieza.label;

    item.appendChild(img);
    item.appendChild(label);
    area.appendChild(item);
  });
}

function renderOptions() {
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  currentQuestion.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-count-btn';
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

  const allBtns = document.querySelectorAll('.option-count-btn');
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
    window.location.href = `felicidades.html?score=${score}&module=3`;
    return;
  }

  loadQuestion();
}

// ══════════════════════════════════════════
//   VOZ (por ahora simple / opcional)
// ══════════════════════════════════════════
function escucharPregunta() {
  if (muted || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(currentQuestion?.speakText || '¿Cuánto dinero hay?');
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