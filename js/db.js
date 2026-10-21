// ============================================================
// db.js - Conexión con Supabase para Aprendo Dinero
// Cárgalo DESPUÉS de la librería de Supabase y ANTES de app.js / casa.js
// ============================================================

const SUPABASE_URL = 'https://svijshihkoamgbxebgim.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2aWpzaGloa29hbWdieGViZ2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzQzNTYsImV4cCI6MjEwNzMxMDM1Nn0.qLT1TXZwLCAW9x9NB7uVQ4jCiD6j6YCxgZg5fP81sJQ';

// OJO: se llama "sb" (no "supabase") porque window.supabase es la librería
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Utilidades ───────────────────────
function fechaLocal(d) {
  return d.getFullYear() + '-' +
         String(d.getMonth() + 1).padStart(2, '0') + '-' +
         String(d.getDate()).padStart(2, '0');
}

// ── Sesión anónima (un usuario invisible por dispositivo) ──
async function asegurarSesion() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) return session.user;
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

// ── Jugador ──────────────────────────
async function registrarJugador(nombre, edad) {
  const user = await asegurarSesion();
  const fila = { id: user.id, nombre };
  if (edad) fila.edad = edad;
  const { error } = await sb.from('jugadores').upsert(fila);
  if (error) throw error;
}

async function obtenerJugador() {
  const user = await asegurarSesion();
  const { data, error } = await sb
    .from('jugadores').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data; // null si todavía no se ha registrado
}

async function actualizarNombre(nombre) {
  const user = await asegurarSesion();
  const { error } = await sb.from('jugadores').update({ nombre }).eq('id', user.id);
  if (error) throw error;
}

async function guardarAjustes(sonido, musica) {
  const user = await asegurarSesion();
  const { error } = await sb.from('jugadores').update({ sonido, musica }).eq('id', user.id);
  if (error) throw error;
}

// ── Racha de días ────────────────────
async function actualizarRacha() {
  const j = await obtenerJugador();
  if (!j) return 0;

  const hoy = fechaLocal(new Date());
  if (j.ultima_actividad === hoy) return j.racha_dias;

  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const racha = j.ultima_actividad === fechaLocal(ayer) ? j.racha_dias + 1 : 1;

  const { error } = await sb
    .from('jugadores')
    .update({ racha_dias: racha, ultima_actividad: hoy })
    .eq('id', j.id);
  if (error) throw error;
  return racha;
}

// ── Progreso de módulos ──────────────
// Devuelve un objeto: { 1: {progreso, completado, puntos, estrellas}, 2: {...} }
let avanceModuloPendiente = Promise.resolve();

async function obtenerProgreso() {
  const user = await asegurarSesion();
  const { data, error } = await sb
    .from('progreso_modulos').select('*').eq('jugador_id', user.id);
  if (error) throw error;
  const porModulo = {};
  (data || []).forEach(f => { porModulo[f.modulo_id] = f; });
  return porModulo;
}

// Guarda el progreso sin retroceder (conserva el mejor valor)
// Ejemplo: await guardarProgreso(1, { progreso: 60, puntos: 30, estrellas: 2 });
async function guardarProgreso(moduloId, { progreso = 0, puntos = 0, estrellas = 0 } = {}) {
  const user = await asegurarSesion();
  const actual = (await obtenerProgreso())[moduloId];

  const p  = Math.min(100, Math.max(progreso,  actual ? actual.progreso  : 0));
  const pt = Math.max(puntos,    actual ? actual.puntos    : 0);
  const es = Math.min(3, Math.max(estrellas, actual ? actual.estrellas : 0));

  const { error } = await sb.from('progreso_modulos').upsert({
    jugador_id: user.id,
    modulo_id: moduloId,
    progreso: p,
    completado: p >= 100,
    puntos: pt,
    estrellas: es
  }, { onConflict: 'jugador_id,modulo_id' });
  if (error) throw error;
}

// ── Intentos (cada respuesta) ────────
// Ejemplo: await registrarIntento(1, 'moneda_10', true, 10, 4.2);
async function registrarIntento(moduloId, actividad, correcto, puntos = 0, tiempoSeg = null) {
  const user = await asegurarSesion();
  const { error } = await sb.from('intentos').insert({
    jugador_id: user.id,
    modulo_id: moduloId,
    actividad,
    correcto,
    puntos,
    tiempo_seg: tiempoSeg
  });
  if (error) throw error;
}

// ── Resumen para el modal "Puntaje" ──
async function obtenerResumen() {
  const user = await asegurarSesion();
  const { data, error } = await sb
    .from('resumen_jugador').select('*').eq('jugador_id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

// Todo junto en un solo objeto para usarlo desde cualquier página
// ── Ayudas para los módulos ──────────
// Nunca rompen el juego: si Supabase falla, solo escriben el error en la consola.

// Registrar una respuesta.
// Ejemplo: DB.respuesta(1, 'billete_20', true, 4.2);
async function respuesta(moduloId, actividad, correcto, tiempoSeg) {
  try {
    await registrarIntento(moduloId, actividad, correcto, correcto ? 10 : 0,
                           Math.round((tiempoSeg || 0) * 100) / 100);
  } catch (e) { console.error('Supabase (intento):', e); }
}

// Guardar el avance del módulo.
// correctas = respuestas correctas hasta ahora, total = preguntas del módulo,
// errores = equivocaciones acumuladas (define las estrellas: 0-2 → 3, 3-5 → 2, más → 1)
// Ejemplo: DB.avanceModulo(1, 6, 10, 2);
async function avanceModulo(moduloId, correctas, total, errores = 0) {
  const guardar = async () => {
    const terminado = correctas >= total;
    const estrellas = !terminado ? 0 : errores <= 2 ? 3 : errores <= 5 ? 2 : 1;
    await guardarProgreso(moduloId, {
      progreso: Math.round(correctas / total * 100),
      puntos: correctas * 10,
      estrellas
    });
  };
  avanceModuloPendiente = avanceModuloPendiente.then(guardar, guardar).catch(e => {
    console.error('Supabase (progreso):', e);
  });
  return avanceModuloPendiente;
}

// Todo junto en un solo objeto para usarlo desde cualquier página
window.DB = {
  asegurarSesion, registrarJugador, obtenerJugador, actualizarNombre,
  guardarAjustes, actualizarRacha, obtenerProgreso, guardarProgreso,
  registrarIntento, obtenerResumen, respuesta, avanceModulo
};