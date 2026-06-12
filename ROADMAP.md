# Mapa de Ruta (Roadmap) - Sistema de Arboricultura G.A.M.T.

Este documento refleja el plan de crecimiento estratégico y arquitectónico del sistema, dividido en fases de prioridad.

## Fase 1: Perfeccionamiento Actual (Siguientes Pasos)
- ✅ **Mejoras del Visor Geográfico:** Filtros avanzados implementados exitosamente.
- ✅ **Dashboard Analítico Real:** Gráficos interactivos de Chart.js (líneas, barras, tortas) implementados y en funcionamiento en `DashboardView`.
- ✅ **Exportación de Datos:** Añadir funcionalidad para descargar tablas a Excel/CSV desde el Centro de Reportes y el Historial (usando la librería `xlsx` ya presente en el proyecto).
- ✅ **Caja Negra (Auditoría de Actividad):** Crear un registro inmutable en el backend y una vista protegida para usuarios `ROOT` para fiscalizar quién creó, modificó o eliminó registros.
- **Calendario de Mantenimientos Activo:** Integrar las solicitudes pendientes/realizadas en `CalendarioView.vue` para planificar y agendar podas y talas directamente sobre la agenda.
- **Módulos Faltantes:** Desarrollar el módulo de "Control de Herramientas e Inventario" para las cuadrillas.

## Fase 2: El Gran Salto Arquitectónico (Firebase & PWA)
- **Migración a la Nube (Firebase):** Reemplazar la base de datos MySQL local y el backend en Node.js por Firebase (Firestore para base de datos en tiempo real, Firebase Storage para almacenamiento optimizado de imágenes/fotografías, y Firebase Authentication para control de acceso y seguridad).
- **Progressive Web App (PWA):** Convertir el sistema en una app instalable.
  * **Persistencia Local:** Almacenamiento de catálogos y datos locales.
  * **Cola en IndexedDB:** Permitir el registro e inserción de solicitudes sin conexión a internet, sincronizándolas automáticamente al recuperar señal.
  * **Estrategia de Login Offline:** El inicio de sesión inicial o cambio de usuario requiere conexión a internet para autenticar contra la nube de Firebase. Una vez autenticado, Firebase Auth mantendrá la sesión activa de forma persistente a nivel local, permitiendo al usuario abrir la aplicación e ingresar al sistema directamente sin internet.


## Fase 3: Digitalización del Trabajo de Campo
- **Bitácoras Móviles (Trabajos de Oficio - DOF):** Una vista móvil simplificada para que los técnicos registren su trabajo diario directamente desde la calle (ubicación, especie, acción).
- **Dashboard de Control de Campo:** Vista gerencial para fiscalizar a los técnicos, ver el rendimiento por cuadrilla y métricas de trabajo "hormiga".
- **Optimización de Rutas para Cuadrillas:** Algoritmo que agrupa y traza la ruta geográfica más eficiente en el mapa para reducir combustible y tiempos de traslado.

## Fase 4: Gobierno Digital y Automatización
- **Notificaciones Proactivas:** Alertas automáticas para mantenimientos preventivos y notificaciones Push/WhatsApp a los ciudadanos sobre el avance de su solicitud.
- **Portal de Transparencia Ciudadana:** Un link público donde el vecino puede colocar su número de trámite y ver si su solicitud está en curso, sin ver el resto del sistema administrativo.
- **Firmas y Reportes Digitales:** Reemplazar el papel al 100% integrando firmas en pantalla táctil y reportes con código QR de verificación de autenticidad.
- **Asistente Virtual de Reportes (WhatsApp Bot):** Permite a los ciudadanos reportar incidentes enviando una foto y ubicación por WhatsApp, creando automáticamente un borrador en el sistema.

## Fase 5: Inteligencia de Datos y Escalado Máximo (Futuro Lejano)
- **Calculadora de Beneficios Ambientales (CO₂ y Agua):** Algoritmo que calcula el impacto ecológico positivo (CO₂ capturado, agua de lluvia retenida) de las plantaciones y podas fitosanitarias, y descuenta la pérdida de las talas (sugiriendo la cantidad de plantaciones de compensación).
- **Gestión de Fotografías (Antes y Después):** Flujo premium para subir y comparar fotos históricas del estado de los árboles. *(Nota: Movido al futuro lejano por requerimiento del negocio)*.
- **Módulo de Vivero Municipal:** Control de inventario de semillas y plantines que se descuentan automáticamente al registrar plantaciones en campo.
- **Fiscalización y Multas:** Registro de talas ilegales con emisión automática de notificaciones de infracción y penalidades vinculadas a direcciones.
- **Censo Arbóreo Urbano:** Gestión individual de cada árbol de la ciudad con un ID único, código QR físico colgante para interactividad con el ciudadano (mostrar ficha ecológica) e historial clínico de intervenciones.
- **Mapa de Calor de Riesgos e Islas de Calor:** Visualización geográfica de zonas sin árboles (islas de calor) y de alta concentración de árboles con riesgo de caída.
- **Alerta Climática Integrada:** Integración con APIs meteorológicas para priorizar inspecciones de emergencia ante tormentas y vientos fuertes en la ciudad de Tarija.
- **Asistente de Inteligencia Artificial:** Integración con Gemini para consultas analíticas directas mediante lenguaje natural.
