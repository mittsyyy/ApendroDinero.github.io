// casa.js - pantalla de inicio (index.html)

let rolActual = 'alumno';

function setRol(rol) {
    rolActual = rol;
    const esAlumno = rol === 'alumno';

    document.getElementById('tab-alumno').classList.toggle('active', esAlumno);
    document.getElementById('tab-profe').classList.toggle('active', !esAlumno);
    document.getElementById('form-alumno').style.display = esAlumno ? 'block' : 'none';
    document.getElementById('form-profesor').style.display = esAlumno ? 'none' : 'block';
    document.getElementById('hint-text').textContent = esAlumno
        ? 'Modo alumno: tu progreso se guarda en este navegador.'
        : 'Modo profesor: ingresa con tu correo y contraseña.';
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
    const edad = parseInt(document.getElementById('edad').value, 10);

    if (nombre === '') {
        mostrarError('Escribe tu nombre primero');
        return;
    }
    if (!edad || edad < 3 || edad > 50) {
        mostrarError('Escribe una edad entre 3 y 50');
        return;
    }
    mostrarError('');

    // Respaldo local y sesión (esto es lo que lee casa.html)
    localStorage.setItem('rolSesion', 'alumno');
    localStorage.setItem('nombreJugador', nombre);

    // Guardar en Supabase (sin bloquear el juego)
    try {
        if (!window.DB) throw new Error('DB no está cargado (revisa db.js y la librería de Supabase)');

        // Si en este navegador quedó abierta una sesión de profesor, la cerramos
        // para que el alumno no se registre con la cuenta de la maestra
        const { data: { session } } = await sb.auth.getSession();
        if (session && !session.user.is_anonymous) {
            await sb.auth.signOut();
        }

        await Promise.race([
            DB.registrarJugador(nombre, edad),
            new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('Tiempo agotado')), 5000))
        ]);
    } catch (e) {
        console.error('No se pudo guardar en Supabase:', e);
    }

    window.location.href = 'casa.html';
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