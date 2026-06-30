# 🌳 ArborGest — Manual Maestro de Traspaso & Estado del Proyecto (v3.26.13)

> **DOCUMENTO MAESTRO DE CONTINUIDAD PARA EL SIGUIENTE ASISTENTE IA DE CÓDIGO**  
> **Fecha de Actualización:** 29 de Junio de 2026  
> **Versión Actual:** `v3.26.13` (Commit `66646a3` en repositorio GitHub `origin/main`)  
> **Institución:** Gobierno Autónomo Municipal de Tarija (G.A.M.T.)  
> **Dependencia Oficial:** Dirección de Obras Públicas Municipales de Tarija • Unidad de Mantenimiento de Ornato Público • Área de Arboricultura  

---

## 🛑 REGLAS ESTRICTAS DE TRABAJO Y METODOLOGÍA DEL USUARIO ("REGLAS DE ORO")

El usuario sigue una metodología rigurosa de desarrollo y control. **El asistente DEBE respetar estas reglas sin excepción:**

1. ⚠️ **"NO TOCAR SIN AVISARME" (Consultar y explicar efectos colaterales antes de codificar):**
   - Jamás modificar arquitectura, archivos de configuración (`firebase.json`, `vite.config.js`, `config.js`), lógica de autenticación ni estructuras de la base de datos sin explicar el plan técnico detallado en español sencillo.
   - **Explicación Transparente de Efectos Colaterales:** Antes de realizar cualquier cambio, el asistente DEBE advertir explícitamente qué archivos se tocarán y TODOS los posibles efectos secundarios o colaterales que dicho cambio podría causar en otras partes del sistema, en la base de datos o en la nube de producción (ej: pantallas blancas por variables de entorno faltantes).
   - Presentar el plan al usuario y **esperar su autorización explícita ("dale", "ok", "adelante")** antes de modificar código o crear artefactos modificatorios.
2. 🚫 **PROHIBIDO INICIAR EL NAVEGADOR AUTOMATIZADO (`browser_subagent`):**
   - El asistente tiene **estrictamente prohibido** invocar o lanzar la herramienta del subagente de navegador (`browser_subagent`) por iniciativa propia. El usuario realiza y verifica sus propias pruebas manualmente en su pantalla. Solo se usará si el usuario lo solicita explícitamente.
3. 🛑 **CONTROL DE GIT Y COMMITS RESPONSABLES:**
   - No realizar commits o pushes de manera apresurada. Asegurarse de que el código esté 100% probado y verificado antes de confirmar los cambios en la rama principal.
4. 🔢 **Sistema Dinámico de Control de Versión (`update-version.js`):**
   - Cada proceso de `npm run build` o commit ejecuta automáticamente `node scripts/update-version.js` (`prebuild` hook).
   - Este script calcula la versión `v3.minor.patch` leyendo el conteo total de commits de Git (`git rev-list --count HEAD`) y actualiza `package.json`.
   - **Regla:** Al confirmar cambios al usuario, siempre mencionar la versión generada (ej: `v3.26.6`) y el commit hash.
5. 💼 **Jerarquía de Cargos Institucionales Únicos:**
   - `Responsable de Área`, `Jefe de Unidad` y `Técnico de sistemas` son cargos únicos e indivisibles en el municipio (máximo 1 persona activa por cargo en la base de datos).
   - El sistema valida esta unicidad al crear o actualizar funcionarios en `mainStore.js` (`addCatalogo`, `updateCatalogo`).
   - Las firmas de documentos e informes impresos (PDFs) se calculan dinámicamente en `mainStore.js` buscando a las personas asignadas a estos cargos (`responsableArea` y `jefeUnidad`). Nunca poner nombres estáticos (ej: jamás hardcodear "Ing. Cimar Farfan" o "Ing. Raul Arteaga").
6. 🛡️ **Estándar Firebase Modular SDK v9+:**
   - Utilizar funciones modulares como `deleteApp(app)` de `'firebase/app'` (evitar `app.delete()` porque lanza runtime TypeError en SDK modular).
   - En actualizaciones parciales de `updateCatalogo('tecnicos', id, datos)`, siempre hacer *merge* o fallback con `existingData` para evitar sobreescribir nombres o cargos con `undefined`.

---

## 🛠️ ARQUITECTURA TÉCNICA E INFRAESTRUCTURA COMPLETA

- **Framework Frontend:** Vue 3 (Composition API `<script setup>`), Vue Router (`src/router/index.js`), Vite (`vite.config.js`).
- **Estado Global:** Pinia Store (`src/store/mainStore.js`).
- **Diseño & UI:** Vanilla CSS + Tailwind CSS utilities (`src/style.css`), Lucide Vue Icons (`lucide-vue-next`), Leaflet.js para mapas geográficos, Chart.js para gráficos analíticos.
- **Nube e Infraestructura:**
  - **Firebase Hosting & GitHub Actions:** Despliegue automático a la nube al hacer push a la rama `main` en GitHub (`Sistema-Arboricultura-Tarija`).
  - **Firebase Firestore:** Base de datos NoSQL en tiempo real con persistencia offline en IndexedDB (`persistentLocalCache` y `persistentMultipleTabManager`).
  - **Firebase Auth:** Autenticación con email/password y Google Sign-In con verificación previa contra el directorio municipal en `personal`.
  - **Cloudinary CDN (Almacenamiento de Imágenes):** Las imágenes y fotos de árboles/perfiles se procesan y comprimen en el cliente vía Canvas (máx 1200x1200px al 82% quality JPEG, reduciendo tamaño 30x). Luego se suben a Cloudinary vía API REST RESTful Unsigned Preset (`sistema-gamt-uploads`). Si la red o Cloudinary fallan, el sistema tiene un fallback automático para guardar Base64 comprimido directamente en Firestore.
  - **Manejo de Transparencias en Canvas:** La función `compressImage` en `mainStore.js` rellen al canvas con blanco `#FFFFFF` antes de procesar logos o imágenes PNG transparentes para evitar fondos negros.
  - **Firestore Security Rules:** Archivo [firestore.rules](file:///c:/Users/Personal/Documents/Projecto-Oficina/firestore.rules) desplegado oficialmente en los servidores de Google Firebase.

---

## 📋 NORMAS DE IMPRESIÓN Y DISEÑO DE INFORMES OFICIALES

1. **Membrete Oficial Estandarizado (4 Líneas):**
   Todas las impresiones (Solicitudes, Reportes, Historial, Ficha Técnica de Activos, Mapa) deben llevar la cabecera institucional exacta:
   - *Gobierno Autónomo Municipal de Tarija*
   - *Dirección de Obras Públicas Municipales de Tarija*
   - *Unidad de Mantenimiento de Ornato Público*
   - *Área de Arboricultura*
2. **Firmas Dinámicas de Autoridades:**
   Los bloques de firma en la parte inferior de los PDFs siempre leen dinámicamente `responsableArea` y `jefeUnidad` desde el store de funcionarios activos.
3. **Limpieza de Elementos Flotantes en Impresión:**
   Notificaciones Toast, modales y botones flotantes tienen configuradas las clases `.toast-container { display: none !important; }` y `print:hidden no-print` en `@media print` en `src/style.css` para garantizar PDFs limpios sin distorsión.

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS FIRESTORE (COLECCIONES)

1. `personal`: Directorio de funcionarios municipales (roles: `ROOT`, `ADMIN`, `TECNICO`, `USER`).
2. `solicitudes`: Expedientes de trámites de poda/tala/emergencias enviados por la oficina o el portal ciudadano (estados: `En espera`, `Pendiente`, `En proceso`, `Terminado`).
3. `catalogos`: Documentos maestros (`barrios`, `distritos`, `especies`, `acciones`, `tipos_institucion`, `instituciones`).
4. `config`: Metadata global del sistema (`docId: 'sistema'` con logos institucionales).
5. `auditoria`: **Caja Negra inmutable** que registra todas las acciones (`CREAR`, `MODIFICAR`, `ELIMINAR`).
6. `impresiones`: Historial de reportes y hojas de ruta impresos con snapshot de filtros (`filtros_snapshot`).
7. `calendario`: Programación e hitos de trabajos en barrios.
8. `inventario_items`: Catálogo maestro de herramientas y repuestos.
9. `inventario_activos`: Activos codificados con número de chasis/serie y responsable legal.
10. `inventario_consumibles`: Stock físico de insumos por almacén/oficina.
11. `inventario_movimientos`: Entradas, salidas y transferencias de herramientas.
12. `inventario_mantenimientos`: Fichas de servicio técnico de equipos.

---

## 📋 ESTADO ACTUAL Y LOGROS RECIENTES (`v3.26.13`)

- ✅ **Selector Tradicional Restaurado:** Habilitada la lectura pública de la colección `personal` en Firestore para cargar de inmediato los nombres, cargos y fotos de los técnicos activos al abrir la pantalla de login sin errores de consola.
- ✅ **Membrete Oficial Estandarizado:** Implementado en todas las vistas de impresión.
- ✅ **Módulo de Equipos Operativos (`EquiposView.vue`):** Drag & drop reparado para UIDs alfanuméricos de Firebase. Incorporada barra de resumen con insignias dinámicas por cargo (`1 Técnico`, `2 Choferes`, `3 Trepadores`, etc.) y pluralización gramatical automática.
- ✅ **Portal Ciudadano (`PublicPortalView.vue`):** Conectado en tiempo real con `solicitudes` (estados `En espera` / `Pendiente`). Generación de código de ticket público `SOL-017/26`, soporte para visualización de códigos públicos en tablas/mapas y ordenamiento cronológico exacto por `createdAt` en primera página.
- ✅ **Blindaje de Seguridad Nube (`firestore.rules`):** Desplegado en la nube de Google Firebase. Inmutabilidad estricta de auditoría (`allow update, delete: if false;`), restricción de escritura de catálogos y personal a `ADMIN`/`ROOT`, y aislamiento de privacidad para el portal ciudadano.
- ✅ **Configuración de Conexión:** Restaurados valores de respaldo en [src/firebase/config.js](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/firebase/config.js) para evitar pantallas blancas en el bundle web de producción de Firebase Hosting.

---

## 🎯 PRÓXIMA FASE Y TAREAS PENDIENTES (HOJA DE RUTA)

### 📌 Fase Inmediata: Conexión con Podarapp (AppSheet + Google Sheets)
El usuario tiene una aplicación móvil de campo llamada **Podarapp** construida en AppSheet y respaldada por una base de datos en Google Sheets en su Google Drive.

**Objetivo de la siguiente sesión:**
1. Diseñar e implementar el flujo de integración/sincronización entre **ArborGest** (sistema web de oficina en Firebase) y **Podarapp** (app de campo en AppSheet / Google Sheets).
2. Permitir que los trabajos ejecutados por los técnicos en la calle usando Podarapp se reflejen automáticamente en las solicitudes e inventario de ArborGest.

### 📌 Fase Siguiente: Módulo de Documentación e Informes
Desarrollar la vista de "Documentación / Informes" para plantillas oficiales antes de pasar al despliegue total de herramientas de campo.

---

## 💡 NOTA FINAL PARA EL SIGUIENTE AGENTE IA

Al iniciar el nuevo chat, saluda cordialmente al usuario, confirma que has leído este manual maestro de traspaso (`PROJECT_STATE.md`), menciona que el sistema está estable en la versión `v3.26.6` con su blindaje de seguridad activo y reglas de trabajo comprendidas al 100%, y pregunta si desea comenzar directamente con el análisis y diseño de la **integración con Podarapp (AppSheet + Google Sheets)**.
