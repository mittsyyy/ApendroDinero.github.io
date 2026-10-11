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
//   SUPABASE (si db.js no cargó, el juego sigue funcionando)
// ══════════════════════════════════════════
const NUM_MODULO = 5;
const DBm = window.DB || {
  respuesta:    async () => {},
  avanceModulo: async () => {}
};

let errores           = 0;                  // equivocaciones (definen las estrellas)
let inicioPregunta    = Date.now();         // para medir cuánto tarda en responder
let guardadoPendiente = Promise.resolve();  // el último guardado de progreso

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
    speakText: `¿Cuál es su valor?`,
    actividad: `clasificar_${money.tipo.toLowerCase()}_${money.value}`
  };
}

// ══════════════════════════════════════════
//   CARGAR PREGUNTA
// ══════════════════════════════════════════
function loadQuestion() {
  answered = false;
  buildQuestion();
  inicioPregunta = Date.now();

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

  // ── Supabase: registrar el intento ──
  const segundos = (Date.now() - inicioPregunta) / 1000;
  DBm.respuesta(NUM_MODULO, currentQuestion.actividad, isCorrect, segundos);

  if (isCorrect) {
    score++;
    document.getElementById('scoreDisplay').textContent = score;
    mostrarMensaje(mensajeAleatorio(mensajesCorrecto), '#28a745');

    // ── Supabase: guardar el avance ──
    guardadoPendiente = DBm.avanceModulo(NUM_MODULO, score, totalQ, errores);

    setTimeout(nextQuestion, 1400);
  } else {
    errores++;
    btn.classList.add('wrong');
    mostrarMensaje(mensajeAleatorio(mensajesError), '#355cdc');

    setTimeout(() => {
      answered = false;
      inicioPregunta = Date.now();
      allBtns.forEach(b => {
        b.disabled = false;
        b.classList.remove('correct', 'wrong');
      });
    }, 1400);
  }
}

async function nextQuestion() {
  currentQ++;

  if (currentQ >= totalQ) {
    if (window.AprendoStorage) AprendoStorage.guardarResultado(5, score, 10);
    // Espera (máximo 3 segundos) a que se guarde el progreso antes de salir
    await Promise.race([
      guardadoPendiente,
      new Promise(resolve => setTimeout(resolve, 3000))
    ]);
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
  if (btn) {
    btn.innerHTML = muted
      ? '<i class="fa-solid fa-volume-xmark"></i>'
      : '<i class="fa-solid fa-volume-high"></i>';
  }
  const soundToggle = document.getElementById('toggle-sound');
  if (soundToggle) soundToggle.classList.toggle('on', !muted);

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
  const control = document.getElementById(id);
  if (!control) return;
  control.classList.toggle('on');
  if (id === 'toggle-music') {
    const activada = control.classList.contains('on');
    toggleMusica(activada);
  } else if (id === 'toggle-sound') {
    toggleMute();
  }
  const sonido = document.getElementById('toggle-sound').classList.contains('on');
  const musica = document.getElementById('toggle-music').classList.contains('on');
  window.DB?.guardarAjustes(sonido, musica).catch(() => {});
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

function iniciarMusica() {
  if (!musica || localStorage.getItem('music_muted') === 'true') return;
  musica.play().catch(() => {});
}

function toggleMusica(activada) {
  if (!musica) return;
  localStorage.setItem('music_muted', String(!activada));
  if (activada) iniciarMusica();
  else {
    localStorage.setItem('music_time', String(musica.currentTime));
    musica.pause();
  }
}

function guardarTiempoMusica() {
  if (musica) localStorage.setItem('music_time', String(musica.currentTime));
}

document.addEventListener('DOMContentLoaded', () => {
  const musicMuted = localStorage.getItem('music_muted') === 'true';
  musica = new Audio('../audio/musica.mp3');
  musica.loop = true;
  musica.volume = 0.2;

  const savedTime = parseFloat(localStorage.getItem('music_time') || '0');
  musica.currentTime = savedTime;
  document.getElementById('toggle-music')?.classList.toggle('on', !musicMuted);
  if (!musicMuted) iniciarMusica();

  ['pointerdown', 'keydown'].forEach(evento => {
    document.addEventListener(evento, iniciarMusica);
  });
  musica.addEventListener('timeupdate', guardarTiempoMusica);

  window.addEventListener('pagehide', guardarTiempoMusica);
});