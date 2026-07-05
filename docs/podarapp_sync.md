# 📖 Guía de Sincronización PodarApp - ArborGest (Apps Script & Firestore)
Este documento sirve como referencia completa para desarrolladores y agentes de IA sobre el sistema de sincronización unidireccional y las reglas operativas de ArborGest.

---

## 🛠️ Arquitectura de Sincronización
La sincronización se realiza de manera **unidireccional** desde **PodarApp (Google Sheets / AppSheet)** hacia **ArborGest (Firebase Firestore)**.

*   **Script Conector:** Ubicado en [`scripts/sync-podarapp.gs`](file:///c:/Users/Personal/Documents/Projecto-Oficina/scripts/sync-podarapp.gs). Debe pegarse en el Apps Script de la hoja de cálculo de PodarApp.
*   **Frecuencia:** Automatizado mediante un Disparador de tiempo (Trigger) en Apps Script cada **5 minutos** (Temporizador de minutos).
*   **Seguridad:** Las credenciales de la Cuenta de Servicio se guardan en las **Propiedades del Script** en la consola de Google:
    *   `SA_CLIENT_EMAIL`: Email de la cuenta de servicio de Firebase.
    *   `SA_PRIVATE_KEY`: Clave privada de Firebase con el formato PEM completo.
    *   `FIRESTORE_PROJECT`: `sistema-arboricultura-tarija`

### ⚡ Optimización por Lotes (Batch) en Memoria
Para evitar exceder el límite diario de peticiones de Google y los 6 minutos de timeout, el script:
1.  Descarga la colección completa `solicitudes` de Firestore en una sola petición paginada al inicio de la ejecución.
2.  Cruza y busca las coincidencias en memoria usando la columna `Comunicacion interna`.
3.  Compara los campos clave. Si no hay diferencias con lo que ya está en Firestore, retorna `SIN_CAMBIOS` y **no realiza escrituras**.
4.  Fuerza la actualización si el documento en Firestore carece del campo `createdAt` (marca de tiempo indispensable para que la UI de ArborGest lo muestre).

---

## 🗺️ Reglas de Mapeo de Datos (Resolución por Capas)
Los catálogos no son colecciones individuales en Firestore. Se almacenan como documentos individuales dentro del contenedor `catalogos/` (ej: `catalogos/barrios`, `catalogos/especies`, `catalogos/acciones`) y en la colección `personal` para los técnicos.

### 🏠 Resolución de Barrios y Distritos
1.  **Capa 1 (Exacta):** Busca coincidencia normalizada de nombre y distrito en el catálogo de barrios.
2.  **Capa 1b (Nombre):** Si el distrito no coincide pero el nombre sí, resuelve el barrio y emite una advertencia.
3.  **Capa 2 (Parcial):** Coincidencia parcial (subcadena) entre nombres.
4.  **Capa 3 (Fallback):** Si no hay coincidencia, guarda `id_barrio` como `null` y escribe el nombre original en el campo plano `barrio_texto_podar` para evitar pérdida de información.

---

## 🎨 Cambios en la UI de ArborGest
Se modificó [`src/components/SolicitudModal.vue`](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/components/SolicitudModal.vue) para incluir:
*   **`verificado` (booleano en raíz):** Indica si el técnico verificó la solicitud en campo. Se muestra como un toggle en la Sección 03 de la UI.
*   **`realizado` (booleano en cada árbol):** Indica si un árbol individual ya fue intervenido. Se inicializa en `false` por defecto.

---

## ⏳ Tareas Pendientes para Siguiente Fase

### 1. Ajustes en el Dashboard (`src/views/DashboardView.vue`)
*   **Filtro de Fecha:** Actualmente está hardcodeado a `2026-01-01` en la computada `solicitudesFiltradas`. Debe cambiarse para que cuando se seleccione "Histórico (todo)" no filtre por año y permita ver el historial de 2023, 2024 y 2025.
*   **Gráfico "Demanda por Acción":** No se renderiza para registros de PodarApp porque busca la acción en la raíz (`s.id_accion_solicitada`). Debe ajustarse para tomar `s.arboles[0].id_accion_solicitada` como fallback.

### 2. Sincronización Bidireccional
Pendiente el desarrollo del flujo inverso (ArborGest → PodarApp) para actualizar cambios realizados desde ArborGest hacia el Google Sheets.

### 3. Gestión de Imágenes
Explorar la exportación e integración de imágenes cargadas en AppSheet para visualizarlas en ArborGest, posiblemente vía Cloudinary CDN.
