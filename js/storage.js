// ══════════════════════════════════════════
//   STORAGE — Progreso del jugador en localStorage
//   Reemplaza a la BD mientras GitHub Pages sirve el sitio
// ══════════════════════════════════════════
(function (global) {
  'use strict';

  const STORAGE_KEY = 'apdinero_data';

  // Estructura por defecto
  function dataPorDefecto() {
    return {
      jugadores: {},   // { "Nombre": { avatar, color, puntos, racha, ultimoDia, logros, modulos: { 1: {score, comp, intentos, fecha}, ... } } }
      actividad: []    // [{ alumno, avatar, color, modulo, icono, puntaje, total, fecha }]
    };
  }

  function leer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return dataPorDefecto();
      const data = JSON.parse(raw);
      if (!data.jugadores) data.jugadores = {};
      if (!Array.isArray(data.actividad)) data.actividad = [];
      return data;
    } catch (e) {
      console.warn('Error leyendo storage, reseteando:', e);
      return dataPorDefecto();
    }
  }

  function escribir(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // Catálogo fijo de módulos (alineado con tu juego)
  const CATALOGO_MODULOS = [
    { id: 1, titulo: 'Módulo 1', nombre: 'Monedas Básicas', icono: '🪙', color: '#F5A623' },
    { id: 2, titulo: 'Módulo 2', nombre: 'Súper Moneda',    icono: '⚖️', color: '#4A90E2' },
    { id: 3, titulo: 'Módulo 3', nombre: 'El Mercado',      icono: '🧮', color: '#7ED321' },
    { id: 4, titulo: 'Módulo 4', nombre: 'El Banco',        icono: '🛒', color: '#9B59B6' },
    { id: 5, titulo: 'Módulo 5', nombre: 'Ahorro',          icono: '🏦', color: '#E74C3C' },
  ];

  // Avatares disponibles si el jugador no tiene uno asignado
  const POOL_AVATARES = [
    { avatar: '🧑‍🚀', color: '#4A90E2' },
    { avatar: '🦄',   color: '#FF6B9D' },
    { avatar: '🤖',   color: '#9B59B6' },
    { avatar: '🐱',   color: '#F5A623' },
    { avatar: '🐰',   color: '#FF69B4' },
    { avatar: '🐼',   color: '#7ED321' },
    { avatar: '🦊',   color: '#FB923C' },
    { avatar: '🐶',   color: '#34D399' },
  ];

  function pickAvatar(nombre, jugadores) {
    // Hash determinista por nombre para no cambiar avatar entre sesiones
    let h = 0;
    for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) | 0;
    const usados = Object.values(jugadores).map(j => j.avatar);
    // Buscamos uno no usado a partir del hash, si todos están usados repetimos
    for (let i = 0; i < POOL_AVATARES.length; i++) {
      const idx = (Math.abs(h) + i) % POOL_AVATARES.length;
      if (!usados.includes(POOL_AVATARES[idx].avatar)) return POOL_AVATARES[idx];
    }
    return POOL_AVATARES[Math.abs(h) % POOL_AVATARES.length];
  }

  function obtenerNombreJugador() {
    return localStorage.getItem('nombreJugador') || '';
  }

  function asegurarJugador(nombre) {
    const data = leer();
    if (!data.jugadores[nombre]) {
      const av = pickAvatar(nombre, data.jugadores);
      data.jugadores[nombre] = {
        avatar: av.avatar,
        color: av.color,
        puntos: 0,
        racha: 0,
        ultimoDia: null,
        logros: [],
        modulos: {}
      };
      escribir(data);
    }
    return data;
  }

  function hoyISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function actualizarRacha(jugador) {
    const hoy = hoyISO();
    if (jugador.ultimoDia === hoy) return;
    if (!jugador.ultimoDia) {
      jugador.racha = 1;
    } else {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const ayerISO = ayer.toISOString().slice(0, 10);
      jugador.racha = (jugador.ultimoDia === ayerISO) ? (jugador.racha || 0) + 1 : 1;
    }
    jugador.ultimoDia = hoy;
  }

  // ═════════ API PÚBLICA ═════════

  // Llamar al terminar un módulo. score 0-10, total normalmente 10.
  function guardarResultado(modId, score, total = 10) {
    const nombre = obtenerNombreJugador();
    if (!nombre) return; // No hay jugador, no se guarda

    const data = asegurarJugador(nombre);
    const jugador = data.jugadores[nombre];
    const moduloInfo = CATALOGO_MODULOS.find(m => m.id === modId);
    if (!moduloInfo) return;

    const prev = jugador.modulos[modId] || { score: 0, comp: 0, intentos: 0 };
    const nuevoScore = Math.max(prev.score, score);
    const completado = score >= Math.ceil(total * 0.7) ? 1 : prev.comp;

    jugador.modulos[modId] = {
      score: nuevoScore,
      comp: completado,
      intentos: (prev.intentos || 0) + 1,
      fecha: new Date().toISOString()
    };

    // Puntos: 10 por completar + score, solo la primera vez que mejora
    const gananciaPuntos = (score - (prev.score || 0)) * 10 + (completado && !prev.comp ? 50 : 0);
    if (gananciaPuntos > 0) jugador.puntos += gananciaPuntos;

    actualizarRacha(jugador);

    // Registrar actividad
    data.actividad.unshift({
      alumno: nombre,
      avatar: jugador.avatar,
      color: jugador.color,
      modulo: moduloInfo.nombre,
      icono: moduloInfo.icono,
      puntaje: score,
      total: total,
      fecha: new Date().toISOString()
    });
    if (data.actividad.length > 20) data.actividad.length = 20;

    escribir(data);
  }

  function obtenerDashboard() {
    const data = leer();
    const jugadores = Object.entries(data.jugadores).map(([nombre, j]) => ({
      nombre,
      avatar: j.avatar,
      color: j.color,
      puntos: j.puntos || 0,
      racha: j.racha || 0,
      logros: (j.logros || []).length,
      progreso: CATALOGO_MODULOS.map(m => {
        const p = j.modulos[m.id];
        return { mod: m.id, score: p ? p.score : 0, comp: p ? p.comp : 0 };
      })
    }));

    return {
      jugadores: jugadores.sort((a, b) => b.puntos - a.puntos),
      modulos: CATALOGO_MODULOS.slice(),
      actividad: data.actividad.slice(0, 10),
      hayDatos: jugadores.length > 0
    };
  }

  function resetear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  global.AprendoStorage = {
    guardarResultado,
    obtenerDashboard,
    resetear,
    CATALOGO_MODULOS
  };
})(window);
