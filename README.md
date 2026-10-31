# TaskManager · Gestión de tareas offline

Aplicación web de gestión de tareas desarrollada con **JavaScript Vanilla (ES6+)**, sin librerías ni frameworks de JavaScript. Consume la API REST pública **JSONPlaceholder** y guarda todos los datos en el navegador con **localStorage**, por lo que sigue funcionando sin conexión a internet.

- **Asignatura:** Programación de Sistemas Web · Universidad ECOTEC
- **Proyecto:** Proyecto 2 · TaskManager
- **Autor:** John W. Rizzo V. ([@Jotiux](https://github.com/Jotiux))
- **Repositorio:** https://github.com/Jotiux/taskmanager
- **Investigación técnica elegida:** Opción A · Arquitectura Modular ES6 (`import` / `export`)

---

## Funcionalidades

| Módulo | Qué hace | Técnica JS utilizada |
|---|---|---|
| Gestión CRUD | Crear, editar, eliminar y marcar tareas como completadas. Validación estricta de campos vacíos desde JS. | `addEventListener`, delegación de eventos, arreglos de objetos, operador spread |
| Filtros y búsqueda | Filtrar por estado (Todas, Pendientes, Completadas) y buscar por título en tiempo real. | `filter()`, `includes()`, `toLowerCase()`, evento `input` |
| Ordenamiento | Ordenar por fecha de creación o por prioridad (Alta, Media, Baja). | `sort()` con funciones comparadoras |
| Dashboard de métricas | Total de tareas, pendientes, completadas y porcentaje de progreso, en tiempo real. | Actualización reactiva del DOM tras cada cambio |
| Carga inicial desde la API | Si localStorage está vacío, importa las tareas de JSONPlaceholder sin duplicar registros. | `fetch()` + `async/await`, `JSON.stringify()`, `some()` |
| Manejo de errores | Ante un fallo de red o de servidor muestra un aviso visual amigable y la app sigue funcionando. | `try/catch`, `response.ok`, `navigator.onLine` |
| Persistencia local | Todo cambio se guarda en el navegador y se recupera al recargar o sin internet. | `localStorage.setItem()`, `JSON.parse(localStorage.getItem())` |

## Arquitectura modular (Opción A)

El código está separado en módulos ES6 nativos. Cada uno tiene una sola responsabilidad:

```
taskmanager/
├── index.html                 Estructura de la interfaz (carga js/app.js con type="module")
├── css/styles.css             Estilos propios
├── vendor/bootstrap/css/      Bootstrap 5.3.3 (solo CSS, guardado localmente para funcionar offline)
└── js/
    ├── app.js                 Módulo principal: estado, lógica de negocio y eventos
    ├── storage.js             Gestor de localStorage (único módulo que lee/escribe el almacenamiento)
    ├── api.js                 Servicio de la API REST (fetch + async/await)
    └── ui.js                  Capa de interfaz (único módulo que manipula el DOM)
```

```
            ┌──────────────┐
            │    app.js    │  estado + lógica
            └──────┬───────┘
     import  ┌─────┼──────────┐
             ▼     ▼          ▼
     storage.js  api.js     ui.js
   (localStorage) (fetch)   (DOM)
```

`app.js` importa las funciones que necesita de los otros tres módulos (`import { cargarTareas, guardarTareas } from './storage.js'`). Así, cambiar la forma de guardar los datos o la API consultada no obliga a tocar la interfaz, y viceversa.

## Modelo de datos

Cada tarea se guarda en localStorage, bajo la clave `taskmanager.tareas`, como un objeto dentro de un arreglo serializado en JSON:

```json
{
  "id": 1793454420000,
  "title": "Preparar informe final (máximo 3 páginas)",
  "priority": "media",
  "completed": false,
  "createdAt": "2026-10-31T13:47:00.000Z",
  "source": "local"
}
```

- `source` indica el origen: `api` (importada de JSONPlaceholder) o `local` (creada en la app).
- JSONPlaceholder solo entrega `id`, `title` y `completed`. Al importar, la app agrega una prioridad y una fecha de creación para poder filtrar y ordenar.
- Los títulos de las tareas importadas están en pseudolatín ("delectus aut autem"): es el texto de relleno que devuelve la API de pruebas, no un error.
- JSONPlaceholder simula las operaciones POST/PUT/DELETE pero no las guarda, por eso la fuente de verdad de la aplicación es localStorage.

## Cómo ejecutar

Los módulos ES6 **no funcionan abriendo `index.html` con doble clic** (`file://`): el navegador exige que la página se sirva por HTTP.

**Opción 1 · Phoenix Code (usada en el desarrollo)**
1. Abrir la carpeta `taskmanager` en Phoenix Code.
2. Activar la vista previa en vivo (ícono ⚡).
3. Poner la vista previa en **Preview Mode** (flecha junto al ícono del lápiz). En los modos *Highlight* y *Edit*, Phoenix Code intercepta los clics y los botones de la página no responden.

**Opción 2 · Cualquier servidor estático**, por ejemplo con Python:
```
python -m http.server 8080
```
y abrir `http://localhost:8080`.

## Funcionamiento offline

- La primera carga necesita internet para importar las tareas desde la API.
- Después, la app trabaja solo con localStorage: se pueden crear, editar, completar y eliminar tareas sin conexión, y los cambios se mantienen al recargar.
- Bootstrap está guardado dentro del proyecto, así que el diseño no depende de un CDN.
- El encabezado muestra el estado de la conexión (● En línea / ● Sin conexión) y avisa cuando cambia.
- localStorage es propio de cada origen (protocolo + host + puerto): si el servidor local cambia de puerto, el navegador lo trata como otro sitio y la lista empieza vacía.

## Entorno y versiones

| Herramienta | Versión |
|---|---|
| Sistema operativo | Windows 11 versión 25H2 (compilación 26200.9711) |
| Editor | Phoenix Code 5.2 (5.2.5-23290) |
| Control de versiones | GitHub Desktop 3.6.7 (x64), con Git integrado |
| Navegador | Google Chrome 156.0.8078.79 (64 bits) · motor V8 15.6.75.27 |
| Estilos | Bootstrap 5.3.3 (solo CSS, local) |
| API | JSONPlaceholder · https://jsonplaceholder.typicode.com/todos |

## Historial de desarrollo

El proyecto se desarrolló por etapas en dos sesiones (30 y 31 de octubre de 2026). Cada commit agrega una funcionalidad completa y probada:

1. Estructura base HTML, estilos y Bootstrap 5.3.3 local
2. Módulo `storage.js` para persistencia con localStorage
3. Consumo de la API REST con fetch/async-await, carga inicial y manejo de errores
4. CRUD de tareas con validación estricta de campos
5. Filtros por estado y búsqueda dinámica por título
6. Ordenamiento por fecha de creación y prioridad
7. Dashboard de métricas con actualización reactiva
8. Documentación: README y declaración de uso de IA

## Uso de Inteligencia Artificial

El uso de IA durante el desarrollo se declara en [`AI_DECLARATION.md`](AI_DECLARATION.md).
