// casa.js - pantalla de inicio (index.html)

async function guardarNombre() {
    const nombre = document.getElementById("nombre").value.trim();
    const edad = parseInt(document.getElementById("edad").value, 10);

    if (nombre === "") {
        alert("Escribe tu nombre primero");
        return;
    }
    if (!edad || edad < 3 || edad > 50) {
        alert("Escribe una edad entre 3 y 50");
        return;
    }

    // Respaldo local (por si no hay internet)
    localStorage.setItem("nombreJugador", nombre);

    // Guardar en Supabase
    try {
        await DB.registrarJugador(nombre, edad);
    } catch (e) {
        console.error("No se pudo guardar en Supabase:", e);
    }

    // Redireccionar
    window.location.href = "casa.html";
}

// Ir al nivel
function irNivel(ruta){
    hablar("Entrando al nivel uno");
    setTimeout(()=>{
        window.location.href = ruta;
    },1200);
}

// Sonido del menú
function sonidoMenu(seccion){
    hablar("Has seleccionado " + seccion);
}

// Función de voz
function hablar(texto){
    let voz = new SpeechSynthesisUtterance(texto);
    voz.lang = "es-MX";
    speechSynthesis.speak(voz);
}