# Instrucciones del Sistema de Arboricultura y Sincronización PodarApp

## 📋 Resumen del Estado de la Sincronización
La sincronización unidireccional **PodarApp (Sheets) → ArborGest (Firestore)** está implementada y activa. 
*   El script conector optimizado se encuentra en [`scripts/sync-podarapp.gs`](file:///c:/Users/Personal/Documents/Projecto-Oficina/scripts/sync-podarapp.gs) y se ejecuta mediante un disparador automático cada 5 minutos.
*   Toda la documentación detallada del conector, mapeo de barrios, distritos y UI está en [`docs/podarapp_sync.md`](file:///c:/Users/Personal/Documents/Projecto-Oficina/docs/podarapp_sync.md).

## ⚠️ Tareas Pendientes para el Siguiente Chat

### 1. Modificaciones en el Dashboard (`src/views/DashboardView.vue`)
*   **Filtro Temporal:** Cambiar el filtro computado `solicitudesFiltradas` para permitir visualizar el histórico de 2023, 2024 y 2025 (actualmente bloqueado por la constante `limitDate = 2026-01-01`).
*   **Gráfico "Demanda por Acción":** Implementar la búsqueda recursiva dentro del arreglo de árboles (`s.arboles[0].id_accion_solicitada`) cuando la solicitud carezca de acción en la raíz (`s.id_accion_solicitada`), solucionando la falta de barras de datos para los registros sincronizados.

### 2. Bidireccionalidad (Siguiente Fase)
*   Desarrollar el flujo inverso (ArborGest → Google Sheets) para sincronizar las ediciones.

### 3. Imágenes
*   Integrar las fotos de campo en ArborGest a través del CDN Cloudinary.
