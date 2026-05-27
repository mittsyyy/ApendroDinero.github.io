// ══════════════════════════════════════════
//   LOGIN — index.html
//   Roles: alumno → casa.html, profesor → dashboard.html
// ══════════════════════════════════════════

// Credenciales fijas del profesor
const PROFESOR = {
  nombre: 'Dayana',
  password: 'dayana123'
};

let rolActual = 'alumno';

function setRol(rol) {
  rolActual = rol;
  document.getElementById('tab-alumno').classList.toggle('active', rol === 'alumno');
  document.getElementById('tab-profe').classList.toggle('active', rol === 'profesor');
  document.getElementById('form-alumno').style.display    = rol === 'alumno'   ? 'block' : 'none';
  document.getElementById('form-profesor').style.display  = rol === 'profesor' ? 'block' : 'none';
  document.getElementById('hint-text').textContent = rol === 'alumno'
    ? 'Modo alumno: tu progreso se guarda en este navegador.'
    : 'Modo profesor: acceso al dashboard de todos los alumnos.';
  ocultarError();
}

function mostrarError(msg) {
  const e = document.getElementById('error-msg');
  e.textContent = msg;
  e.classList.add('show');
}

function ocultarError() {
  const e = document.getElementById('error-msg');
  if (e) e.classList.remove('show');
}

function iniciar() {
  ocultarError();

  if (rolActual === 'profesor') {
    iniciarProfesor();
  } else {
    iniciarAlumno();
  }
}

function iniciarAlumno() {
  const nombre = document.getElementById('nombre').value.trim();
  const edad   = document.getElementById('edad').value;

  if (!nombre) {
    mostrarError('Escribe tu nombre primero');
    return;
  }
  if (!edad || edad < 3 || edad > 50) {
    mostrarError('Ingresa una edad válida (3 a 50)');
    return;
  }

  // Si un alumno intenta usar el nombre del profesor, lo redirigimos a la pestaña correcta
  if (nombre.toLowerCase() === PROFESOR.nombre.toLowerCase()) {
    mostrarError('Ese nombre está reservado al profesor. Cambia a la pestaña "Profesor".');
    return;
  }

  // Guardar sesión
  localStorage.setItem('nombreJugador', nombre);
  localStorage.setItem('edadJugador', String(edad));
  localStorage.setItem('rolSesion', 'alumno');

  // Redirigir al juego
  window.location.href = 'casa.html';
}

function iniciarProfesor() {
  const nombre = document.getElementById('nombre-profe').value.trim();
  const pass   = document.getElementById('password-profe').value;

  if (!nombre) {
    mostrarError('Escribe tu nombre');
    return;
  }

  if (nombre.toLowerCase() !== PROFESOR.nombre.toLowerCase()) {
    mostrarError('Usuario no autorizado como profesor.');
    return;
  }

  if (pass !== PROFESOR.password) {
    mostrarError('Contraseña incorrecta.');
    return;
  }

  // Guardar sesión
  localStorage.setItem('rolSesion', 'profesor');
  localStorage.setItem('nombreProfesor', PROFESOR.nombre);

  // Redirigir al dashboard
  window.location.href = 'dashboard.html';
}

// Permitir Enter para enviar
document.addEventListener('DOMContentLoaded', () => {
  ['nombre','edad','nombre-profe','password-profe'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') iniciar();
      });
    }
  });

  // Pre-llenar nombre si ya hay sesión previa
  const nombrePrevio = localStorage.getItem('nombreJugador');
  if (nombrePrevio && nombrePrevio.toLowerCase() !== PROFESOR.nombre.toLowerCase()) {
    const inp = document.getElementById('nombre');
    if (inp) inp.value = nombrePrevio;
  }
  const edadPrevia = localStorage.getItem('edadJugador');
  if (edadPrevia) {
    const inp = document.getElementById('edad');
    if (inp) inp.value = edadPrevia;
  }
});
