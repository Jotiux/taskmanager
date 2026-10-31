// api.js — Servicio de consumo de la API REST pública JSONPlaceholder.
// Solo se encarga de pedir los datos y adaptarlos al formato de la app.

const URL_API = 'https://jsonplaceholder.typicode.com/todos?_limit=20';
const PRIORIDADES = ['alta', 'media', 'baja'];

/**
 * Consulta las tareas con fetch() + async/await.
 * Lanza un Error si hay fallo de red o si el servidor responde con un código distinto de 2xx.
 * El manejo del error (try/catch y notificación) lo hace quien llama: app.js.
 */
export async function obtenerTareasApi() {
  const respuesta = await fetch(URL_API);

  if (!respuesta.ok) {
    throw new Error(`el servidor respondió con el código ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  return datos.map(adaptarTarea);
}

/**
 * JSONPlaceholder solo devuelve { userId, id, title, completed }.
 * Se completa con prioridad y fecha de creación para poder filtrar y ordenar.
 */
function adaptarTarea(todo) {
  const unaHora = 60 * 60 * 1000;
  return {
    id: todo.id,
    title: todo.title,
    priority: PRIORIDADES[todo.id % PRIORIDADES.length],
    completed: todo.completed,
    createdAt: new Date(Date.now() - todo.id * unaHora).toISOString(),
    source: 'api'
  };
}
