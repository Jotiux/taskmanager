// app.js — Módulo principal (punto de entrada, cargado con type="module").
// Etapa 2: se conecta el módulo gestor de localStorage.

import { cargarTareas, existenDatosGuardados } from './storage.js';

console.log('[TaskManager] ¿Hay datos guardados?', existenDatosGuardados());
console.log('[TaskManager] Tareas en localStorage:', cargarTareas().length);
