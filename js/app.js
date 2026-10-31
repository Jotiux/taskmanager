// app.js — Módulo principal: estado de la aplicación y lógica de negocio.
// Coordina los otros módulos: storage.js (persistencia), api.js (datos remotos) y ui.js (DOM).

import { cargarTareas, guardarTareas, existenDatosGuardados } from './storage.js';
import { obtenerTareasApi } from './api.js';
import * as ui from './ui.js';

/* ---------- Estado ---------- */

const estado = {
  tareas: []
};

/* ---------- Render y persistencia ---------- */

function obtenerTareasVisibles() {
  const visibles = [...estado.tareas];
  return visibles;
}

/** Actualización reactiva: cada cambio de datos vuelve a pintar la lista y el dashboard. */
function renderizar() {
  ui.renderTareas(obtenerTareasVisibles(), estado.tareas.length);
}

function persistirYRenderizar() {
  guardarTareas(estado.tareas);
  renderizar();
}

/* ---------- API ---------- */

/**
 * Importa desde JSONPlaceholder sin duplicar: solo agrega ids que aún no existen.
 * try/catch captura fallos de red o de servidor y avisa al usuario.
 */
async function importarDesdeApi() {
  ui.indicarCargaApi(true);
  try {
    const tareasApi = await obtenerTareasApi();
    // Solo se agregan las tareas cuyo id todavía no existe (evita duplicados)
    const nuevas = tareasApi.filter(
      (tareaApi) => !estado.tareas.some((tarea) => tarea.id === tareaApi.id)
    );

    estado.tareas = [...estado.tareas, ...nuevas];
    persistirYRenderizar();

    ui.mostrarNotificacion(
      nuevas.length > 0
        ? `Se importaron ${nuevas.length} tareas desde la API y se guardaron en localStorage.`
        : 'No hay tareas nuevas: las de la API ya estaban guardadas (sin duplicados).',
      'success'
    );
  } catch (error) {
    console.error('[TaskManager] Error al consultar la API:', error);
    ui.mostrarNotificacion(mensajeErrorAmigable(error), 'danger', 0);
  } finally {
    ui.indicarCargaApi(false);
  }
}

function mensajeErrorAmigable(error) {
  if (!navigator.onLine) {
    return 'Sin conexión a internet: no se pudo consultar la API. Tus tareas guardadas siguen disponibles.';
  }
  return `No se pudieron cargar las tareas de la API (${error.message}). Puedes seguir trabajando con tus tareas locales.`;
}

/* ---------- Eventos e inicio ---------- */

function registrarEventos() {
  const { elementos } = ui;

  elementos.btnSincronizar.addEventListener('click', importarDesdeApi);

  window.addEventListener('online', () => {
    ui.actualizarEstadoConexion();
    ui.mostrarNotificacion('Conexión restablecida.', 'success');
  });
  window.addEventListener('offline', () => {
    ui.actualizarEstadoConexion();
    ui.mostrarNotificacion('Sin conexión: sigues trabajando con los datos guardados en tu navegador.', 'warning');
  });
}

function iniciar() {
  registrarEventos();
  ui.actualizarEstadoConexion();

  if (existenDatosGuardados()) {
    // Ya hay datos: se trabaja con localStorage (funciona sin internet)
    estado.tareas = cargarTareas();
    renderizar();
    ui.mostrarNotificacion(`Se cargaron ${estado.tareas.length} tareas desde localStorage.`, 'info');
  } else {
    // Primera vez (localStorage vacío): se importan las tareas de la API
    renderizar();
    importarDesdeApi();
  }
}

iniciar();
