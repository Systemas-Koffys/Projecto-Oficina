# 🌳 ArborGest — Manual Maestro de Traspaso & Estado del Proyecto

> **DOCUMENTO MAESTRO DE CONTINUIDAD PARA EL SIGUIENTE ASISTENTE IA DE CÓDIGO**
> **Fecha de Actualización:** 13 de Agosto de 2026
> **Versión Actual:** `v3.28.8` (Desarrollo en rama `feature-podarapp-sync`)
> **Institución:** Gobierno Autónomo Municipal de Tarija (G.A.M.T.)
> **Dependencia Oficial:** Dirección de Obras Públicas Municipales de Tarija • Unidad de Mantenimiento de Ornato Público • Área de Arboricultura

---

## 🛑 REGLAS ESTRICTAS DE TRABAJO Y METODOLOGÍA DEL USUARIO ("REGLAS DE ORO")

El usuario sigue una metodología rigurosa de desarrollo y control. **El asistente DEBE respetar estas reglas sin excepción:**

1. ⚠️ **"NO TOCAR SIN AVISARME" (Consultar y explicar antes de codificar):**
   - Jamás modificar arquitectura, archivos de configuración (`firebase.json`, `vite.config.js`), lógica de autenticación ni estructuras de la base de datos sin explicar el plan técnico detallado en español sencillo.
   - **Explicar Efectos Colaterales:** Antes de cualquier cambio, advertir qué archivos se tocarán y todos los posibles efectos secundarios.
   - Presentar el plan al usuario y **esperar su autorización explícita ("dale", "ok", "adelante")** antes de modificar código.

2. 🚫 **PROHIBIDO INICIAR EL NAVEGADOR AUTOMATIZADO (`browser_subagent`):**
   - Está **estrictamente prohibido** invocar `browser_subagent` por iniciativa propia. Solo se usará si el usuario lo solicita explícitamente.

3. 🛑 **CONTROL DE GIT Y COMMITS RESPONSABLES:**
   - No realizar commits o pushes de manera apresurada. Asegurarse de que el código esté 100% verificado antes de confirmar.

4. 🔢 **Sistema Dinámico de Control de Versión (`update-version.js`):**
   - Cada `npm run build` o commit ejecuta `node scripts/update-version.js` (`prebuild` hook).
   - This script calcula la versión `v3.minor.patch` leyendo el conteo de commits de Git y actualiza `package.json`.
   - Al confirmar cambios, siempre mencionar la versión generada.

5. 💼 **Jerarquía de Cargos Institucionales Únicos:**
   - `Responsable de Área`, `Jefe de Unidad` y `Técnico de sistemas` son cargos únicos (máx 1 persona activa por cargo).
   - Las firmas en PDFs se calculan dinámicamente desde `mainStore.js`. **Nunca hardcodear nombres de funcionarios.**

6. 🛡️ **Estándar Firebase Modular SDK v9+:**
   - Usar funciones modulares como `deleteApp(app)` de `'firebase/app'` (evitar `app.delete()`).
   - En `updateCatalogo`, siempre hacer *merge* con `existingData` para evitar sobreescribir campos con `undefined`.

---

## 🛠️ ARQUITECTURA TÉCNICA E INFRAESTRUCTURA COMPLETA

- **Framework Frontend:** Vue 3 (Composition API `<script setup>`), Vue Router (`src/router/index.js`), Vite.
- **Estado Global:** Pinia Store (`src/store/mainStore.js`).
- **Diseño & UI:** Vanilla CSS + Tailwind CSS utilities (`src/style.css`), Lucide Vue Icons, Leaflet.js (mapas), Chart.js (gráficos analíticos).
- **Nube e Infraestructura:**
  - **Firebase Hosting & GitHub Actions:** Despliegue automático al hacer push a la rama `main` en GitHub (`Systemas-Koffys/Projecto-Oficina`).
  - **Firebase Firestore:** Base de datos NoSQL en tiempo real con persistencia offline en IndexedDB.
  - **Firebase Auth:** Autenticación con email/password con verificación previa contra el directorio en `personal`.
  - **Cloudinary CDN:** Imágenes de árboles y perfiles, comprimidas vía Canvas (máx 1200x1200px, 82% JPEG) antes de subir vía API REST. Hay fallback a Base64 en Firestore si Cloudinary falla.
  - **Google Apps Script:** Script conector para la sincronización bidireccional (ver sección siguiente).
  - **Web App URL configurada:** `https://script.google.com/macros/s/AKfycbxKIwaAbJjGRMTpng7166ObNvivYamXAe0dUk-ubSx2KJmWOZNu_Q5GhnwCUIajqv32/exec` (definida en `.env` y fallback en store).

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS FIRESTORE (COLECCIONES)

1. `personal`: Directorio de funcionarios municipales (roles: `ROOT`, `ADMIN`, `TECNICO`, `USER`).
2. `solicitudes`: Expedientes de trámites de poda/tala/emergencias (estados: `En espera`, `Terminado`).
3. `catalogos`: Documentos maestros (`barrios`, `distritos`, `especies`, `acciones`, `tipos_institucion`, `instituciones`). **No son colecciones propias, sino documentos dentro de la colección `catalogos`** con un campo `items[]`.
4. `config`: Metadata global del sistema (`docId: 'sistema'` con logos institucionales).
5. `auditoria`: Caja Negra inmutable de todas las acciones (`CREAR`, `MODIFICAR`, `ELIMINAR`).
6. `impresiones`: Historial de reportes impresos con snapshot de filtros.
7. `calendario`: Programación e hitos de trabajos en barrios.

---

## 🔑 DATOS CLAVE SOBRE `solicitudes` (Trámites)

- **Llave Primaria:** El campo `comunicacion_interna` es el ID único inamovible. El `docId` en Firestore se deriva como `podar_{codigo/año}` (remplazando barras por guiones) ➡️ `podar_1285-25`.
- **Estados válidos:** `"En espera"` (pendiente), `"Terminado"` (ejecutado).
- **Campo `createdAt`:** Debe ser un `Timestamp` real de Firestore para que el listener en tiempo real de `mainStore.js` (que ordena por `createdAt DESC`) muestre el documento.
- **Campo `_fuente_sync`:** `"podarapp"` para los registros sincronizados desde Google Sheets. Los creados localmente en ArborGest no tienen este campo, a menos que se les asigne un código de comunicación interna válido.
- **Árboles múltiples:** Se almacenan en un array `arboles[]` dentro de cada solicitud. Cada árbol tiene `id_especie`, `id_accion_solicitada`, `id_accion_realizar`, `observaciones_arbol`, `url_foto`, `realizado` (bool).
- **GPS:** Los campos `lat` y `lng` son números de doble precisión.

---

## 🔄 SINCRONIZACIÓN BIDIRECCIONAL (ESTADO Y LOGROS)

La integración entre **PodarApp (Google Sheets / AppSheet)** y **ArborGest (Firebase Firestore)** cuenta con los siguientes logros implementados en desarrollo:

### 1. Eliminación Bidireccional:
*   Si se borra en ArborGest, se envía un `POST` al Web App para eliminar la fila en `basededatos` y sus respectivos registros en `DetalleDeArboles`.
*   Si se borra una fila en Google Sheets, el temporizador Apps Script detecta que la solicitud ya no existe en el Excel y la elimina de Firestore.
*   **Periodo de Gracia:** Para evitar borrados por lentitud de red, el Apps Script no eliminará de Firestore ningún documento que tenga menos de **30 minutos** de haber sido creado.

### 2. Creación Bidireccional:
*   Si se crea un trámite en ArborGest con comunicación interna, se normaliza el código (removiendo prefijos como `"Cod "`), se marca como `_fuente_sync = 'podarapp'` y se envía un `POST` al Web App para insertar la fila en `basededatos` y sus detalles en `DetalleDeArboles`.

### 3. Estandarización de Códigos:
*   Los códigos ingresados se limpian a través de `normalizarComunicacionInterna(str)`, dejando estructuras puras (ej: `"954/26"`) útiles para sincronización libre de duplicados tipográficos.

### 4. ⚡ Optimización del Consumo de Lecturas (Structured Query):
*   El script periódico de Apps Script se modificó en `cargarTodasLasSolicitudes(token)` para consultar a Firestore mediante **`runQuery` (POST)** en lugar de listar toda la colección.
*   Filtra únicamente los registros donde `_fuente_sync == 'podarapp'`, reduciendo las lecturas diarias de **~247,000 lecturas** (con triggers cada 30 min) a **~7,100 lecturas diarias** (ahorro del 83%).

### 5. 🏷️ Gestión de Usuarios, Barrios y Búsqueda Universal (v3.28.6):
*   **Directorio de Usuarios:** Refinado `store.usuarios` en `mainStore.js` para listar exclusivamente las 2 cuentas de sistema (`ROOT`/`ADMIN`) en `UsuariosView.vue`, separadas de los 27 funcionarios de campo en `PersonalView.vue`.
*   **Visualización de Dirección:** Separadas las filas de `Calle / Avenida` y `Nº de Casa` en los modales de detalle (`SolicitudesView.vue`, `HistorialView.vue`, `MapaView.vue`) y reportes impresos.
*   **Búsqueda e Interpretación Inteligente de Barrios:** Implementada normalización de texto insensible a mayúsculas, minúsculas, tildes y espacios (`normalizarTexto`) en `getBarrio` y `getDistritoByBarrio`.
*   **Asistente de Catálogos y Auto-Vinculación Masiva:** Añadida la caja detectora de barrios no registrados en `ConfiguracionesView.vue` y la función `vincularBarriosMasivosEnFirestore()` en `mainStore.js` con el botón **`[🔗 Vincular Trámites en Base de Datos]`**.
*   **Búsqueda General Ampliada:** Actualizado `filtroBusqueda` en `SolicitudesView.vue` e `HistorialView.vue` para buscar en **TODOS** los campos del expediente (Barrio, Distrito, Especie, Teléfono, Descripción y Códigos).

---

## 🖥️ VISTAS Y COMPONENTES DEL SISTEMA

| Archivo | Descripción |
|---|---|
| `src/views/LoginView.vue` | Pantalla de inicio de sesión con Firebase Auth |
| `src/views/DashboardView.vue` | Panel de control con stats, gráficos Chart.js y filtros temporales |
| `src/views/SolicitudesView.vue` | Lista de solicitudes pendientes (En espera) con filtros y mapa |
| `src/views/HistorialView.vue` | Historial de solicitudes terminadas con filtros avanzados y exportación Excel |
| `src/views/MapaView.vue` | Mapa Leaflet.js de solicitudes con marcadores de pines vectoriales |
| `src/views/ReportesView.vue` | Centro de reportes: hojas de ruta e impresiones por grupo/técnico |
| `src/views/CalendarioView.vue` | Agenda de trabajos programados |
| `src/views/PersonalView.vue` | Directorio de funcionarios, cargos y fichas técnicas |
| `src/views/EquiposView.vue` | Equipos operativos con drag & drop |
| `src/views/InventarioView.vue` | Inventario completo (activos, consumibles, movimientos, mantenimientos) |
| `src/views/ConfiguracionesView.vue` | Catálogos, logos, configuración del sistema |
| `src/views/AuditoriaView.vue` | Caja negra de actividad (solo ROOT) |
| `src/views/PublicPortalView.vue` | Portal ciudadano público para seguimiento de trámites |
| `src/views/AcercaDeView.vue` | Acerca de, versión y créditos del sistema |
| `src/components/SolicitudModal.vue` | Modal principal de creación/edición de solicitudes |
| `src/store/mainStore.js` | Store Pinia central: auth, listeners Firestore, catálogos, CRUD |

---

## ⚠️ TAREAS PENDIENTES (SIGUIENTE CHAT)

### 1. 🔍 Depuración de la Sincronización de Edición (ArborGest ➡️ Google Sheets)
*   **Síntoma:** Al editar una solicitud en ArborGest (ej. modificar el nombre del solicitante), el cambio no se actualiza en la planilla de Google Sheets.
*   **Análisis Técnico Realizado:**
    *   Corregimos `updateSolicitud` en [`mainStore.js`](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/store/mainStore.js) para que busque la solicitud previa usando su `id` de documento (que es inmutable) en lugar del código de comunicación interna.
    *   Se implementó la fusión de datos (`const mergedData = { ...existing, ...updates }`) antes de llamar al webhook para que viajen todos los campos y no solo los editados.
    *   Mapeamos en el payload de `syncRetornoPodarApp` y en la función `actualizarFilaEnHoja` en [`sync-podarapp.gs`](file:///c:/Users/Personal/Documents/Projecto-Oficina/scripts/sync-podarapp.gs) todos los campos restantes (Solicitante, Teléfono, Barrio, Distrito, Calles, N° de Casa, Referencias, GPS y datos institucionales).
    *   **Punto a Investigar:** A pesar de tener el código mapeado, el cambio no está impactando el Excel. El siguiente asistente debe depurar la llamada `fetch(url, ...)` en `syncRetornoPodarApp` para ver si la petición está siendo bloqueada por políticas de CORS en el navegador, si la URL no está respondiendo correctamente, o si el Web App del Apps Script arroja algún fallo interno al ejecutar `actualizarFilaEnHoja(comInt, data)`.
    *   *Nota:* Al ejecutar manualmente el script Apps Script `syncPodarAppToFirestore`, el cambio en Firestore es sobreescrito por el valor viejo del Excel, por lo que es vital corregir el retorno antes de ejecutar pruebas manuales repetidas.

### 2. Ajustes en el Dashboard (`src/views/DashboardView.vue`)
*   **Filtro de Fecha Histórico:** La computada `solicitudesFiltradas` tiene hardcodeado `limitDate = '2026-01-01'`. Esto impide que el filtro "Histórico" muestre datos de 2023, 2024 y 2025. Debe quitarse el límite cuando el filtro sea `'todo'`.
*   **Gráfico "Demanda por Acción":** En `generarDatosGraficos()`, el gráfico busca `s.id_accion_solicitada` en la raíz. Los registros de PodarApp guardan la acción en `s.arboles[0].id_accion_solicitada`. Añadir el mismo fallback que ya tiene la lista lateral `accionesPendientes`.

### 3. Integración de Imágenes de Campo
*   Las fotos de AppSheet se guardan como rutas relativas en Google Drive (ej: `basededatos_Images/foto.jpg`). Desarrollar la lógica para publicarlas o migrarlas a Cloudinary para visualizarlas en ArborGest.

---

## 📋 NORMAS DE IMPRESIÓN Y DISEÑO

1. **Membrete Oficial Estandarizado (4 líneas):**
   - *Gobierno Autónomo Municipal de Tarija*
   - *Dirección de Obras Públicas Municipales de Tarija*
   - *Unidad de Mantenimiento de Ornato Público*
   - *Área de Arboricultura*
2. **Firmas Dinámicas:** Leen `responsableArea` y `jefeUnidad` del store. Nunca hardcodear nombres.
3. **Limpieza en PDFs:** `.toast-container`, modales y botones tienen `print:hidden` para impresiones limpias.
