# 🌳 ArborGest — Manual Maestro de Traspaso & Estado del Proyecto

> **DOCUMENTO MAESTRO DE CONTINUIDAD PARA EL SIGUIENTE ASISTENTE IA DE CÓDIGO**
> **Fecha de Actualización:** 4 de Julio de 2026
> **Versión Actual:** `v3.27.x` (Desarrollo en rama `feature-podarapp-sync`)
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
   - Este script calcula la versión `v3.minor.patch` leyendo el conteo de commits de Git y actualiza `package.json`.
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
  - **Google Apps Script:** Script conector para sincronizar PodarApp → ArborGest (ver sección siguiente).
  - **Firestore Security Rules:** Archivo `firestore.rules` desplegado en la nube.

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS FIRESTORE (COLECCIONES)

1. `personal`: Directorio de funcionarios municipales (roles: `ROOT`, `ADMIN`, `TECNICO`, `USER`).
2. `solicitudes`: Expedientes de trámites de poda/tala/emergencias (estados: `En espera`, `Terminado`).
3. `catalogos`: Documentos maestros (`barrios`, `distritos`, `especies`, `acciones`, `tipos_institucion`, `instituciones`). **No son colecciones propias, sino documentos dentro de la colección `catalogos`** con un campo `items[]`.
4. `config`: Metadata global del sistema (`docId: 'sistema'` con logos institucionales).
5. `auditoria`: Caja Negra inmutable de todas las acciones (`CREAR`, `MODIFICAR`, `ELIMINAR`).
6. `impresiones`: Historial de reportes impresos con snapshot de filtros.
7. `calendario`: Programación e hitos de trabajos en barrios.
8. `inventario_items`, `inventario_activos`, `inventario_consumibles`, `inventario_movimientos`, `inventario_mantenimientos`: Módulo completo de Inventario y Equipos.

---

## 🔑 DATOS CLAVE SOBRE `solicitudes` (Trámites)

- **Llave Primaria:** El campo `comunicacion_interna` es el ID único inamovible. El `docId` en Firestore se deriva como `podar_{codigo/año}` → `podar_1285-25`.
- **Estados válidos:** `"En espera"` (pendiente), `"Terminado"` (ejecutado).
- **Campo `createdAt`:** Debe ser un `Timestamp` real de Firestore para que el listener en tiempo real de `mainStore.js` (que ordena por `createdAt DESC`) muestre el documento.
- **Campo `_fuente_sync`:** `"podarapp"` para los registros sincronizados desde Google Sheets. Los creados localmente en ArborGest no tienen este campo.
- **Árboles múltiples:** Se almacenan en un array `arboles[]` dentro de cada solicitud. Cada árbol tiene `id_especie`, `id_accion_solicitada`, `id_accion_realizar`, `observaciones_arbol`, `url_foto`, `realizado` (bool).
- **GPS:** Los campos `lat` y `lng` son números de doble precisión.

---

## 🔄 SINCRONIZACIÓN PODARAPP → ARBORGEST (IMPLEMENTADA Y ACTIVA)

La integración entre **PodarApp (Google Sheets / AppSheet)** y **ArborGest (Firebase Firestore)** está completada y en producción.

### Estado Actual
- **861 solicitudes** sincronizadas desde Google Sheets a Firestore.
- El activador automático en Apps Script corre **cada 5 minutos**.
- El script detecta diferencias en memoria (batch) y solo escribe cuando hay cambios reales, corriendo en <5 segundos cuando no hay novedades.

### Cómo Funciona
1. Lee las hojas `basededatos` y `DetalleDeÁrboles` del Google Sheet de PodarApp.
2. Resuelve barrios, distritos, especies, acciones y técnicos contra los catálogos de Firestore.
3. Descarga todos los documentos de `solicitudes` en memoria al inicio.
4. Compara campo a campo. Si hay diferencia → `PATCH` a Firestore. Si no → `SIN_CAMBIOS`.
5. Fuerza actualización si el documento en Firestore carece de `createdAt`.

### Configuración (Variables Secretas en Apps Script)
En la consola de Apps Script → Configuración del Proyecto → Propiedades del Script:
- `SA_CLIENT_EMAIL`: Email de la cuenta de servicio de Firebase.
- `SA_PRIVATE_KEY`: Clave privada PEM completa.
- `FIRESTORE_PROJECT`: `sistema-arboricultura-tarija`

### Llave Primaria en el Excel
La columna **`Comunicacion interna`** es la llave primaria. No es editable. Si dos filas tienen el mismo código, se sobreescriben en Firestore (se detectan con la función `detectarDuplicadosYErrores()`).

### Mapeo de Barrios (Por Capas)
El script resuelve barrios con 3 capas:
1. **Exacta** (nombre + distrito coinciden).
2. **Solo nombre** (emite advertencia si el distrito difiere).
3. **Parcial** (subcadena). Si no hay match → `id_barrio: null` y escribe `barrio_texto_podar` con el texto original.

### Ramas de Git
- `feature-podarapp-sync` → rama de desarrollo activa.
- `main` → producción (no modificar sin build y prueba previa).
- `feature-ai-assistant` → módulo IA congelado (Groq/LLaMA).

### Documentación Técnica Detallada
Ver: [`docs/podarapp_sync.md`](file:///c:/Users/Personal/Documents/Projecto-Oficina/docs/podarapp_sync.md)

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
| `src/components/SolicitudModal.vue` | Modal principal de creación/edición de solicitudes (campos: `verificado` toggle, `realizado` toggle por árbol) |
| `src/components/Sidebar.vue` | Barra lateral de navegación con roles y permisos |
| `src/store/mainStore.js` | Store Pinia central: auth, listeners Firestore, catálogos, CRUD |

---

## ⚠️ TAREAS PENDIENTES (SIGUIENTE CHAT)

### 1. Ajustes en el Dashboard (`src/views/DashboardView.vue`)
- **Filtro de Fecha Histórico:** La computada `solicitudesFiltradas` tiene hardcodeado `limitDate = '2026-01-01'`. Esto impide que el filtro "Histórico" muestre datos de 2023, 2024 y 2025. Debe quitarse el límite cuando el filtro sea `'todo'`.
- **Gráfico "Demanda por Acción":** En `generarDatosGraficos()`, el gráfico busca `s.id_accion_solicitada` en la raíz. Los registros de PodarApp guardan la acción en `s.arboles[0].id_accion_solicitada`. Añadir el mismo fallback que ya tiene la lista lateral `accionesPendientes`.

### 2. Sincronización Bidireccional (Siguiente Fase)
Desarrollar el flujo inverso (ArborGest → Google Sheets) para que las ediciones hechas en ArborGest se reflejen de vuelta en PodarApp.

### 3. Integración de Imágenes de Campo
Las fotos de AppSheet se guardan como rutas relativas en Google Drive (ej: `basededatos_Images/foto.jpg`). Explorar cómo publicarlas o migrarlas a Cloudinary para visualizarlas en ArborGest.

---

## 📋 NORMAS DE IMPRESIÓN Y DISEÑO

1. **Membrete Oficial Estandarizado (4 líneas):**
   - *Gobierno Autónomo Municipal de Tarija*
   - *Dirección de Obras Públicas Municipales de Tarija*
   - *Unidad de Mantenimiento de Ornato Público*
   - *Área de Arboricultura*
2. **Firmas Dinámicas:** Leen `responsableArea` y `jefeUnidad` del store. Nunca hardcodear nombres.
3. **Limpieza en PDFs:** `.toast-container`, modales y botones tienen `print:hidden` para impresiones limpias.

---

## 💡 NOTA FINAL PARA EL SIGUIENTE AGENTE IA

Al iniciar el nuevo chat:
1. Confirma que has leído este `PROJECT_STATE.md`.
2. Informa que el sistema está en versión `v3.27.x` en la rama `feature-podarapp-sync` con la sincronización PodarApp → ArborGest **completada y activa con 861 registros**.
3. La próxima tarea prioritaria es **ajustar el Dashboard** (filtro de fecha y gráfico "Demanda por Acción").
4. Luego se pasa a la **bidireccionalidad** y posteriormente a las **imágenes de campo**.
5. Siempre espera la autorización del usuario antes de modificar cualquier archivo.
