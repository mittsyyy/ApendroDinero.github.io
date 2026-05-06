// ══════════════════════════════════════════
//   BANCO DE PREGUNTAS — Módulo 2
//   Tipo: comparación de dos valores
// ══════════════════════════════════════════
const monedas = [
  { value: 1, label: '$1 Peso', img: '../img/1PESO.png' },
  { value: 2, label: '$2 Pesos', img: '../img/2PESOS.png' },
  { value: 5, label: '$5 Pesos', img: '../img/5PESOS.png' },
  { value: 10, label: '$10 Pesos', img: '../img/10PESOS.png' },
];

const billetes = [
  { value: 20, label: '$20 Pesos', img: '../img/20pesos.png' },
  { value: 50, label: '$50 Pesos', img: '../img/50.png' },
  { value: 100, label: '$100 Pesos', img: '../img/100.png' },
  { value: 200, label: '$200 Pesos', img: '../img/200.png' },
  { value: 500, label: '$500 Pesos', img: '../img/500.png' },
];

const allMoney = [...monedas, ...billetes];

const questionTypes = [
  {
    prompt: '¿Cuál tiene <strong>mayor</strong> valor?',
    speak: '¿Cuál tiene mayor valor?',
    compare: (a, b) => (a.value > b.value ? a : b),
  },
  {
    prompt: '¿Cuál tiene <strong>menor</strong> valor?',
    speak: '¿Cuál tiene menor valor?',
    compare: (a, b) => (a.value < b.value ? a : b),
  },
  {
    prompt: '¿Son <strong>iguales</strong> o <strong>diferentes</strong>?',
    speak: '¿Son iguales o diferentes?',
    compare: null,
  },
];

// ══════════════════════════════════════════
//   ESTADO
// ══════════════════════════════════════════
let score = 0;
let currentQ = 0;
const totalQ = 10;
let answered = false;
let muted = false;
let audioDesbloqueado = false;
let currentQuestion = null;
let vozSeleccionada = null;

// ══════════════════════════════════════════
//   VOZ
// ══════════════════════════════════════════
function normalizarTexto(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function obtenerVozAlegre() {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();

  if (!voices || !voices.length) return null;

  // Prioridad: voces en español de México y con nombres que suelen ser femeninos/naturales
  const preferredNames = [
    'paulina',
    'helena',
    'monica',
    'microsoft sabina',
    'sabina',
    'dalia',
    'sofia',
    'lucia',
    'elvira',
    'maria',
    'google español',
    'google espanol',
  ];

  const normalizedVoices = voices.map(v => ({
    raw: v,
    name: normalizarTexto(v.name),
    lang: (v.lang || '').toLowerCase(),
  }));

  // 1. Femeninas o comunes en es-MX
  let match = normalizedVoices.find(v =>
    v.lang === 'es-mx' &&
    preferredNames.some(name => v.name.includes(name))
  );

  // 2. Cualquier voz es-MX
  if (!match) {
    match = normalizedVoices.find(v => v.lang === 'es-mx');
  }

  // 3. Voz española con nombre preferido
  if (!match) {
    match = normalizedVoices.find(v =>
      v.lang.startsWith('es') &&
      preferredNames.some(name => v.name.includes(name))
    );
  }

  // 4. Cualquier voz en español
  if (!match) {
    match = normalizedVoices.find(v => v.lang.startsWith('es'));
  }

  return match ? match.raw : null;
}

function prepararVoces() {
  vozSeleccionada = obtenerVozAlegre();
}

function speak(texto, opciones = {}) {
  if (muted || !('speechSynthesis' in window) || !audioDesbloqueado) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(texto);

  utter.lang = 'es-MX';
  utter.rate = opciones.rate ?? 0.95;
  utter.pitch = opciones.pitch ?? 1.35;
  utter.volume = opciones.volume ?? 1;

  if (!vozSeleccionada) {
    vozSeleccionada = obtenerVozAlegre();
  }

  if (vozSeleccionada) {
    utter.voice = vozSeleccionada;
    utter.lang = vozSeleccionada.lang || 'es-MX';
  }

  synth.speak(utter);
}

function desbloquearAudio() {
  if (audioDesbloqueado) return;
  audioDesbloqueado = true;

  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  window.speechSynthesis.speak(u);

  if (currentQuestion) {
    setTimeout(() => speak(currentQuestion.speakText), 250);
  }
}

function limpiarLabel(label) {
  return label.replace('$', '').replace(/\s*pesos?/i, '').trim();
}

function escucharPregunta() {
  desbloquearAudio();
  if (!currentQuestion) return;

  const a = limpiarLabel(currentQuestion.moneyA.label);
  const b = limpiarLabel(currentQuestion.moneyB.label);
  const texto = `${currentQuestion.speakText}. ¿${a} pesos, o ${b} pesos?`;

  setTimeout(() => {
    speak(texto, { rate: 0.92, pitch: 1.4 });
  }, 100);
}

function toggleMute() {
  muted = !muted;
  const btn = document.getElementById('mute-btn');

  btn.innerHTML = muted
    ? '<i class="fa-solid fa-volume-xmark"></i>'
    : '<i class="fa-solid fa-volume-high"></i>';

  if (muted) window.speechSynthesis.cancel();

  showToast(muted ? 'Sonido desactivado' : 'Sonido activado');
}

// ══════════════════════════════════════════
//   MENSAJES
// ══════════════════════════════════════════
const mensajesCorrecto = [
  '¡Excelente!',
  '¡Muy bien!',
  '¡Eres increíble!',
  '¡Lo lograste!',
  '¡Perfecto!',
];

const mensajesError = [
  '¡Tú puedes!',
  '¡Casi!',
  '¡Inténtalo otra vez!',
  '¡No te rindas!',
  '¡Vas bien!',
];

function mensajeAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function mostrarMensaje(texto, color) {
  const msg = document.getElementById('mensajeFeedback');
  msg.textContent = texto;
  msg.style.background = color;
  msg.style.display = 'block';

  speak(texto, {
    rate: 0.98,
    pitch: color === '#28a745' ? 1.45 : 1.25,
  });

  setTimeout(() => {
    msg.style.display = 'none';
  }, 1300);
}

// ══════════════════════════════════════════
//   GENERAR PREGUNTA
// ══════════════════════════════════════════
function pickTwo() {
  const copy = [...allMoney];
  const iA = Math.floor(Math.random() * copy.length);
  let iB = Math.floor(Math.random() * copy.length);

  while (iB === iA) {
    iB = Math.floor(Math.random() * copy.length);
  }

  return [copy[iA], copy[iB]];
}

function buildQuestion() {
  const typeIdx = Math.floor(Math.random() * questionTypes.length);
  const type = questionTypes[typeIdx];

  let moneyA, moneyB;

  if (type.compare === null) {
    const igual = Math.random() < 0.4;

    if (igual) {
      const m = allMoney[Math.floor(Math.random() * allMoney.length)];
      moneyA = m;
      moneyB = m;
    } else {
      [moneyA, moneyB] = pickTwo();
      while (moneyA.value === moneyB.value) {
        [moneyA, moneyB] = pickTwo();
      }
    }
  } else {
    [moneyA, moneyB] = pickTwo();
    while (moneyA.value === moneyB.value) {
      [moneyA, moneyB] = pickTwo();
    }
  }

  let options, correctLabel;

  if (type.compare === null) {
    const sonIguales = moneyA.value === moneyB.value;
    correctLabel = sonIguales ? 'Son iguales' : 'Son diferentes';
    options = ['Son iguales', 'Son diferentes'];
  } else {
    const correct = type.compare(moneyA, moneyB);
    correctLabel = correct.label;
    options = [moneyA.label, moneyB.label];
  }

  options = options.sort(() => Math.random() - 0.5);

  currentQuestion = {
    moneyA,
    moneyB,
    type,
    speakText: type.speak,
    promptHTML: type.prompt,
    options,
    correctLabel,
  };
}

// ══════════════════════════════════════════
//   CARGAR PREGUNTA EN EL DOM
// ══════════════════════════════════════════
function loadQuestion() {
  answered = false;
  buildQuestion();

  document.getElementById('qCounter').textContent = `Pregunta ${currentQ + 1} de ${totalQ}`;
  document.getElementById('progressFill').style.width = `${(currentQ / totalQ) * 100}%`;
  document.getElementById('questionText').innerHTML = currentQuestion.promptHTML;

  document.getElementById('imgA').src = currentQuestion.moneyA.img;
  document.getElementById('imgA').alt = currentQuestion.moneyA.label;
  document.getElementById('labelA').textContent = currentQuestion.moneyA.label;

  document.getElementById('imgB').src = currentQuestion.moneyB.img;
  document.getElementById('imgB').alt = currentQuestion.moneyB.label;
  document.getElementById('labelB').textContent = currentQuestion.moneyB.label;

  const vsEl = document.getElementById('vsCircle');
  if (currentQuestion.type.compare === null) {
    vsEl.textContent = '?';
  } else {
    vsEl.textContent = 'VS';
  }

  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  currentQuestion.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-compare-btn';
    btn.textContent = opt;
    btn.onclick = () => {
      desbloquearAudio();
      selectOption(btn, opt);
    };
    container.appendChild(btn);
  });
}

// ══════════════════════════════════════════
//   SELECCIONAR OPCIÓN
// ══════════════════════════════════════════
function selectOption(btn, value) {
  if (answered) return;
  answered = true;

  const allBtns = document.querySelectorAll('.option-compare-btn');
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

// ══════════════════════════════════════════
//   SIGUIENTE PREGUNTA
// ══════════════════════════════════════════
function nextQuestion() {
  currentQ++;

  if (currentQ >= totalQ) {
    window.location.href = `felicidades.html?score=${score}&module=2`;
    return;
  }

  loadQuestion();
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
  prepararVoces();
  loadQuestion();

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      prepararVoces();
    };
  }

  document.addEventListener('click', desbloquearAudio, { once: true });
  document.addEventListener('touchstart', desbloquearAudio, { once: true });
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