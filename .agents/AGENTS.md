# Instrucciones del Sistema de Arboricultura — ArborGest

## 🌐 REGLA GENERAL DE COMUNICACIÓN
- **¡¡¡CONTESTAR SIEMPRE EN ESPAÑOL!!!**

## 📖 LECTURA OBLIGATORIA AL INICIAR
Antes de responder cualquier cosa, leer completamente el documento maestro del proyecto:
📄 [`PROJECT_STATE.md`](file:///c:/Users/Personal/Documents/Projecto-Oficina/PROJECT_STATE.md)

Este documento contiene:
- Quiénes somos y para qué institución se trabaja.
- Las Reglas de Oro del usuario (normas de trabajo que NO se pueden violar).
- El protocolo obligatorio de relevo: Casa (Noche) ↔ Oficina (Día).
- La arquitectura completa del sistema (Vue 3, Pinia, Firebase, Firestore, Cloudinary).
- La estructura de la base de datos Firestore y sus colecciones.
- El estado actual del sistema y todos los logros implementados.
- La lista de vistas y componentes del sistema.
- Las tareas pendientes para el siguiente chat.

## 🔄 PROTOCOLO OBLIGATORIO DE RELEVO: CASA (NOCHE) ↔ OFICINA (DÍA)
El desarrollador trabaja en dos entornos con Antigravity IDE: **Oficina (turno día)** y **Casa (turno noche)**.
Para evitar desincronizaciones, ramas divergentes y sobreescrituras en Firebase:

1. 🌅 **AL INICIAR SESIÓN O CLONAR (Paso 0 Automático):**
   - **¡ATENCIÓN SI SE ACABA DE CLONAR!:** Git clona por defecto la rama `main`. El asistente DEBE comprobar la rama con `git branch --show-current`. Si está en `main`, DEBE cambiar automáticamente a la rama activa oficial:
     `git checkout feature-podarapp-sync`
   - Luego comprobar el estado remoto: `git fetch origin` y `git pull origin feature-podarapp-sync`.
   - Saludar a Kevin confirmando que ya está montado en `feature-podarapp-sync` en la versión actual sin que él tenga que recordar ningún comando técnico.

2. 🌿 **REGLA DE RAMA ÚNICA:**
   - Ambas máquinas (casa y oficina) DEBEN trabajar sobre la misma rama activa documentada. Jamás commitear cambios en `main` sin haber integrado la rama de desarrollo activa.

3. 🌙 **AL FINALIZAR CUALQUIER CAMBIO:**
   - Actualizar siempre la versión (`node scripts/update-version.js`).
   - Actualizar `PROJECT_STATE.md` indicando qué se hizo, fecha y qué queda pendiente exacto para la siguiente máquina.
   - Pedir confirmación al usuario para hacer `git commit` y `git push`.
   - Recordar que en producción web (PWA), para ver cambios frescos sin caché vieja de Service Worker, se requiere `Ctrl + Shift + R` o desregistrar el Service Worker en DevTools.

## ⚠️ Tareas Pendientes Inmediatas

### 1. Dashboard (`src/views/DashboardView.vue`)
- **Filtro Temporal:** Cambiar `solicitudesFiltradas` para que el filtro "Histórico" muestre 2023, 2024 y 2025 (hoy bloqueados por `limitDate = '2026-01-01'`).
- **Gráfico "Demanda por Acción":** En `generarDatosGraficos()`, añadir fallback a `s.arboles[0].id_accion_solicitada` cuando `s.id_accion_solicitada` esté vacío.

### 2. Sincronización Bidireccional (Siguiente Fase)
Desarrollar el flujo inverso ArborGest → Google Sheets.

### 3. Imágenes de Campo
Integrar fotos de AppSheet en ArborGest vía Cloudinary CDN.

## 📋 Documentación Adicional
- Conector de sincronización: [`docs/podarapp_sync.md`](file:///c:/Users/Personal/Documents/Projecto-Oficina/docs/podarapp_sync.md)
- Script Apps Script: [`scripts/sync-podarapp.gs`](file:///c:/Users/Personal/Documents/Projecto-Oficina/scripts/sync-podarapp.gs)
