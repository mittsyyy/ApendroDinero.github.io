// ══════════════════════════════════════════
//   APP — Pantalla principal (casa.html)
//   Versión sin PHP: usa storage.js (localStorage)
// ══════════════════════════════════════════

// Catálogo de módulos local (antes venía de get_modulos.php)
let modules = [
  { id: 1, title: 'Módulo 1 — Monedas Básicas',  desc: 'Reconoce billetes y monedas mexicanas.', progress: 0 },
  { id: 2, title: 'Módulo 2 — Súper Moneda',     desc: 'Compara valores: ¿cuál vale más, menos, o son iguales?', progress: 0 },
  { id: 3, title: 'Módulo 3 — El Mercado',       desc: 'Conteo básico de dinero en situaciones de compra.', progress: 0 },
  { id: 4, title: 'Módulo 4 — El Banco',         desc: 'Simulación de compras y cambio.', progress: 0 },
  { id: 5, title: 'Módulo 5 — Ahorro',           desc: 'Clasifica por denominación y aprende a ahorrar.', progress: 0 },
];

// Recalcula el progreso de cada módulo desde storage.js
function actualizarProgresoModulos() {
  if (!window.AprendoStorage) return;
  const data = window.AprendoStorage.obtenerDashboard();
  const nombre = localStorage.getItem('nombreJugador');
  if (!nombre) return;

  const yo = data.jugadores.find(j => j.nombre === nombre);
  if (!yo) return;

  modules.forEach(m => {
    const p = yo.progreso.find(x => x.mod === m.id);
    // Progreso = score/10 * 100
    m.progress = p ? Math.round((p.score / 10) * 100) : 0;
  });
}

// ── Carrusel ─────────────────────────
const VISIBLE = 3;
let current = 0;
let total = modules.length;

function buildDots() {
  const d = document.getElementById('dots');
  if (!d) return;
  d.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === current ? ' active' : '');
    dot.onclick = () => goTo(i);
    d.appendChild(dot);
  }
}

function updateCarousel() {
  const items = document.querySelectorAll('.module-item');
  if (!items.length) return;
  const w = items[0].offsetWidth + 24;
  const carousel = document.getElementById('carousel');
  if (carousel) carousel.style.transform = `translateX(-${current * w}px)`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  const arrL = document.getElementById('arrow-left');
  const arrR = document.getElementById('arrow-right');
  if (arrL) arrL.style.opacity = current === 0 ? '0.3' : '1';
  if (arrR) arrR.style.opacity = current >= total - VISIBLE ? '0.3' : '1';
}

function goTo(i)           { current = Math.max(0, Math.min(i, total - VISIBLE)); updateCarousel(); }
function moveCarousel(dir) { goTo(current + dir); }

// ── Modals ───────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── Abrir módulo ─────────────────────
let moduloActual = 1;

function openModule(n) {
  moduloActual = n;
  actualizarProgresoModulos();
  const m = modules.find(x => x.id === n);
  if (!m) {
    console.warn('Módulo no encontrado:', n);
    return;
  }
  document.getElementById('mod-title').textContent        = m.title;
  document.getElementById('mod-desc').textContent         = m.desc;
  document.getElementById('mod-progress-pct').textContent = m.progress + '%';

  const bar = document.getElementById('mod-progress-bar');
  bar.style.width = '0%';
  setTimeout(() => { bar.style.width = m.progress + '%'; }, 80);

  openModal('module-modal');
}

function startModule() {
  closeModal('module-modal');
  window.location.href = `modulos/modulo${moduloActual}.html`;
}

// ── Perfil / Nombre ──────────────────
function saveName() {
  const n = document.getElementById('name-input').value.trim() || 'Player';
  localStorage.setItem('nombreJugador', n);
  document.getElementById('player-name').textContent = n;
  closeModal('player-modal');
  showToast('¡Nombre guardado, ' + n + '!');
  actualizarPuntajeUI();
}

// ── Puntaje (modal Puntaje) ──────────
function actualizarPuntajeUI() {
  if (!window.AprendoStorage) return;
  const nombre = localStorage.getItem('nombreJugador');

  const data = window.AprendoStorage.obtenerDashboard();
  const yo = nombre ? data.jugadores.find(j => j.nombre === nombre) : null;

  const totalScoreEl = document.getElementById('total-score');
  const modulesDoneEl = document.getElementById('modules-done');
  const streakEl = document.getElementById('streak');
  const starsEl = document.getElementById('stars');

  if (yo) {
    if (totalScoreEl)  totalScoreEl.textContent = yo.puntos;
    if (modulesDoneEl) modulesDoneEl.textContent = yo.progreso.filter(p => p.comp === 1).length;
    if (streakEl)      streakEl.textContent = yo.racha;
    if (starsEl)       starsEl.innerHTML = '<i class="fa-solid fa-star" style="color: rgb(255, 212, 59);"></i>' +
                                            yo.progreso.reduce((s, p) => s + (p.score || 0), 0);
  } else {
    if (totalScoreEl)  totalScoreEl.textContent = '0';
    if (modulesDoneEl) modulesDoneEl.textContent = '0';
    if (streakEl)      streakEl.textContent = '0';
    if (starsEl)       starsEl.innerHTML = '<i class="fa-solid fa-star" style="color: rgb(255, 212, 59);"></i>0';
  }
}

// ── Ajustes ──────────────────────────
function toggleSetting(id) {
  document.getElementById(id).classList.toggle('on');
  if (id === 'toggle-music') toggleMusicCasa();
  else if (id === 'toggle-sound') toggleMute();
}

let muted = true;
function toggleMute() {
  muted = !muted;
  document.getElementById('mute-btn').innerHTML = muted
    ? '<i class="fa-solid fa-volume-xmark"></i>'
    : '<i class="fa-solid fa-volume-high"></i>';
  document.getElementById('mute-btn').style.color = 'white';
  showToast(muted ? 'Sonido desactivado' : 'Sonido activado');
}

// Música de fondo en casa.html (usa el <audio id="bg-music">)
function toggleMusicCasa() {
  const audio = document.getElementById('bg-music');
  if (!audio) return;
  if (audio.paused) {
    localStorage.setItem('music_muted', 'false');
    audio.play().catch(() => {});
  } else {
    localStorage.setItem('music_muted', 'true');
    audio.pause();
  }
}

function empezarExperiencia() {
  const start = document.getElementById('start-screen');
  if (start) start.style.display = 'none';
  const audio = document.getElementById('bg-music');
  if (audio && localStorage.getItem('music_muted') !== 'true') {
    audio.volume = 0.25;
    audio.play().catch(() => {});
  }
}

// ── Cerrar sesión ─────────────────────
function cerrarSesion() {
  localStorage.removeItem('rolSesion');
  // Mantenemos nombreJugador para que pueda volver a entrar fácil
  window.location.href = 'index.html';
}

// ── Toast ─────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Init ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  total = modules.length;

  // Si ya hay nombre guardado, mostrarlo en el header
  const nombreGuardado = localStorage.getItem('nombreJugador');
  if (nombreGuardado) {
    const nameEl = document.getElementById('player-name');
    if (nameEl) nameEl.textContent = nombreGuardado;
    const inputEl = document.getElementById('name-input');
    if (inputEl) inputEl.value = nombreGuardado;
  }

  actualizarProgresoModulos();
  buildDots();
  updateCarousel();
  actualizarPuntajeUI();

  // Reflejar estado de música en el toggle del modal
  const tm = document.getElementById('toggle-music');
  if (tm && localStorage.getItem('music_muted') === 'true') {
    tm.classList.remove('on');
  }
});

window.addEventListener('resize', updateCarousel);
