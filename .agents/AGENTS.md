# Instrucciones del Sistema de Arboricultura — ArborGest

## 📖 LECTURA OBLIGATORIA AL INICIAR
Antes de responder cualquier cosa, leer completamente el documento maestro del proyecto:
📄 [`PROJECT_STATE.md`](file:///c:/Users/Personal/Documents/Projecto-Oficina/PROJECT_STATE.md)

Este documento contiene:
- Quiénes somos y para qué institución se trabaja.
- Las Reglas de Oro del usuario (normas de trabajo que NO se pueden violar).
- La arquitectura completa del sistema (Vue 3, Pinia, Firebase, Firestore, Cloudinary).
- La estructura de la base de datos Firestore y sus colecciones.
- El estado actual del sistema y todos los logros implementados.
- La lista de vistas y componentes del sistema.
- Las tareas pendientes para el siguiente chat.

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
