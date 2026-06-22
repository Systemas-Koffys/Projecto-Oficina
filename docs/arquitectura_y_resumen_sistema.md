# Arquitectura y Resumen Técnico del Sistema de Arboricultura G.A.M.T.

Este documento sirve como un manual técnico de referencia rápida y respaldo completo del estado del sistema. Está diseñado para que cualquier desarrollador, agente o administrador que continúe el proyecto pueda comprender inmediatamente su arquitectura, su pila tecnológica y las decisiones de diseño implementadas.

---

## 🛠️ Pila Tecnológica (Tech Stack)

El sistema está construido como una aplicación web moderna, serverless e instalable, utilizando las siguientes tecnologías:

1. **Core Frontend:**
   * **Vue 3:** Framework para interfaces reactivas utilizando Vite como empaquetador de alto rendimiento.
   * **Pinia:** Gestor de estado global implementado en `src/store/mainStore.js` que centraliza toda la comunicación con Firebase, Cloudinary y los estados de la interfaz de usuario (`uiState`).
   * **Vanilla CSS / TailwindCSS:** Hojas de estilo para la maquetación y diseño visual (con soporte de tema oscuro y temas personalizados).

2. **Backend & Base de Datos (Firebase Cloud):**
   * **Firestore:** Base de datos NoSQL en tiempo real. Sincroniza datos instantáneamente con clientes web conectados mediante listeners reactivos (`onSnapshot`).
   * **Firebase Authentication:** Autenticación de usuarios segura con soporte de login tradicional y **Google Sign-In** integrado.
   * **Firebase Hosting:** Distribución y alojamiento del frontend con dominio propio de producción.

3. **Almacenamiento de Imágenes & CDN:**
   * **Cloudinary (Plan Gratuito):** Utilizado para almacenar y servir de forma ultra rápida las imágenes del sistema (perfiles de personal, logos de la app y fotos de activos en inventario), debido a que Firebase Storage requiere el plan Blaze de pago.

4. **Progressive Web App (PWA):**
   * **`vite-plugin-pwa`:** Configuración de Service Workers para permitir la instalación de la aplicación en computadoras y celulares, almacenamiento de assets en caché, y soporte de persistencia local offline.

5. **Mapas e Interacción:**
   * **Leaflet:** Librería liviana para mapas interactivos que gestiona la geolocalización, posicionamiento de marcadores mediante arrastre (drag-and-drop), agrupación de puntos (Clustering) y mapas de calor (Heatmaps) de solicitudes.

6. **CI/CD (Integración y Despliegue Continuo):**
   * **GitHub Actions:** Flujo de integración automatizado que compila la aplicación web (`npm run build`) y la despliega en Firebase Hosting de forma automática cada vez que se suben cambios a la rama principal (`main`).

---

## 🔄 Resumen de la Gran Migración (Localhost ➡️ Firebase/PWA)

Originalmente, el sistema funcionaba sobre un entorno local de contenedores Docker (`db_oficina` para MySQL, `api_oficina` para un backend Node/Express local y `web_oficina` para el frontend). Esta arquitectura presentaba limitaciones de acceso remoto para los técnicos en campo.

Este código base original de la **Fase 1** (con el backend Node.js/Express, scripts SQL de base de datos MySQL, Dockerfiles y `docker-compose.yml`) se ha conservado y archivado de forma íntegra en la rama de Git **`legacy-mysql-docker`** (y también en `respaldo-local-funcional`). Cualquier desarrollador o agente que necesite referenciar o restaurar el entorno local original de la Fase 1 puede hacer checkout a esas ramas.

Se realizó una migración estructural completa en la rama principal (`main`):
1. **Eliminación del Backend Local:** Toda la lógica de negocio y consultas SQL se tradujeron a peticiones nativas a través del SDK de Firebase en el cliente.
2. **Migración MySQL a Firestore:** Las tablas relacionales se estructuraron en colecciones NoSQL de Firestore, simplificando las consultas mediante documentos embebidos (por ejemplo, el array de árboles dentro de cada solicitud).
3. **Conversión a PWA:** Se implementó una cola de sincronización en IndexedDB y almacenamiento de catálogos locales en `localStorage` de modo que los formularios funcionen sin conexión y se sincronicen de manera diferida al recuperar señal.

---

## 🌐 Flujo de Funcionalidades Clave

### 1. Autenticación y Seguridad de Acceso
* **Login Clásico:** El selector de la pantalla de login filtra al personal para listar únicamente a quienes posean un `username` activo, previniendo que aparezcan choferes u operarios sin privilegios de oficina.
* **Google Sign-In:** Utiliza un popup oficial de Google. Una vez autenticado, el store busca el correo electrónico retornado en la colección de `personal` en Firestore. Si el correo no existe o el funcionario está inactivo, el sistema realiza un cierre de sesión (`auth.signOut()`) automático y deniega el acceso.
* **Cambio Seguro de Contraseña:** Desde la pestaña "Seguridad de Cuenta" en Configuraciones, el usuario puede actualizar su clave personal. Dado que Firebase exige una reautenticación para cambios sensibles de credenciales, el sistema solicita y valida la contraseña actual antes de aplicar el cambio mediante `updatePassword`.

### 2. Gestión de Imágenes y Optimización Client-Side
Para garantizar el rendimiento óptimo del almacenamiento en Firestore (límite de 1MB por documento) y evitar el sobrecosto de transferencia, se implementó un flujo inteligente en `mainStore.js`:
* **Compresión Client-Side:** Antes de subir cualquier foto, el sistema la dibuja en un `<canvas>` HTML5 oculto y la exporta a formato JPEG con dimensiones máximas de 1200x1200px y una calidad del 82%. Esto reduce el peso de fotos móviles pesadas (5MB-10MB) a apenas ~150KB-300KB.
* **Subida a Cloudinary:** La imagen comprimida en Base64 se envía por POST a la API REST de Cloudinary utilizando FormData y un *upload preset* no firmado. Si la subida tiene éxito, retorna la URL pública del CDN (`secure_url`) para guardarla en la base de datos.
* **Caja de Fallback Inmune a Errores:** Si la subida a Cloudinary falla por problemas de red o cuota excedida, el sistema atrapa el error de manera no fatal, comprime la imagen agresivamente en local (500x500px al 60% de calidad) y la almacena como Base64 directamente dentro del documento en Firestore. Así, la operación nunca se detiene.

---

## 📂 Directorio de Vistas (Vistas del Sistema)

* **[LoginView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/LoginView.vue):** Acceso al sistema mediante selector de cuenta tradicional o botón con Google Sign-In.
* **[DashboardView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/DashboardView.vue):** Métricas analíticas con gráficos interactivos sobre solicitudes recibidas, estados de trámites y productividad de las cuadrillas operativas.
* **[MapaView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/MapaView.vue):** Mapa cartográfico interactivo que muestra las solicitudes con filtros por distrito/barrio, alternando entre capas individuales, modo clúster (agrupamiento dinámico) y mapa térmico.
* **[SolicitudesView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/SolicitudesView.vue):** Bandeja principal para el control y edición de expedientes de poda/tala de árboles, con opciones de impresión y asignación técnica.
* **[HistorialView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/HistorialView.vue):** Registro histórico completo de expedientes de arboricultura resueltos o archivados.
* **[ReportesView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/ReportesView.vue):** Centro de generación de estadísticas y filtros de datos institucionales con exportación de hojas de cálculo directas a formato Excel (`.xlsx`).
* **[InventarioView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/InventarioView.vue):** Panel de 3 pestañas:
  1. *Stock y Consumibles:* Control de stock en almacén, traslados a técnicos y compras.
  2. *Ficha Técnica de Maquinaria:* Fichas inmutables de activos de alto valor (como motosierras) con fotos de entrega e inspección y logs de mantenimientos/costos.
  3. *Control de Entregas:* Asignaciones a cuadrillas con flujo obligatorio de retorno de repuestos usados (piezas viejas) para mantener el inventario limpio.
* **[EquiposView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/EquiposView.vue):** Organización y conformación de las cuadrillas de campo por arrastre directo de personal a los equipos de trabajo.
* **[CalendarioView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/CalendarioView.vue):** Agenda activa de planificación mensual de podas/talas con sincronización interactiva y drag-and-drop de pendientes desde una barra lateral.
* **[PersonalView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/PersonalView.vue):** Directorio y expedientes del personal institucional, control de contratos, fotos de perfiles y habilitación de accesos al sistema.
* **[ConfiguracionesView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/ConfiguracionesView.vue):** Panel general para editar catálogos del sistema (barrios, distritos, especies de árboles), actualizar logos oficiales y autogestionar el cambio seguro de contraseña.
* **[PublicPortalView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/PublicPortalView.vue):** Portal público responsivo para ciudadanos. Permite registrar solicitudes geolocalizadas mediante un mapa Leaflet, generando un ticket de seguimiento único.
* **[AuditoriaView.vue](file:///c:/Users/Personal/Documents/Projecto-Oficina/src/views/AuditoriaView.vue):** "Caja Negra" inmutable que registra las operaciones críticas del sistema (CREAR, MODIFICAR, ELIMINAR), sanitizando cadenas largas para evitar desbordamientos de datos.

---

## 🗄️ Estructura de Colecciones en Firestore

* **`personal`**: Contiene la información de los empleados.
  * *Campos:* `id` (UID de Firebase Auth), `nombre`, `cedula_id`, `cargo`, `celular`, `email`, `role` (`SUPERUSER`, `ADMIN`, `TECNICO`), `estado` (`Activo`, `Inactivo`), `foto` (URL CDN o fallback Base64), `username`.
* **`solicitudes`**: Contiene las solicitudes de podas y talas de árboles.
  * *Campos:* `id_solicitud`, `codigo_anual`, `solicitante_nombre`, `solicitante_telefono`, `solicitante_descripcion`, `id_barrio`, `id_distrito`, `calle`, `numero_casa`, `referencia`, `ubicacion_gps`, `lat`, `lng`, `estado_tramite` (`En espera`, `Terminado`), `arboles` (Array de objetos con `id_especie`, `id_accion_solicitada`, `id_accion_realizar`, `observaciones_arbol`).
* **`config`**: Documento único `sistema`.
  * *Campos:* `nombre_app`, `logo_app`, `logo_institucional`, `lastUpdated`.
* **`catalogos`**: Documentos maestros (`especies`, `acciones`, `barrios`, `distritos`, `tipos_institucion`, `instituciones`) estructurados en arrays de ítems para carga estática y offline rápida.
* **`inventario_items`**: Catálogo de consumibles y existencias.
* **`inventario_activos`**: Registro de fichas técnicas de maquinaria.
* **`inventario_movimientos`**: Log de transacciones físicas de herramientas.
* **`auditoria`**: Bitácora inmutable de eventos.

---

## 🗺️ Mapa de Ruta del Sistema (Fases Oficiales)

Este es el plan de desarrollo estructurado en fases para el crecimiento futuro del sistema:

### Fase 1: Perfeccionamiento Actual (Completado y En Pruebas)
* **Mejoras del Visor Geográfico:** Filtros avanzados de mapas implementados y funcionando en `MapaView.vue`.
* **Dashboard Analítico Real:** Gráficos estadísticos e indicadores dinámicos basados en Chart.js en `DashboardView.vue`.
* **Exportación de Datos:** Descarga de tablas a Excel/CSV en reportes utilizando la librería `xlsx`.
* **Caja Negra (Auditoría):** Módulo e interfaz para registrar la actividad de los usuarios.
* **Calendario Activo:** Planificación de mantenimientos mediante agenda con drag-and-drop de pendientes.
* **Módulo de Inventario:** Control de herramientas, consumibles, repuestos y asignaciones.
* *Pendiente:* Vista de "Documentación / Informes" para reportes y plantillas oficiales.

### Fase 2: Salto Arquitectónico (Firebase & PWA) (Completado y En Pruebas)
* **Migración a la Nube:** Traslado de MySQL local a Firebase Firestore y Firebase Auth.
* **Instalabilidad PWA:** Soporte de PWA para hacer la aplicación instalable en dispositivos de escritorio y móviles.
* **Persistencia Local y Cola Offline:** Habilitar el guardado intermedio local para sincronización diferida al reconectarse.

### Fase 3: Digitalización del Trabajo de Campo (Tareas Futuras)
* **Bitácoras Móviles:** Interfaz simplificada y optimizada para que los técnicos en la calle registren trabajos rápidamente desde celulares.
* **Dashboard de Control de Campo:** Panel gerencial para medir rendimiento "hormiga" y productividad por cuadrilla.
* **Optimización de Rutas:** Algoritmo geográfico para trazar el recorrido vial más eficiente para los vehículos y reducir gasto de combustible.

### Fase 4: Gobierno Digital y Automatización (Tareas Futuras)
* **Notificaciones Proactivas:** Mensajes Push o alertas automáticas por WhatsApp sobre el avance de los trámites.
* **Portal de Transparencia Ciudadana:** Acceso público para que los vecinos de Tarija consulten la línea de tiempo de su trámite ingresando su número de ticket.
* **Censo Arbóreo Digital:** Base de datos con geolocalización e ID único de cada árbol patrimonial.
* **Control de Vivero Municipal y Compensación Ambiental:** Gestión de stock de plantines vinculados a autorizaciones de derribo de árboles secos.
* **Firma Digital:** Eliminación de planillas impresas mediante firma directa en pantallas táctiles de dispositivos móviles.

### Fase 5: Inteligencia de Datos y Escalado Máximo (Futuro Lejano)
* **Calculadora de Beneficios Ambientales:** Algoritmo para estimar la captura de CO₂ y retención de agua de lluvia del arbolado de Tarija.
* **Comparador de Fotos (Antes y Después):** Registro de fotos históricas de la evolución de las podas.
* **Alerta Climática Integrada:** Integración con servicios meteorológicos para priorizar despachos de cuadrillas ante emergencias por vientos fuertes.
