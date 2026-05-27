let modules = []; // Ahora empezará vacío y se llenará de la BD

// Función para traer los módulos desde PHP
async function cargarModulosDesdeBD() {
    try {
        // Asumiendo que creaste un php/get_modulos.php similar al de avatares
        const respuesta = await fetch('php/get_modulos.php'); 
        modules = await respuesta.json();

        console.log("Módulos cargados:", modules);

        // Una vez cargados, inicializamos el carrusel
        buildDots();
        updateCarousel();
    } catch (error) {
        console.error("Error al cargar módulos:", error);
    }
}

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
function openModal(id)  { document.getElementById(id).classList.add('open'); }
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
  // ↑ Redirige a: modulos/modulo1.html, modulos/modulo2.html, etc.
}

// ── Perfil / Nombre ──────────────────
function saveName() {
  const n = document.getElementById('name-input').value.trim() || 'Player';
  document.getElementById('player-name').textContent = n;
  closeModal('player-modal');
  showToast('¡Nombre guardado, ' + n);
}

function toggleSetting(id) {
  document.getElementById(id).classList.toggle('on');
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

// ── Init ──────────────────────────────
cargarModulosDesdeBD(); // En lugar de buildDots() directo, llamamos a la BD
window.addEventListener('resize', updateCarousel);
