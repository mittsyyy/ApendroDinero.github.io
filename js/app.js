// app.js - menú principal (casa.html)

// Títulos alineados con las tarjetas de casa.html y la tabla "modulos".
// El progreso real viene de Supabase.
const modules = [
  { id:1, title:'Módulo 1 – Reconocimiento de Billetes y Monedas', desc:'Aprende a identificar las monedas y billetes mexicanos y su valor.', progress: 0 },
  { id:2, title:'Módulo 2 – Comparación de Valores',               desc:'Compara cuál moneda o billete vale más.',                          progress: 0 },
  { id:3, title:'Módulo 3 – Conteo Básico',                        desc:'Practica contar monedas y billetes.',                              progress: 0 },
  { id:4, title:'Módulo 4 – Simulación de Compra',                 desc:'Practica comprando y recibiendo cambio.',                          progress: 0 },
  { id:5, title:'Módulo 5 – Clasificación por Denominación',       desc:'Agrupa el dinero según su denominación.',                          progress: 0 },
];

// ── Carrusel ─────────────────────────
const VISIBLE = 3;
let current = 0;
const total  = modules.length;

function buildDots() {
  const d = document.getElementById('dots');
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
  const w = items[0].offsetWidth + 24;
  document.getElementById('carousel').style.transform = `translateX(-${current * w}px)`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  document.getElementById('arrow-left').style.opacity  = current === 0 ? '0.3' : '1';
  document.getElementById('arrow-right').style.opacity = current >= total - VISIBLE ? '0.3' : '1';
}

function goTo(i)           { current = Math.max(0, Math.min(i, total - VISIBLE)); updateCarousel(); }
function moveCarousel(dir) { goTo(current + dir); }

// ── Modals ───────────────────────────
function openModal(id)  {
  document.getElementById(id).classList.add('open');
  if (id === 'score-modal') cargarResumen();
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── Abrir módulo ─────────────────────
let moduloActual = 1; // guarda qué módulo se abrió

function openModule(n) {
  moduloActual = n;
  const m = modules.find(x => x.id === n);
  document.getElementById('mod-title').textContent        = m.title;
  document.getElementById('mod-desc').textContent         = m.desc;
  document.getElementById('mod-progress-pct').textContent = m.progress + '%';

  // Animar barra de progreso
  const bar = document.getElementById('mod-progress-bar');
  bar.style.width = '0%';
  setTimeout(() => { bar.style.width = m.progress + '%'; }, 80);

  openModal('module-modal');
}

function startModule() {
  closeModal('module-modal');
  window.location.href = `modulos/modulo${moduloActual}.html`;
}

function cerrarSesion() {
  localStorage.removeItem('rolSesion');
  window.location.replace('index.html');
}

// ── Perfil / Nombre ──────────────────
async function saveName() {
  const n = document.getElementById('name-input').value.trim() || 'Player';
  document.getElementById('player-name').textContent = n;
  localStorage.setItem('nombreJugador', n);
  closeModal('player-modal');
  showToast('¡Nombre guardado, ' + n + '!');
  try { await DB.actualizarNombre(n); } catch (e) { console.error(e); }
}

async function toggleSetting(id) {
  document.getElementById(id).classList.toggle('on');
  const sonido = document.getElementById('toggle-sound').classList.contains('on');
  const musica = document.getElementById('toggle-music').classList.contains('on');
  try { await DB.guardarAjustes(sonido, musica); } catch (e) { console.error(e); }
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

// ── Toast ─────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Datos desde Supabase ──────────────
async function cargarResumen() {
  try {
    const r = await DB.obtenerResumen();
    if (!r) return;
    document.getElementById('total-score').textContent  = r.puntos_totales;
    document.getElementById('modules-done').textContent = r.modulos_completados;
    document.getElementById('streak').textContent       = r.racha_dias;
    document.getElementById('stars').innerHTML =
      '<i class="fa-solid fa-star" style="color: rgb(255, 212, 59);"></i>' + r.estrellas;
  } catch (e) { console.error(e); }
}

// Desbloquea los módulos que estaban bloqueados cuando el anterior está completo
function aplicarDesbloqueos(progresoPorModulo) {
  document.querySelectorAll('.module-card.card-locked').forEach(card => {
    const n = parseInt(card.className.match(/card-(\d)/)[1], 10);
    const previo = progresoPorModulo[n - 1];
    if (previo && previo.completado) {
      card.classList.remove('card-locked');
      card.onclick = () => openModule(n);
    }
  });
}

async function cargarDatos() {
  // Mientras carga, usa el nombre guardado en el navegador
  const local = localStorage.getItem('nombreJugador');
  if (local) document.getElementById('player-name').textContent = local;

  try {
    await DB.asegurarSesion();
    let jugador = await DB.obtenerJugador();

    if (!jugador) {
      if (local) {
        // Jugador de antes de la base de datos: lo registramos
        await DB.registrarJugador(local, null);
        jugador = await DB.obtenerJugador();
      } else {
        // Dispositivo nuevo: que se registre en la pantalla de inicio
        window.location.href = 'index.html';
        return;
      }
    }

    document.getElementById('player-name').textContent = jugador.nombre;
    document.getElementById('name-input').value = jugador.nombre;
    document.getElementById('toggle-sound').classList.toggle('on', jugador.sonido);
    document.getElementById('toggle-music').classList.toggle('on', jugador.musica);

    await DB.actualizarRacha();

    const progreso = await DB.obtenerProgreso();
    modules.forEach(m => {
      if (progreso[m.id]) m.progress = progreso[m.id].progreso;
    });
    aplicarDesbloqueos(progreso);
    await cargarResumen();
  } catch (e) {
    console.error('Error cargando datos de Supabase:', e);
  }
}

// ── Init ──────────────────────────────
buildDots();
setTimeout(updateCarousel, 50);
window.addEventListener('resize', updateCarousel);
cargarDatos();