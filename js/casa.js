// casa.js - pantalla de inicio (index.html)

let rolActual = 'alumno';

function setRol(rol) {
    rolActual = rol;
    const esAlumno = rol === 'alumno';

    document.getElementById('registro-alumno').style.display = 'none';
    document.getElementById('btn-principal').style.display = 'block';
    document.getElementById('btn-registrar-alumno').style.display = esAlumno ? 'none' : 'block';
    document.getElementById('registro-alumno').style.display = esAlumno ? 'none' : 'block';
    document.getElementById('btn-principal').innerHTML = esAlumno
        ? '<i class="fa-solid fa-play" aria-hidden="true"></i> Entrar como alumno'
        : '<i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> Entrar como profesor';
    document.getElementById('tab-alumno').classList.toggle('active', esAlumno);
    document.getElementById('tab-profe').classList.toggle('active', !esAlumno);
    document.getElementById('form-alumno').style.display = esAlumno ? 'block' : 'none';
    document.getElementById('form-profesor').style.display = esAlumno ? 'none' : 'block';
    document.getElementById('hint-text').textContent = esAlumno
        ? 'Escribe tu nombre y el PIN que te asignó tu profesor.'
        : 'Modo profesor: inicia sesión para entrar o registrar alumnos.';
    mostrarError('');
}

function mostrarError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.classList.toggle('show', msg !== '');
}

async function guardarNombre() {
    if (rolActual === 'profesor') {
        entrarProfesor();
        return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    const pin = document.getElementById('pin-alumno').value.trim();

    if (nombre === '') {
        mostrarError('Escribe tu nombre primero');
        return;
    }
    if (!/^\d{4,8}$/.test(pin)) {
        mostrarError('El PIN debe tener de 4 a 8 números');
        return;
    }
    mostrarError('');

    try {
        if (!window.DB) throw new Error('DB no está cargado (revisa db.js y la librería de Supabase)');
        const sesion = await DB.iniciarSesionAlumno(nombre, pin);
        localStorage.setItem('rolSesion', 'alumno');
        localStorage.setItem('nombreJugador', sesion.name);
        window.location.href = 'casa.html';
    } catch (e) {
        console.error('No se pudo iniciar sesión del alumno:', e);
        mostrarError(e.message || 'No se pudo iniciar sesión. Revisa el nombre y el PIN.');
    }
}

async function entrarProfesor() {
    const correo = document.getElementById('nombre-profe').value.trim();
    const pass = document.getElementById('password-profe').value;

    if (correo === '' || pass === '') {
        mostrarError('Escribe tu correo y contraseña');
        return;
    }
    mostrarError('');

    try {
        const { data, error } = await sb.auth.signInWithPassword({ email: correo, password: pass });
        if (error) throw error;

        // Verificar que la cuenta esté registrada como profesor
        const { data: prof, error: errProf } = await sb
            .from('profesores').select('nombre').eq('id', data.user.id).maybeSingle();
        if (errProf) throw errProf;

        if (!prof) {
            await sb.auth.signOut();
            mostrarError('Esta cuenta no tiene permisos de profesor');
            return;
        }

        localStorage.setItem('rolSesion', 'profesor');
        localStorage.setItem('nombreProfesor', prof.nombre || correo);
        window.location.href = 'dashboard.html';
    } catch (e) {
        console.error('Login profesor:', e);
        mostrarError('Correo o contraseña incorrectos');
    }
}

async function registrarAlumno() {
    const correo = document.getElementById('nombre-profe').value.trim();
    const pass = document.getElementById('password-profe').value;
    const nombre = document.getElementById('nombre-nuevo-alumno').value.trim();
    const pin = document.getElementById('pin-nuevo-alumno').value.trim();

    if (!correo || !pass) {
        mostrarError('Escribe el correo y la contraseña del profesor');
        return;
    }
    if (!nombre) {
        mostrarError('Escribe el nombre del alumno');
        return;
    }
    if (!/^\d{4,8}$/.test(pin)) {
        mostrarError('El PIN debe tener de 4 a 8 números');
        return;
    }

    try {
        mostrarError('');
        const { error } = await sb.auth.signInWithPassword({ email: correo, password: pass });
        if (error) throw error;
        const resultado = await DB.registrarAlumnoConPin(nombre, pin);
        mostrarError('');
        document.getElementById('nombre-nuevo-alumno').value = '';
        document.getElementById('pin-nuevo-alumno').value = '';
        document.getElementById('hint-text').textContent =
            `${resultado.name} ya puede entrar con su nombre y PIN.`;
    } catch (e) {
        console.error('No se pudo registrar al alumno:', e);
        mostrarError(e.message || 'No se pudo registrar al alumno.');
    }
}

// Ir al nivel
function irNivel(ruta) {
    hablar('Entrando al nivel uno');
    setTimeout(() => {
        window.location.href = ruta;
    }, 1200);
}

// Sonido del menú
function sonidoMenu(seccion) {
    hablar('Has seleccionado ' + seccion);
}

// Función de voz
function hablar(texto) {
    const voz = new SpeechSynthesisUtterance(texto);
    voz.lang = 'es-MX';
    speechSynthesis.speak(voz);
}