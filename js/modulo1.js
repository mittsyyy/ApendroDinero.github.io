const questions = [
  {
    type: 'bill',
    value: 20,
    question: '¿Cuánto vale este billete?',
    img: '../img/20pesos.png',
    options: ['$50 Pesos', '$100 Pesos', '$20 Pesos', '$5 Pesos'],
    correct: '$20 Pesos'
  },
  {
    type: 'bill',
    value: 50,
    question: '¿Cuánto vale este billete?',
    img: '../img/50.png',
    options: ['$20 Pesos', '$50 Pesos', '$100 Pesos', '$10 Pesos'],
    correct: '$50 Pesos'
  },
  {
    type: 'bill',
    value: 100,
    question: '¿Cuánto vale este billete?',
    img: '../img/100.png',
    options: ['$50 Pesos', '$200 Pesos', '$20 Pesos', '$100 Pesos'],
    correct: '$100 Pesos'
  },
  {
    type: 'bill',
    value: 200,
    question: '¿Cuánto vale este billete?',
    img: '../img/200.png',
    options: ['$500 Pesos', '$200 Pesos', '$100 Pesos', '$50 Pesos'],
    correct: '$200 Pesos'
  },
  {
    type: 'bill',
    value: 500,
    question: '¿Cuánto vale este billete?',
    img: '../img/500.png',
    options: ['$200 Pesos', '$1000 Pesos', '$500 Pesos', '$100 Pesos'],
    correct: '$500 Pesos'
  },
  {
    type: 'coin',
    value: 1,
    question: '¿Cuánto vale esta moneda?',
    img: '../img/1PESO.png',
    options: ['$2 Pesos', '$5 Pesos', '$1 Peso', '$10 Pesos'],
    correct: '$1 Peso'
  },
  {
    type: 'coin',
    value: 2,
    question: '¿Cuánto vale esta moneda?',
    img: '../img/2PESOS.png',
    options: ['$1 Peso', '$5 Pesos', '$2 Pesos', '$10 Pesos'],
    correct: '$2 Pesos'
  },
  {
    type: 'coin',
    value: 5,
    question: '¿Cuánto vale esta moneda?',
    img: '../img/5PESOS.png',
    options: ['$2 Pesos', '$10 Pesos', '$1 Peso', '$5 Pesos'],
    correct: '$5 Pesos'
  },
  {
    type: 'coin',
    value: 10,
    question: '¿Cuánto vale esta moneda?',
    img: '../img/10PESOS.png',
    options: ['$5 Pesos', '$10 Pesos', '$20 Pesos', '$2 Pesos'],
    correct: '$10 Pesos'
  }
];

// =============================================
//   SUPABASE (si db.js no cargó, el juego sigue funcionando)
// =============================================
const NUM_MODULO = 1;
const DBm = window.DB || {
  respuesta:    async () => {},
  avanceModulo: async () => {}
};

// =============================================
//   MUTE
// =============================================
let muted         = localStorage.getItem('sound_muted') === 'true';
let audioDesbloqueado = false; // ← los navegadores bloquean audio sin interacción

function toggleMute() {
  muted = !muted;
  localStorage.setItem('sound_muted', String(muted));
  const btn = document.getElementById('mute-btn');
  if (btn) {
    btn.innerHTML = muted
      ? '<i class="fa-solid fa-volume-xmark"></i>'
      : '<i class="fa-solid fa-volume-high"></i>';
  }
  const soundToggle = document.getElementById('toggle-sound');
  if (soundToggle) soundToggle.classList.toggle('on', !muted);
  if (muted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  showToast(muted ? 'Sonido desactivado' : 'Sonido activado');
}

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

// Interruptores del modal de Ajustes
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
  const musicaActiva = document.getElementById('toggle-music').classList.contains('on');
  window.DB?.guardarAjustes(sonido, musicaActiva).catch(() => {});
}

// =============================================
//   VOZ — única función speak()
// =============================================
function speak(texto) {
  if (muted) return;
  if (!('speechSynthesis' in window)) return;
  if (!audioDesbloqueado) return; // ← espera a que el usuario haya tocado algo

  window.speechSynthesis.cancel();

  const u  = new SpeechSynthesisUtterance(texto);
  u.lang   = 'es-MX';
  u.rate   = 1.0;
  u.pitch  = 1.8;
  u.volume = 1;

  const elegirVoz = () => {
    const voices = window.speechSynthesis.getVoices();
    const voz =
      voices.find(v => v.name.toLowerCase().includes('paulina')) ||
      voices.find(v => v.name.toLowerCase().includes('monica'))  ||
      voices.find(v => v.name.toLowerCase().includes('sabina'))  ||
      voices.find(v => v.lang === 'es-MX' && v.localService)    ||
      voices.find(v => v.lang === 'es-MX')                      ||
      voices.find(v => v.lang.startsWith('es') && v.localService)||
      voices.find(v => v.lang.startsWith('es'));
    if (voz) u.voice = voz;
    window.speechSynthesis.speak(u);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    elegirVoz();
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', elegirVoz, { once: true });
  }
}

// =============================================
//   DESBLOQUEAR AUDIO en primer click/tap
// =============================================
function desbloquearAudio() {
  if (audioDesbloqueado) return;
  audioDesbloqueado = true;
  // Habla en silencio para desbloquear el contexto de audio
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  window.speechSynthesis.speak(u);
  // Ahora lee la pregunta actual
  if (currentQuestion) {
    setTimeout(() => speak(currentQuestion.question), 200);
  }
}

// =============================================
//   ESCUCHAR PREGUNTA — botón
// =============================================
function escucharPregunta() {
  desbloquearAudio();
  if (!currentQuestion) return;
  const botones = Array.from(document.querySelectorAll('.option-btn'));
  const opcionesLeidas = botones.map(b => {
    const numero = b.textContent.replace(/[^0-9]/g, '').trim();
    const nombres = {
      '1'   : 'un peso',
      '2'   : 'dos pesos',
      '5'   : 'cinco pesos',
      '10'  : 'diez pesos',
      '20'  : 'veinte pesos',
      '50'  : 'cincuenta pesos',
      '100' : 'cien pesos',
      '200' : 'doscientos pesos',
      '500' : 'quinientos pesos',
      '1000': 'mil pesos'
    };
    return nombres[numero] || numero + ' pesos';
  }).join('. ');
  setTimeout(() => speak(`${currentQuestion.question}. Las opciones son: ${opcionesLeidas}`), 100);
}

// =============================================
//   MENSAJES
// =============================================
const mensajesCorrecto = [
  '¡Excelente!',
  '¡Muy bien!',
  '¡Eres increíble!',
  '¡Lo lograste!',
  '¡Perfecto!'
];

const mensajesError = [
  '¡Tú puedes!',
  '¡Casi!',
  '¡Inténtalo otra vez!',
  '¡No te rindas!',
  '¡Vas bien!'
];

function mensajeAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function mostrarMensaje(texto, color) {
  let msg = document.getElementById('mensajeFeedback');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'mensajeFeedback';
    msg.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      padding: 12px 25px; border-radius: 12px; font-size: 18px;
      font-weight: bold; z-index: 9999; color: #fff;
      font-family: 'Baloo 2', cursive;
    `;
    document.body.appendChild(msg);
  }
  msg.textContent      = texto;
  msg.style.background = color;
  msg.style.display    = 'block';
  speak(texto);
  setTimeout(() => { msg.style.display = 'none'; }, 1200);
}

// =============================================
//   ESTADO DEL JUEGO
// =============================================
let score           = 0;
let currentQ        = 0;
const totalQ        = 10;
let answered        = false;
let usedIndices     = [];
let currentQuestion = null;

// Para Supabase
let errores           = 0;                    // equivocaciones (definen las estrellas)
let inicioPregunta    = Date.now();           // para medir cuánto tarda en responder
let guardadoPendiente = Promise.resolve();    // el último guardado de progreso

// =============================================
//   LÓGICA DEL JUEGO
// =============================================
function getRandomQuestion() {
  if (usedIndices.length >= questions.length) usedIndices = [];
  const available = questions.map((_, i) => i).filter(i => !usedIndices.includes(i));
  const idx       = available[Math.floor(Math.random() * available.length)];
  usedIndices.push(idx);
  return questions[idx];
}

function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

function loadQuestion() {
  answered        = false;
  currentQuestion = getRandomQuestion();
  inicioPregunta  = Date.now();

  document.getElementById('qCounter').textContent     = `Pregunta ${currentQ + 1} de ${totalQ}`;
  document.getElementById('progressFill').style.width = `${(currentQ / totalQ) * 100}%`;
  document.getElementById('moneyImgWrap').innerHTML   = `<img src="${currentQuestion.img}" class="money-img">`;
  document.getElementById('questionText').textContent = currentQuestion.question;

  const opts      = shuffle(currentQuestion.options);
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  opts.forEach(opt => {
    const btn     = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span>${opt}</span>`;
    btn.onclick   = () => {
      desbloquearAudio(); // ← desbloquea en el primer click de respuesta
      selectOption(btn, opt);
    };
    container.appendChild(btn);
  });
}

function selectOption(btn, value) {
  if (answered) return;
  answered = true;

  const isCorrect = value === currentQuestion.correct;
  const allBtns   = document.querySelectorAll('.option-btn');

  allBtns.forEach(b => {
    b.disabled = true;
    if (b.textContent.trim() === currentQuestion.correct) {
      b.classList.add('correct');
    }
  });

  // ── Supabase: registrar el intento ──
  const segundos  = (Date.now() - inicioPregunta) / 1000;
  const actividad = (currentQuestion.type === 'bill' ? 'billete_' : 'moneda_') + currentQuestion.value;
  DBm.respuesta(NUM_MODULO, actividad, isCorrect, segundos);

  if (isCorrect) {
    score++;
    document.getElementById('scoreDisplay').textContent = score;
    mostrarMensaje(mensajeAleatorio(mensajesCorrecto), '#28a745');

    // ── Supabase: guardar el avance ──
    guardadoPendiente = DBm.avanceModulo(NUM_MODULO, score, totalQ, errores);

    setTimeout(nextQuestion, 1200);
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
    }, 1200);
  }
}

// =============================================
//   NEXT QUESTION
// =============================================
async function nextQuestion() {
  currentQ++;
  if (currentQ >= totalQ) {
    // Espera (máximo 3 segundos) a que se guarde el progreso antes de salir
    await Promise.race([
      guardadoPendiente,
      new Promise(resolve => setTimeout(resolve, 3000))
    ]);
    window.location.href = `felicidades.html?score=${score}`;
    return;
  }
  loadQuestion();
}

// =============================================
//   MODALS
// =============================================
function openModal(id)  { document.getElementById(id).classList.add('open');    }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// =============================================
//   TOAST
// =============================================
let toastTimer;

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: #333; color: #fff; padding: 10px 20px; border-radius: 10px;
      font-size: 14px; z-index: 9999; opacity: 0; transition: 0.3s;
      font-family: 'Baloo 2', cursive;
    `;
    document.body.appendChild(t);
  }
  t.textContent   = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2000);
}

// =============================================
//   INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  musica = new Audio('../audio/musica.mp3');
  musica.loop = true;
  musica.volume = 0.2;
  const tiempoGuardado = Number(localStorage.getItem('music_time') || 0);
  if (Number.isFinite(tiempoGuardado)) musica.currentTime = tiempoGuardado;

  const musicToggle = document.getElementById('toggle-music');
  const activada = localStorage.getItem('music_muted') !== 'true';
  if (musicToggle) musicToggle.classList.toggle('on', activada);
  if (activada) iniciarMusica();
  ['pointerdown', 'keydown'].forEach(evento => {
    document.addEventListener(evento, iniciarMusica);
  });
  musica.addEventListener('timeupdate', guardarTiempoMusica);
  window.addEventListener('pagehide', guardarTiempoMusica);

  const btn = document.getElementById('mute-btn');
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    btn.style.color = 'white';
  }
  loadQuestion();
});