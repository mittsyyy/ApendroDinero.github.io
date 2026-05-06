// ══════════════════════════════════════════
//   MÓDULO 4 — SIMULACIÓN DE COMPRA
// ══════════════════════════════════════════

const productos = [
  { nombre: 'Manzana', precio: 5, img: '../img/manzana.png' },
  { nombre: 'Plátano', precio: 3, img: '../img/platano.png' },
  { nombre: 'Pan', precio: 10, img: '../img/pan.png' },
  { nombre: 'Leche', precio: 12, img: '../img/leche.png' },
  { nombre: 'Jugo', precio: 8, img: '../img/jugo.png' },
  { nombre: 'Galletas', precio: 6, img: '../img/galletas.png' },
  { nombre: 'Jabón', precio: 10, img: '../img/jabon.png' },
  { nombre: 'Cuaderno', precio: 15, img: '../img/cuaderno.png' },
  { nombre: 'Lápiz', precio: 2, img: '../img/lapiz.png' },
  { nombre: 'Pelota', precio: 20, img: '../img/pelota.png' }
];

const dineroOpciones = [1, 2, 5, 10, 20, 50];

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
  '¡Qué bien!',
  '¡Lo lograste!',
  '¡Perfecto!'
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

function obtenerProductoAleatorio() {
  return productos[randomInt(productos.length)];
}

function generarOpcionesPago(precio, index) {
  const set = new Set();

  // primeras preguntas: exacto
  if (index < 4) {
    set.add(precio);

    while (set.size < 3) {
      const candidata = dineroOpciones[randomInt(dineroOpciones.length)];
      if (candidata !== precio) set.add(candidata);
    }

    return {
      opciones: shuffle([...set]).map(v => `$${v}`),
      correcta: `$${precio}`,
      texto: '¿Con qué pagas?'
    };
  }

  // preguntas medias/finales: con qué puedes pagar
  const suficientes = dineroOpciones.filter(v => v >= precio);
  const insuficientes = dineroOpciones.filter(v => v < precio);

  const correcta = suficientes[randomInt(suficientes.length)];
  set.add(correcta);

  while (set.size < 3) {
    let candidata;

    if (insuficientes.length > 0 && Math.random() < 0.7) {
      candidata = insuficientes[randomInt(insuficientes.length)];
    } else {
      candidata = dineroOpciones[randomInt(dineroOpciones.length)];
    }

    set.add(candidata);
  }

  return {
    opciones: shuffle([...set]).map(v => `$${v}`),
    correcta: `$${correcta}`,
    texto: '¿Con qué puedes pagar?'
  };
}

// ══════════════════════════════════════════
//   PREGUNTA
// ══════════════════════════════════════════
function buildQuestion() {
  let producto = obtenerProductoAleatorio();

  // evitar precios que no existan al inicio en pago exacto
  if (currentQ < 4) {
    const productosExactos = productos.filter(p => dineroOpciones.includes(p.precio));
    producto = productosExactos[randomInt(productosExactos.length)];
  }

  const dataPago = generarOpcionesPago(producto.precio, currentQ);

  currentQuestion = {
    producto,
    options: dataPago.opciones,
    correctLabel: dataPago.correcta,
    promptHTML: dataPago.texto,
    speakText: `${dataPago.texto} ${producto.nombre}. Cuesta ${producto.precio} pesos.`
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

  document.getElementById('productImg').src = currentQuestion.producto.img;
  document.getElementById('productImg').alt = currentQuestion.producto.nombre;
  document.getElementById('productName').textContent = currentQuestion.producto.nombre;
  document.getElementById('productPrice').textContent = `$${currentQuestion.producto.precio}`;

  renderOptions();
}

function renderOptions() {
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  currentQuestion.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-shop-btn';
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

  const allBtns = document.querySelectorAll('.option-shop-btn');
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
    window.location.href = `felicidades.html?score=${score}&module=4`;
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
  const u = new SpeechSynthesisUtterance(
    currentQuestion?.speakText || '¿Con qué puedes pagar?'
  );
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