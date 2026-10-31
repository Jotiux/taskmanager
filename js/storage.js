// storage.js — Módulo gestor de localStorage (Web Storage API).
// Es el único módulo que lee o escribe en el almacenamiento del navegador.

const CLAVE_TAREAS = 'taskmanager.tareas';

/**
 * Indica si ya existen datos guardados (aunque sea una lista vacía).
 * Se usa para decidir si hay que importar desde la API en la primera carga.
 */
export function existenDatosGuardados() {
  return localStorage.getItem(CLAVE_TAREAS) !== null;
}

/**
 * Recupera las tareas con JSON.parse(localStorage.getItem()).
 * Si el contenido está dañado o no es un arreglo, devuelve una lista vacía.
 */
export function cargarTareas() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_TAREAS));
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.warn('[TaskManager] Datos de localStorage no válidos. Se reinicia la lista.', error);
    return [];
  }
}

/**
 * Guarda la lista completa serializándola con JSON.stringify().
 */
export function guardarTareas(tareas) {
  localStorage.setItem(CLAVE_TAREAS, JSON.stringify(tareas));
}
