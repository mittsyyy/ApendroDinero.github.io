// ============================================================
// dashboard-db.js - Lee los datos reales de Supabase para el dashboard
// Cárgalo DESPUÉS de db.js (usa la variable "sb" que crea db.js)
// ============================================================

const DASH_AVATARES = ['fa-user-astronaut', 'fa-horse', 'fa-robot', 'fa-cat', 'fa-dog', 'fa-paw', 'fa-crow', 'fa-frog'];
const DASH_COLORES  = ['#4A90E2', '#FF6B9D', '#9B59B6', '#F5A623', '#2ECC71', '#E74C3C', '#1ABC9C', '#F39C12'];

const DASH_MODULOS = [
  { id: 1, titulo: 'Módulo 1', nombre: 'Billetes y Monedas',     icono: 'fa-coins',            color: '#F5A623' },
  { id: 2, titulo: 'Módulo 2', nombre: 'Comparación de Valores', icono: 'fa-scale-balanced',   color: '#4A90E2' },
  { id: 3, titulo: 'Módulo 3', nombre: 'Conteo Básico',          icono: 'fa-calculator',       color: '#7ED321' },
  { id: 4, titulo: 'Módulo 4', nombre: 'Simulación de Compra',   icono: 'fa-cart-shopping',    color: '#9B59B6' },
  { id: 5, titulo: 'Módulo 5', nombre: 'Clasificación',          icono: 'fa-building-columns', color: '#E74C3C' }
];

// Cuenta cuántos logros lleva un alumno (mismas reglas que el catálogo del dashboard)
function dashContarLogros(j) {
  const comp = j.progreso.filter(p => p.comp === 1).length;
  const perfectos = j.progreso.filter(p => p.score === 10).length;
  const m1 = j.progreso.find(p => p.mod === 1);
  let n = 0;
  if (comp === 5) n++;                    // Leyenda Financiera
  if (perfectos >= 3) n++;                // Maestro del Dinero
  if (j.racha >= 7) n++;                  // Imparable
  if (j.puntos >= 100) n++;               // Centenario
  if (m1 && m1.score === 10) n++;         // Perfecto M1
  if (perfectos >= 1) n++;                // Precisión
  if (comp >= 1) n++;                     // En Camino
  if (comp >= 3) n++;                     // Despegue
  return n;
}

function dashMostrarError(msg) {
  const div = document.createElement('div');
  div.style.cssText = 'background:#FEE2E2;border:1px solid #FCA5A5;color:#991B1B;padding:10px 16px;border-radius:8px;margin:16px;font-size:13px;';
  div.textContent = msg;
  document.body.insertBefore(div, document.body.firstChild);
}

// Devuelve los datos en el mismo formato que el dashboard ya esperaba
window.cargarDashboardSupabase = async function () {
  const vacio = { hayDatos: false, jugadores: [], modulos: DASH_MODULOS, actividad: [] };

  try {
    // 1) Solo entra quien tenga sesión real de profesor
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      location.replace('index.html');
      return new Promise(() => {}); // detiene el resto mientras redirige
    }
    const { data: prof, error: errProf } = await sb
      .from('profesores').select('id, nombre').eq('id', session.user.id).maybeSingle();
    if (errProf) throw errProf;
    if (!prof) {
      location.replace('index.html');
      return new Promise(() => {});
    }

    // 2) Datos de todos los alumnos (las políticas RLS dejan leer todo solo a profesores)
    const [rj, rp] = await Promise.all([
      sb.from('jugadores').select('*'),
      sb.from('progreso_modulos').select('*')
    ]);
    if (rj.error) throw rj.error;
    if (rp.error) throw rp.error;

    const filasPorJugador = {};
    rp.data.forEach(f => {
      if (!filasPorJugador[f.jugador_id]) filasPorJugador[f.jugador_id] = [];
      filasPorJugador[f.jugador_id].push(f);
    });

    // 3) Jugadores
    const jugadores = rj.data.map((j, i) => {
      const filas = filasPorJugador[j.id] || [];
      const progreso = DASH_MODULOS.map(m => {
        const f = filas.find(x => x.modulo_id === m.id);
        return {
          mod: m.id,
          score: f ? Math.round((f.progreso || 0) / 10) : 0,  // 0-100% -> 0-10
          comp: f && f.completado ? 1 : 0
        };
      });
      const alumno = {
        id: j.id,
        nombre: j.nombre || 'Sin nombre',
        avatar: DASH_AVATARES[i % DASH_AVATARES.length],
        color: DASH_COLORES[i % DASH_COLORES.length],
        puntos: filas.reduce((s, f) => s + (f.puntos || 0), 0),
        racha: j.racha_dias || 0,
        progreso
      };
      alumno.logros = dashContarLogros(alumno);
      return alumno;
    }).sort((a, b) => b.puntos - a.puntos);

    // 4) Actividad reciente (una fila por alumno y módulo jugado)
    const fechaDe = f => new Date(f.updated_at || f.created_at || 0);
    const actividad = rp.data
      .filter(f => (f.progreso || 0) > 0)
      .sort((a, b) => fechaDe(b) - fechaDe(a))
      .slice(0, 50)
      .map(f => {
        const j = jugadores.find(x => x.id === f.jugador_id);
        const m = DASH_MODULOS.find(x => x.id === f.modulo_id) || DASH_MODULOS[0];
        return {
          alumno: j ? j.nombre : '—',
          avatar: j ? j.avatar : 'fa-user',
          color: m.color,
          modulo: m.nombre,
          icono: m.icono,
          puntaje: Math.round((f.progreso || 0) / 10),
          total: 10,
          fecha: f.updated_at || f.created_at || null
        };
      });

    return { hayDatos: jugadores.length > 0, jugadores, modulos: DASH_MODULOS, actividad };
  } catch (e) {
    console.error('Dashboard (Supabase):', e);
    dashMostrarError('No se pudieron cargar los datos: ' + (e.message || e));
    return vacio;
  }
};