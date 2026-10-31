// app.js — Módulo principal: estado de la aplicación y lógica de negocio.
// Coordina los otros módulos: storage.js (persistencia), api.js (datos remotos) y ui.js (DOM).

import { cargarTareas, guardarTareas, existenDatosGuardados } from './storage.js';
import { obtenerTareasApi } from './api.js';
import * as ui from './ui.js';

/* ---------- Estado ---------- */

const estado = {
  filtro: 'todas',      // todas | pendientes | completadas
  busqueda: '',
  orden: 'fecha-desc',
  tareas: []
};

const PRIORIDADES_VALIDAS = ['alta', 'media', 'baja'];

const PESO_PRIORIDAD = { alta: 3, media: 2, baja: 1 };
const porFecha = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);

// Funciones comparadoras para Array.prototype.sort()
const COMPARADORES = {
  'fecha-desc': (a, b) => porFecha(b, a),
  'fecha-asc': porFecha,
  'prioridad-desc': (a, b) => PESO_PRIORIDAD[b.priority] - PESO_PRIORIDAD[a.priority] || porFecha(b, a),
  'prioridad-asc': (a, b) => PESO_PRIORIDAD[a.priority] - PESO_PRIORIDAD[b.priority] || porFecha(b, a)
};

/* ---------- Render y persistencia ---------- */

function obtenerTareasVisibles() {
  const texto = estado.busqueda.toLowerCase();

  // filter() devuelve un arreglo nuevo, así el orden no altera estado.tareas
  const visibles = estado.tareas
    .filter((tarea) => {
      if (estado.filtro === 'pendientes') return !tarea.completed;
      if (estado.filtro === 'completadas') return tarea.completed;
      return true;
    })
    .filter((tarea) => tarea.title.toLowerCase().includes(texto));

  visibles.sort(COMPARADORES[estado.orden]);
  return visibles;
}

function calcularMetricas(tareas) {
  const total = tareas.length;
  const completadas = tareas.filter((tarea) => tarea.completed).length;
  return {
    total,
    completadas,
    pendientes: total - completadas,
    progreso: total === 0 ? 0 : Math.round((completadas / total) * 100)
  };
}

/** Actualización reactiva: cada cambio de datos vuelve a pintar la lista y el dashboard. */
function renderizar() {
  ui.renderTareas(obtenerTareasVisibles(), estado.tareas.length);
  ui.renderMetricas(calcularMetricas(estado.tareas));
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

/* ---------- CRUD ---------- */

function validarTarea({ titulo, prioridad }) {
  const errores = {};

  if (titulo === '') {
    errores.titulo = 'El título es obligatorio.';
  } else if (titulo.length < 3) {
    errores.titulo = 'El título debe tener al menos 3 caracteres.';
  } else if (titulo.length > 100) {
    errores.titulo = 'El título no puede superar los 100 caracteres.';
  }

  if (prioridad === '') {
    errores.prioridad = 'Selecciona una prioridad.';
  } else if (!PRIORIDADES_VALIDAS.includes(prioridad)) {
    errores.prioridad = 'La prioridad seleccionada no es válida.';
  }

  return errores;
}

function guardarDesdeFormulario(evento) {
  evento.preventDefault();

  const datos = ui.leerFormulario();
  const errores = validarTarea(datos);
  ui.mostrarErrores(errores);
  if (Object.keys(errores).length > 0) return;

  if (datos.id) {
    // Editar: se crea un objeto nuevo con los cambios (spread) y se reemplaza en el arreglo
    const id = Number(datos.id);
    estado.tareas = estado.tareas.map((tarea) =>
      tarea.id === id
        ? { ...tarea, title: datos.titulo, priority: datos.prioridad, updatedAt: new Date().toISOString() }
        : tarea
    );
    ui.mostrarNotificacion('Tarea actualizada correctamente.', 'success');
  } else {
    // Crear
    const nueva = {
      id: Date.now(),
      title: datos.titulo,
      priority: datos.prioridad,
      completed: false,
      createdAt: new Date().toISOString(),
      source: 'local'
    };
    estado.tareas = [...estado.tareas, nueva];
    ui.mostrarNotificacion('Tarea creada y guardada en localStorage.', 'success');
  }

  persistirYRenderizar();
  ui.limpiarFormulario();
}

function alternarCompletada(id) {
  estado.tareas = estado.tareas.map((tarea) =>
    tarea.id === id ? { ...tarea, completed: !tarea.completed } : tarea
  );
  persistirYRenderizar();
}

function editarTarea(id) {
  const tarea = estado.tareas.find((t) => t.id === id);
  if (tarea) ui.cargarEnFormulario(tarea);
}

function eliminarTarea(id) {
  const tarea = estado.tareas.find((t) => t.id === id);
  if (!tarea || !confirm(`¿Eliminar la tarea "${tarea.title}"?`)) return;

  estado.tareas = estado.tareas.filter((t) => t.id !== id);
  persistirYRenderizar();

  if (Number(ui.elementos.tareaId.value) === id) ui.limpiarFormulario();
  ui.mostrarNotificacion('Tarea eliminada.', 'warning');
}

/** Delegación de eventos: un solo listener en la lista atiende los botones de todas las tareas. */
function manejarClickLista(evento) {
  const item = evento.target.closest('.task-item');
  if (!item) return;
  const id = Number(item.dataset.id);

  if (evento.target.closest('.btn-editar')) editarTarea(id);
  else if (evento.target.closest('.btn-eliminar')) eliminarTarea(id);
}

function manejarCambioLista(evento) {
  if (!evento.target.matches('.task-check')) return;
  alternarCompletada(Number(evento.target.closest('.task-item').dataset.id));
}

/* ---------- Eventos e inicio ---------- */

function registrarEventos() {
  const { elementos } = ui;

  elementos.btnSincronizar.addEventListener('click', importarDesdeApi);

  elementos.form.addEventListener('submit', guardarDesdeFormulario);
  elementos.btnCancelar.addEventListener('click', ui.limpiarFormulario);
  elementos.lista.addEventListener('click', manejarClickLista);
  elementos.lista.addEventListener('change', manejarCambioLista);

  // Búsqueda dinámica en tiempo real (cada tecla)
  elementos.busqueda.addEventListener('input', (evento) => {
    estado.busqueda = evento.target.value.trim();
    renderizar();
  });

  elementos.filtros.forEach((radio) =>
    radio.addEventListener('change', (evento) => {
      estado.filtro = evento.target.value;
      renderizar();
    })
  );

  elementos.orden.addEventListener('change', (evento) => {
    estado.orden = evento.target.value;
    renderizar();
  });

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
