# Mapa de Ruta (Roadmap) - Sistema de Arboricultura G.A.M.T.

Este documento refleja el plan de crecimiento estratégico y arquitectónico del sistema, dividido en fases de prioridad.

## Fase 1: Perfeccionamiento Actual (Siguientes Pasos)
- ✅ **Mejoras del Visor Geográfico:** Filtros avanzados implementados exitosamente.
- **Dashboard Analítico Real:** Implementar gráficos visuales interactivos (barras, tortas) en la pantalla de inicio (`DashboardView`) para monitorear métricas clave.
- **Exportación de Datos:** Añadir funcionalidad para descargar tablas a Excel/CSV desde el Centro de Reportes y el Historial.
- **Gestión de Fotografías (Antes y Después):** Flujo para que el personal de campo pueda subir o visualizar fácilmente fotos del estado de los árboles.
- **Calendario de Mantenimientos:** Mejorar la vista del calendario para programar y visualizar mantenimientos preventivos en la ciudad.
- **Módulos Faltantes:** Desarrollar el "Control de Herramientas e Inventario".
- **Caja Negra (Auditoría):** Crear un registro invisible de acciones (quién modificó, eliminó o creó un registro y a qué hora) accesible solo para usuarios `ROOT`.

## Fase 2: El Gran Salto Arquitectónico
- **Migración a la Nube (Firebase):** Reemplazar el backend local por Firebase Firestore para obtener base de datos gratuita, en tiempo real y con persistencia de datos.
- **Progressive Web App (PWA):** Configurar el sistema para que sea instalable sin APK, permitiendo su uso sin conexión a internet en la oficina o campo, y sincronizando datos automáticamente al recuperar red.

## Fase 3: Digitalización del Trabajo de Campo
- **Bitácoras Móviles (Trabajos de Oficio - DOF):** Una vista móvil simplificada para que los técnicos registren su trabajo diario directamente desde la calle (ubicación, especie, acción, foto).
- **Dashboard de Control de Campo:** Vista gerencial para fiscalizar a los técnicos, ver el rendimiento por cuadrilla y métricas de trabajo "hormiga".

## Fase 4: Gobierno Digital y Automatización
- **Notificaciones Proactivas:** Alertas automáticas para mantenimientos preventivos (ej. "Toca poda de los árboles plantados hace 6 meses") y notificaciones Push/WhatsApp a los ciudadanos sobre el avance de su solicitud.
- **Portal de Transparencia Ciudadana:** Un link público donde el vecino puede colocar su número de trámite y ver si su solicitud está en curso, sin ver el resto del sistema administrativo.
- **Firmas Digitales:** Reemplazar el papel al 100% integrando validación o códigos QR en los reportes finales.

## Fase 5: Inteligencia de Datos y Escalado Máximo (Futuro Lejano)
- **Módulo de Vivero Municipal:** Control estricto de inventario de semillas y plantines, que se descuentan automáticamente cuando los técnicos plantan un árbol.
- **Fiscalización y Multas:** Registro de talas ilegales con emisión automática de notificaciones de infracción y penalidades vinculadas a direcciones.
- **Censo Arbóreo Urbano:** Evolucionar de "gestión de solicitudes" a "gestión de individuos", donde cada árbol de la ciudad tiene un ID único y un historial clínico de intervenciones.
- **Asistente de Inteligencia Artificial:** Integración con LLM (Gemini/Groq) para poder preguntarle al sistema por voz o texto: *"¿Cuántas podas de emergencia tuvimos en el Distrito 4 esta semana?"* y recibir un análisis detallado en segundos.
