// ui.js — Capa de interfaz visual (DOM).
// Todo acceso a document.* vive aquí; app.js nunca toca el DOM directamente.

const $ = (id) => document.getElementById(id);

export const elementos = {
  form: $('formTarea'),
  tareaId: $('tareaId'),
  titulo: $('titulo'),
  prioridad: $('prioridad'),
  tituloFormulario: $('tituloFormulario'),
  btnGuardar: $('btnGuardar'),
  btnCancelar: $('btnCancelar'),
  lista: $('listaTareas'),
  estadoVacio: $('estadoVacio'),
  resumenLista: $('resumenLista'),
  busqueda: $('busqueda'),
  orden: $('orden'),
  filtros: document.querySelectorAll('input[name="filtro"]'),
  btnSincronizar: $('btnSincronizar'),
  notificacion: $('notificacion'),
  metricTotal: $('metricTotal'),
  metricPendientes: $('metricPendientes'),
  metricCompletadas: $('metricCompletadas'),
  metricProgreso: $('metricProgreso'),
  barraProgreso: $('barraProgreso'),
  contenedorProgreso: $('contenedorProgreso'),
  estadoConexion: $('estadoConexion')
};

const ETIQUETAS_PRIORIDAD = { alta: 'Alta', media: 'Media', baja: 'Baja' };
let temporizadorNotificacion;

/**
 * Dibuja la lista de tareas.
 * Se usa textContent (nunca innerHTML con datos) para que el texto del usuario no se interprete como HTML.
 */
export function renderTareas(tareas, totalGeneral) {
  const { lista, estadoVacio, resumenLista } = elementos;

  lista.innerHTML = ''; // vaciar la lista antes de volver a dibujarla
  tareas.forEach((tarea) => {
    lista.append(crearElementoTarea(tarea));
  });

  estadoVacio.hidden = tareas.length > 0;
  resumenLista.textContent = `Mostrando ${tareas.length} de ${totalGeneral} tareas`;
}

/** Construye el <li> de una tarea con document.createElement(). */
function crearElementoTarea(tarea) {
  const item = document.createElement('li');
  item.className = 'task-item';
  item.dataset.id = tarea.id;
  if (tarea.completed) {
    item.classList.add('is-completed');
  }

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'form-check-input task-check';
  check.checked = tarea.completed;
  check.setAttribute('aria-label', `Marcar "${tarea.title}" como ${tarea.completed ? 'pendiente' : 'completada'}`);

  const titulo = document.createElement('p');
  titulo.className = 'task-title';
  titulo.textContent = tarea.title;

  const prioridad = document.createElement('span');
  prioridad.className = `task-priority priority-${tarea.priority}`;
  prioridad.textContent = ETIQUETAS_PRIORIDAD[tarea.priority] ?? tarea.priority;

  const fecha = document.createElement('span');
  fecha.className = 'task-date';
  fecha.textContent = new Date(tarea.createdAt).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });

  const origen = document.createElement('span');
  origen.className = 'task-source';
  origen.textContent = tarea.source === 'api' ? 'API' : 'Local';

  const meta = document.createElement('div');
  meta.className = 'task-meta';
  meta.append(prioridad, fecha, origen);

  const cuerpo = document.createElement('div');
  cuerpo.className = 'task-body';
  cuerpo.append(titulo, meta);

  const acciones = document.createElement('div');
  acciones.className = 'task-actions';
  acciones.append(
    crearBoton('Editar', 'btn-outline-secondary btn-editar'),
    crearBoton('Eliminar', 'btn-outline-danger btn-eliminar')
  );

  item.append(check, cuerpo, acciones);
  return item;
}

function crearBoton(texto, clases) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = `btn btn-sm ${clases}`;
  boton.textContent = texto;
  return boton;
}

/** Actualiza las tarjetas del dashboard con las métricas calculadas en app.js. */
export function renderMetricas({ total, pendientes, completadas, progreso }) {
  elementos.metricTotal.textContent = total;
  elementos.metricPendientes.textContent = pendientes;
  elementos.metricCompletadas.textContent = completadas;
  elementos.metricProgreso.textContent = `${progreso}%`;
  elementos.barraProgreso.style.width = `${progreso}%`;
  elementos.contenedorProgreso.setAttribute('aria-valuenow', String(progreso));
}

/**
 * Muestra una notificación amigable. tipo: success | info | warning | danger.
 * duracion = 0 deja el mensaje visible hasta la siguiente notificación.
 */
export function mostrarNotificacion(mensaje, tipo = 'info', duracion = 4000) {
  const { notificacion } = elementos;
  clearTimeout(temporizadorNotificacion);
  notificacion.className = `alert alert-${tipo}`;
  notificacion.textContent = mensaje;
  notificacion.hidden = false;

  if (duracion > 0) {
    temporizadorNotificacion = setTimeout(() => { notificacion.hidden = true; }, duracion);
  }
}

/** Refleja en el encabezado si el navegador tiene conexión. */
export function actualizarEstadoConexion() {
  const enLinea = navigator.onLine;
  const { estadoConexion } = elementos;
  estadoConexion.textContent = enLinea ? '● En línea' : '● Sin conexión (modo offline)';
  estadoConexion.classList.toggle('is-online', enLinea);
  estadoConexion.classList.toggle('is-offline', !enLinea);
}

/** Bloquea el botón de importación mientras se espera la respuesta de la API. */
export function indicarCargaApi(cargando) {
  elementos.btnSincronizar.disabled = cargando;
  elementos.btnSincronizar.textContent = cargando ? 'Consultando API…' : 'Importar desde API';
}

/* ---------- Formulario ---------- */

export function leerFormulario() {
  return {
    id: elementos.tareaId.value,
    titulo: elementos.titulo.value.trim(),
    prioridad: elementos.prioridad.value
  };
}

/**
 * Pinta los mensajes de validación con el mismo patrón visto en clase:
 * textContent + clases is-invalid / is-valid de Bootstrap + aria-invalid.
 */
export function mostrarErrores(errores) {
  ['titulo', 'prioridad'].forEach((campo) => {
    const mensaje = errores[campo] ?? '';
    const tieneError = mensaje !== '';
    const control = elementos[campo];

    $(`error-${campo}`).textContent = mensaje;
    control.classList.toggle('is-invalid', tieneError);
    control.classList.toggle('is-valid', !tieneError);
    control.setAttribute('aria-invalid', String(tieneError));
  });

  const primerCampoConError = Object.keys(errores)[0];
  if (primerCampoConError) {
    elementos[primerCampoConError].focus();
  }
}

export function cargarEnFormulario(tarea) {
  elementos.tareaId.value = tarea.id;
  elementos.titulo.value = tarea.title;
  elementos.prioridad.value = tarea.priority;
  elementos.tituloFormulario.textContent = 'Editar tarea';
  elementos.btnGuardar.textContent = 'Actualizar tarea';
  elementos.btnCancelar.hidden = false;
  elementos.titulo.focus();
}

export function limpiarFormulario() {
  elementos.form.reset();
  elementos.tareaId.value = '';
  ['titulo', 'prioridad'].forEach((campo) => {
    elementos[campo].classList.remove('is-invalid', 'is-valid');
    elementos[campo].removeAttribute('aria-invalid');
    $(`error-${campo}`).textContent = '';
  });
  elementos.tituloFormulario.textContent = 'Nueva tarea';
  elementos.btnGuardar.textContent = 'Guardar tarea';
  elementos.btnCancelar.hidden = true;
}
