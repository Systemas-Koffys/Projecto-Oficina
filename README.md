# Sistema de Gestión de Arboricultura - Tarija

Plataforma gubernamental a medida para el control, planificación y seguimiento técnico de solicitudes de poda y tala del Gobierno Autónomo Municipal de Tarija (GAMT).

---

## 📌 Reglas de Persistencia de Datos y Desarrollo (CRÍTICO)

Para evitar la pérdida de fotografías de personal, registros de solicitudes y logotipos institucionales cargados en el sistema durante el desarrollo, siga estrictamente las siguientes directrices:

### 1. Conservación de Volúmenes de Base de Datos
* **Persistencia Local**: El motor MySQL almacena toda su información en un volumen Docker llamado `db_data` (mapeado en `/var/lib/mysql`).
* **Cómo apagar el sistema de forma segura**: 
  * Use únicamente `docker-compose stop` o `docker-compose down`. Esto detiene los contenedores pero **conserva todos los datos, fotos y configuraciones**.
* **⚠️ Prohibido en producción/pruebas reales**: 
  * **NUNCA ejecute `docker-compose down -v`**. El argumento `-v` destruye permanentemente el volumen `db_data` y eliminará todas las imágenes y registros creados.

### 2. Reinicio del Equipo o PC
* Puede detener los contenedores Docker, reiniciar la computadora, apagar el equipo y volver a levantar todo con `docker-compose up -d`. **Los datos se mantendrán intactos**.

### 3. Re-sembrado de Datos (Seeding)
* Los scripts en `backend/seed_new_db.js` y el archivo `db/init.sql` representan el esquema y dataset base inicial. Ejecutarlos de nuevo limpiará las modificaciones en caliente y restaurará los datos de prueba iniciales. Utilícelos únicamente para migraciones de estructura o despliegues desde cero.

---

## 🛠️ Especificaciones de la Arquitectura

* **Frontend**: Vue 3 (Composition API) + Tailwind CSS + Pinia + Vite.
* **Backend**: Node.js + Express (API REST cifrada mediante Bcrypt y tokens JWT).
* **Base de Datos**: MySQL 8.0 (con columnas de tipo `LONGTEXT` para soporte completo de imágenes codificadas en Base64).
* **Entorno**: Dockerizado de forma unificada.

---

## 🚀 Puertos y Acceso de Servicios Locales

Al levantar la plataforma con `docker-compose up -d`, los siguientes puertos estarán disponibles:

| Servicio | Puerto Local | Descripción |
| :--- | :--- | :--- |
| **Frontend Web** | `http://localhost:5173` | Portal Administrativo y de Gestión |
| **API REST Backend** | `http://localhost:3000` | Endpoints del Servidor y Controladores |
| **Administración DB** | `http://localhost:8081` | Interfaz phpMyAdmin para MySQL |
| **Base de Datos MySQL** | `localhost:3306` | Puerto directo de conexión a base de datos |

---

## 📁 Estructura Principal del Proyecto

```bash
├── backend/            # Código fuente del servidor Express y Scripts de migración
├── db/                 # Scripts SQL de inicialización y esquemas
├── src/                # Código fuente del Frontend
│   ├── components/     # Componentes reutilizables (Sidebar, Modales, Reloj)
│   ├── store/          # Estado reactivo global (Pinia Store)
│   ├── views/          # Vistas y páginas de la aplicación
│   └── main.js         # Inicializador de la aplicación Vue
├── docker-compose.yml  # Orquestador de contenedores Docker
└── vite.config.js      # Configuración del empaquetador Vite
```
