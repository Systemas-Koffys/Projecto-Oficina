-- InicializaciÃ³n de Base de Datos (NORMALIZADA CON TABLA PERSONAL Y DETALLE ARBOLES v3)

SET NAMES utf8mb4;
DROP DATABASE IF EXISTS dboficina;
CREATE DATABASE dboficina CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dboficina;

-- Desactivar llaves forÃ¡neas para poder limpiar tablas
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas nuevas y antiguas si existen
DROP TABLE IF EXISTS detalle_arboles, solicitudes_poda, historial_impresiones, calendario_barrios, config_sistema, personal, instituciones, tipos_solicitantes, barrios, distritos, acciones_catalogo, especies_arboles;
DROP TABLE IF EXISTS solicitudes, usuarios, tecnicos, especies, acciones, tipos_institucion;

-- Reactivar llaves forÃ¡neas
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. CREACIÃ“N DE TABLAS DE CATÃLOGO (PARAMÃ‰TRICAS)
-- =============================================================================

CREATE TABLE distritos (
    id_distrito INT AUTO_INCREMENT PRIMARY KEY,
    numero_distrito INT NOT NULL UNIQUE
);

CREATE TABLE barrios (
    id_barrio INT AUTO_INCREMENT PRIMARY KEY,
    nombre_barrio VARCHAR(100) NOT NULL,
    id_distrito INT,
    FOREIGN KEY (id_distrito) REFERENCES distritos(id_distrito)
);

CREATE TABLE tipos_solicitantes (
    id_tipo_solicitante INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo VARCHAR(100) NOT NULL
);

CREATE TABLE instituciones (
    id_institucion INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo_solicitante INT,
    nombre_institucion VARCHAR(150) NOT NULL,
    FOREIGN KEY (id_tipo_solicitante) REFERENCES tipos_solicitantes(id_tipo_solicitante)
);

CREATE TABLE personal (
    id_personal INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    cedula_id VARCHAR(50) NOT NULL UNIQUE,
    cargo VARCHAR(100) NOT NULL,
    contacto VARCHAR(50) NULL,
    contrato VARCHAR(100) NULL,
    usuario VARCHAR(50) NULL UNIQUE,
    contrasena VARCHAR(255) NULL,
    role VARCHAR(50) DEFAULT 'TECNICO',
    email VARCHAR(100) NULL,
    estado VARCHAR(20) DEFAULT 'Activo',
    fecha_ingreso DATE NULL,
    fecha_nacimiento DATE NULL,
    tipo_sangre VARCHAR(10) NULL,
    contacto_emergencia VARCHAR(100) NULL,
    celular_emergencia VARCHAR(50) NULL,
    foto LONGTEXT NULL,
    id_equipo INT NULL,
    rol_equipo VARCHAR(100) NULL
);

CREATE TABLE acciones_catalogo (
    id_accion INT AUTO_INCREMENT PRIMARY KEY,
    nombre_accion VARCHAR(150) NOT NULL,
    descripcion TEXT NULL
);

CREATE TABLE especies_arboles (
    id_especie INT AUTO_INCREMENT PRIMARY KEY,
    nombre_comun VARCHAR(150) NOT NULL,
    nombre_cientifico VARCHAR(150) NULL
);

-- =============================================================================
-- 2. CREACIÃ“N DE TABLAS TRANSACCIONALES (MAESTRO - DETALLE)
-- =============================================================================

CREATE TABLE solicitudes_poda (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    codigo_anual VARCHAR(20) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    comunicacion_interna VARCHAR(100) NULL,
    id_tipo_solicitante INT,
    id_institucion INT NULL,
    nombre_solicitante VARCHAR(150) NOT NULL,
    telefono_solicitante VARCHAR(50),
    nota_solicitud_sucia TEXT NULL,
    id_distrito INT,
    id_barrio INT,
    calle VARCHAR(150) NULL,
    numero_casa VARCHAR(50) NULL,
    referencia_casa TEXT NULL,
    ubicacion_gps VARCHAR(100) NULL,
    fecha_inspeccion DATE NULL,
    id_tecnico_verificador INT,
    esta_verificado VARCHAR(10) DEFAULT 'No',
    requiere_plataforma INT DEFAULT 0,
    requiere_ficha_tecnica INT DEFAULT 0,
    procede_solicitud INT DEFAULT 0,
    es_arbol_seco INT DEFAULT 0,
    es_emergencia INT DEFAULT 0,
    urgencia VARCHAR(20) DEFAULT 'Media',
    estado_general VARCHAR(20) DEFAULT 'En espera',
    fecha_execution DATE NULL,
    id_tecnico_ejecucion INT NULL,
    observacion_ejecucion TEXT NULL,
    observacion_verificacion TEXT NULL,
    trabajos_extra TEXT NULL,
    FOREIGN KEY (id_tipo_solicitante) REFERENCES tipos_solicitantes(id_tipo_solicitante),
    FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion),
    FOREIGN KEY (id_distrito) REFERENCES distritos(id_distrito),
    FOREIGN KEY (id_barrio) REFERENCES barrios(id_barrio),
    FOREIGN KEY (id_tecnico_verificador) REFERENCES personal(id_personal) ON DELETE SET NULL,
    FOREIGN KEY (id_tecnico_ejecucion) REFERENCES personal(id_personal) ON DELETE SET NULL
);

CREATE TABLE detalle_arboles (
    id_arbol INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_especie INT,
    id_accion_solicitada INT,
    id_accion_realizar INT,
    observaciones_arbol TEXT NULL,
    url_foto VARCHAR(255) NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes_poda(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_especie) REFERENCES especies_arboles(id_especie),
    FOREIGN KEY (id_accion_solicitada) REFERENCES acciones_catalogo(id_accion),
    FOREIGN KEY (id_accion_realizar) REFERENCES acciones_catalogo(id_accion)
);

CREATE TABLE IF NOT EXISTS historial_impresiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_reporte VARCHAR(255) NOT NULL,
    id_solicitud INT NULL,
    tipo_reporte VARCHAR(100),
    usuario VARCHAR(100),
    fecha_impresion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filtros_aplicados TEXT NULL,
    detalles TEXT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes_poda(id_solicitud) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS config_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor LONGTEXT
);

CREATE TABLE IF NOT EXISTS calendario_barrios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_aniversario DATE NOT NULL,
    nombre_barrio VARCHAR(255) NOT NULL,
    presidente_barrio VARCHAR(255),
    telefono_presidente VARCHAR(50),
    color_etiqueta VARCHAR(50) DEFAULT '#4caf50'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================

-- =============================================================================
-- 3. DATOS REALES DE PRODUCCION (exportados de base local - fotos excluidas)
-- =============================================================================
docker : mysqldump: [Warning] Using a password on the command line interface can be insecure.
En línea: 2 Carácter: 1
+ docker exec db_oficina mysqldump -uroot -ppassword --no-tablespaces - ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (mysqldump: [War...an be insecure.:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
Warning: A partial dump from a server that has GTIDs will by default include the GTIDs of all transactions, even those 
that changed suppressed parts of the database. If you don't want to restore GTIDs, pass --set-gtid-purged=OFF. To make 
a complete dump, pass --all-databases --triggers --routines --events. 
Warning: A dump from a server that has GTIDs enabled will by default include the GTIDs of all transactions, even those 
that were executed during its extraction and might not be represented in the dumped data. This might result in an 
inconsistent data dump. 
In order to ensure a consistent backup of the database, pass --single-transaction or --lock-all-tables or 
--source-data. 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;
SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '7d3491cc-614b-11f1-b3b9-96d01663b0bd:1-183';

LOCK TABLES `acciones_catalogo` WRITE;
/*!40000 ALTER TABLE `acciones_catalogo` DISABLE KEYS */;
INSERT INTO `acciones_catalogo` (`id_accion`, `nombre_accion`, `descripcion`) VALUES (1,'Poda de Formaci├│n','Corte de ramas secas, elevaci├│n de copa y despeje de pantallas urbanas o luminarias.'),(2,'Despunte','Reducci├│n controlada de la copa y altura del ├írbol para mitigar riesgos o interferencias.'),(3,'Derribe Controlado','Tala o eliminaci├│n total del esp├®cimen debido a muerte (├írbol seco), pudrici├│n, inclinaci├│n severa o da├▒o estructural irreversible.'),(4,'Emergencia','Intervenci├│n inmediata por ├írbol ca├¡do o con peligro inminente de colapso.'),(5,'Poda de Ra├¡ces','Corte controlado de ra├¡ces que causan da├▒os a pavimentos, aceras o estructuras cercanas.'),(6,'Extracci├│n de Toc├│n','Remoci├│n del remanente del tronco (toc├│n) y ra├¡ces superficiales para evitar rebrotes o plagas.'),(7,'Poda General y otros','Ejecuci├│n de m├║ltiples tipos de poda combinada, sujeto al diagn├│stico del criterio t├®cnico en campo.'),(8,'No Determinado','Pendiente de evaluaci├│n t├®cnica en el lugar.');
/*!40000 ALTER TABLE `acciones_catalogo` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `barrios` WRITE;
/*!40000 ALTER TABLE `barrios` DISABLE KEYS */;
INSERT INTO `barrios` (`id_barrio`, `nombre_barrio`, `id_distrito`) VALUES (1,'El Molino',1),(2,'San Roque',2),(3,'Las Panosas',3),(4,'La Pampa',4),(5,'Virgen de Fatima',5),(6,'La Loma',6),(7,'El Carmen',6),(8,'Guadalquivir',6),(9,'57 Viviendas',6),(10,'Luis Pizarro',6),(11,'15 de Noviembre',6),(12,'Juan Pablo II',6),(13,'Virgen de Chaguaya',6),(14,'Libertad',6),(15,'Panamericano',6),(16,'15 de Agosto',6),(17,'La Torre',6),(18,'La Union',6),(19,'Carlos Wagnner',6),(20,'Paraiso',6),(21,'Los Alamos',6),(22,'Los Olivos',6),(23,'4 de Julio',7),(24,'12 de Octubre',7),(25,'IV Centenario',7),(26,'Defensores del Chaco',7),(27,'Las Pascuas',7),(28,'3 de Mayo',7),(29,'Los Chapacos',7),(30,'Maria de Los Angeles',7),(31,'15 de Junio',7),(32,'Municipal',7),(33,'19 de Marzo',7),(34,'20 de Enero',7),(35,'101 Familias',7),(36,'Nueva Esperanza',7),(37,'Eduardo Avaroa',8),(38,'Oscar Alfaro',8),(39,'San Jose',8),(40,'San Marcos',8),(41,'Lourdes',8),(42,'La Florida',8),(43,'Pascuas',8),(44,'Los Laureles',8),(45,'La Huerta',8),(46,'6 de Agosto',9),(47,'Salamanca',9),(48,'San Bernardo',9),(49,'Andaluz',9),(50,'02 de Mayo',9),(51,'Pedro Antonio Flores',9),(52,'Constructor',9),(53,'24 de Junio',9),(54,'Aniceto Arce',9),(55,'Narciso Campero',9),(56,'Luis Espinal',9),(57,'7 de Septimbre',9),(58,'Bartolome Atard',9),(59,'Moto Mendez',9),(60,'Juan XXIII',10),(61,'Rosedal',10),(62,'Juan Nicolay',10),(63,'15 de Abril',10),(64,'Aeropuerto',10),(65,'Morros Blancos',10),(66,'San Pedro',10),(67,'San Jorge 1',10),(68,'San Salvador',10),(69,'San Jorge 2',10),(70,'Artesanal',10),(71,'Lindo San Geronimo',11),(72,'San Geronimo Centro',11),(73,'San Geronimo Sud',11),(74,'San Luis',11),(75,'La Terminal',11),(76,'Petrolero',11),(77,'El Tejar',11),(78,'Miraflores',12),(79,'German Busch',12),(80,'Aranjuez Sud',12),(81,'San Martin',12),(82,'Luis de Fuentes',13),(83,'Catedral',13),(84,'San Antonio',13),(85,'San Blas',13),(86,'Alto Senac',13),(87,'Senac',13),(88,'Tabladita I',13),(89,'Tabladita II',13),(90,'Mendez Arcos',13),(91,'Palmas de Guadalupe',13);
/*!40000 ALTER TABLE `barrios` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `calendario_barrios` WRITE;
/*!40000 ALTER TABLE `calendario_barrios` DISABLE KEYS */;
INSERT INTO `calendario_barrios` (`id`, `fecha_aniversario`, `nombre_barrio`, `presidente_barrio`, `telefono_presidente`, `color_etiqueta`) VALUES (1,'2026-01-20','20 de Enero',NULL,NULL,'#f59e0b'),(2,'2026-01-27','La Torre',NULL,NULL,'#8b5cf6'),(3,'2026-02-11','Lourdes',NULL,NULL,'#f59e0b'),(4,'2026-02-23','Juan Nicolay',NULL,NULL,'#ec4899'),(5,'2026-03-19','19 de Marzo',NULL,NULL,'#f59e0b'),(6,'2026-03-19','San Jose',NULL,NULL,'#f59e0b'),(7,'2026-03-23','Eduardo Avaroa',NULL,NULL,'#f59e0b'),(8,'2026-03-25','La Pampa',NULL,NULL,'#3b82f6'),(9,'2026-03-31','Las Pascuas',NULL,NULL,'#f59e0b'),(10,'2026-04-15','Guadalquivir',NULL,NULL,'#8b5cf6'),(11,'2026-04-15','Libertad',NULL,NULL,'#8b5cf6'),(12,'2026-04-15','Los Chapacos',NULL,NULL,'#f59e0b'),(13,'2026-04-15','Andaluz',NULL,NULL,'#ec4899'),(14,'2026-04-15','15 de Abril',NULL,NULL,'#ec4899'),(15,'2026-04-16','Aniceto Arce',NULL,NULL,'#ec4899'),(16,'2026-04-23','San Jorge 1',NULL,NULL,'#ec4899'),(17,'2026-04-23','San Jorge 2',NULL,NULL,'#ec4899'),(18,'2026-04-25','San Marcos',NULL,NULL,'#f59e0b'),(19,'2026-04-26','Constructor',NULL,NULL,'#ec4899'),(20,'2026-05-02','02 de Mayo',NULL,NULL,'#ec4899'),(21,'2026-05-03','3 de Mayo',NULL,NULL,'#f59e0b'),(22,'2026-05-11','Luis Espinal',NULL,NULL,'#ec4899'),(23,'2026-05-13','Virgen de Fatima',NULL,NULL,'#8b5cf6'),(24,'2026-05-13','Juan Pablo II',NULL,NULL,'#8b5cf6'),(25,'2026-05-19','German Busch',NULL,NULL,'#6366f1'),(26,'2026-05-25','Mendez Arcos',NULL,NULL,'#6366f1'),(27,'2026-05-26','San Martin',NULL,NULL,'#6366f1'),(28,'2026-05-27','IV Centenario',NULL,NULL,'#f59e0b'),(29,'2026-05-27','La Florida',NULL,NULL,'#f59e0b'),(30,'2026-06-04','Los Laureles',NULL,NULL,'#f59e0b'),(31,'2026-06-11','Pedro Antonio Flores',NULL,NULL,'#ec4899'),(32,'2026-06-13','San Antonio',NULL,NULL,'#6366f1'),(33,'2026-06-14','Defensores del Chaco',NULL,NULL,'#f59e0b'),(34,'2026-06-15','15 de Junio',NULL,NULL,'#f59e0b'),(35,'2026-06-21','San Luis',NULL,NULL,'#6366f1'),(36,'2026-06-24','La Loma',NULL,NULL,'#8b5cf6'),(37,'2026-06-27','Aeropuerto',NULL,NULL,'#ec4899'),(38,'2026-06-29','San Pedro',NULL,NULL,'#ec4899'),(39,'2026-07-04','4 de Julio',NULL,NULL,'#f59e0b'),(40,'2026-07-16','El Carmen',NULL,NULL,'#8b5cf6'),(41,'2026-07-16','Lindo San Geronimo',NULL,NULL,'#6366f1'),(42,'2026-07-22','Municipal',NULL,NULL,'#f59e0b'),(43,'2026-07-25','La Terminal',NULL,NULL,'#6366f1'),(44,'2026-07-25','Morros Blancos',NULL,NULL,'#ec4899'),(45,'2026-07-30','Catedral',NULL,NULL,'#6366f1'),(46,'2026-07-31','Paraiso',NULL,NULL,'#8b5cf6'),(47,'2026-08-05','La Huerta',NULL,NULL,'#f59e0b'),(48,'2026-08-06','6 de Agosto',NULL,NULL,'#ec4899'),(49,'2026-08-15','Virgen de Chaguaya',NULL,NULL,'#8b5cf6'),(50,'2026-08-15','15 de Agosto',NULL,NULL,'#8b5cf6'),(51,'2026-08-16','San Roque',NULL,NULL,'#10b981'),(52,'2026-08-17','Tabladita I',NULL,NULL,'#6366f1'),(53,'2026-08-17','Tabladita II',NULL,NULL,'#6366f1'),(54,'2026-08-18','Nueva Esperanza',NULL,NULL,'#f59e0b'),(55,'2026-08-20','San Bernardo',NULL,NULL,'#ec4899'),(56,'2026-08-25','Bartolome Atard',NULL,NULL,'#ec4899'),(57,'2026-08-25','Miraflores',NULL,NULL,'#6366f1'),(58,'2026-09-05','Los Alamos',NULL,NULL,'#8b5cf6'),(59,'2026-09-06','Oscar Alfaro',NULL,NULL,'#f59e0b'),(60,'2026-09-07','7 de Septimbre',NULL,NULL,'#ec4899'),(61,'2026-09-10','Los Olivos',NULL,NULL,'#8b5cf6'),(62,'2026-09-11','Rosedal',NULL,NULL,'#ec4899'),(63,'2026-09-15','Luis Pizarro',NULL,NULL,'#8b5cf6'),(64,'2026-09-30','San Geronimo Centro',NULL,NULL,'#6366f1'),(65,'2026-10-01','El Tejar',NULL,NULL,'#6366f1'),(66,'2026-10-03','Salamanca',NULL,NULL,'#ec4899'),(67,'2026-10-05','Senac',NULL,NULL,'#6366f1'),(68,'2026-10-10','Moto Mendez',NULL,NULL,'#ec4899'),(69,'2026-10-12','12 de Octubre',NULL,NULL,'#f59e0b'),(70,'2026-10-16','El Molino',NULL,NULL,'#10b981'),(71,'2026-10-20','101 Familias',NULL,NULL,'#f59e0b'),(72,'2026-10-22','Luis de Fuentes',NULL,NULL,'#6366f1'),(73,'2026-10-26','Narciso Campero',NULL,NULL,'#ec4899'),(74,'2026-11-12','Carlos Wagnner',NULL,NULL,'#8b5cf6'),(75,'2026-11-13','Las Panosas',NULL,NULL,'#3b82f6'),(76,'2026-11-15','15 de Noviembre',NULL,NULL,'#8b5cf6'),(77,'2026-11-25','Juan XXIII',NULL,NULL,'#ec4899'),(78,'2026-12-03','La Union',NULL,NULL,'#8b5cf6'),(79,'2026-12-10','57 Viviendas',NULL,NULL,'#8b5cf6'),(80,'2026-12-12','Panamericano',NULL,NULL,'#8b5cf6'),(81,'2026-12-13','Palmas De Guadalupe',NULL,NULL,'#6366f1'),(82,'2026-12-16','Maria de Los Angeles',NULL,NULL,'#f59e0b'),(83,'2026-12-21','Petrolero',NULL,NULL,'#6366f1'),(84,'2026-12-29','San Geronimo Sud',NULL,NULL,'#6366f1'),(85,'2026-01-01','Feriado: A├â┬▒o Nuevo',NULL,NULL,'#ef4444'),(86,'2026-01-02','Feriado: Puente de A├â┬▒o Nuevo',NULL,NULL,'#ef4444'),(87,'2026-01-23','Feriado: D├â┬¡a del Estado Plurinacional',NULL,NULL,'#ef4444'),(88,'2026-02-16','Feriado: Carnaval (D├â┬¡a 1)',NULL,NULL,'#ef4444'),(89,'2026-02-17','Feriado: Carnaval (D├â┬¡a 2)',NULL,NULL,'#ef4444'),(90,'2026-04-03','Feriado: Viernes Santo',NULL,NULL,'#ef4444'),(91,'2026-04-15','Feriado: Aniversario Departamental de Tarija (La Tablada)',NULL,NULL,'#b91c1c'),(92,'2026-05-01','Feriado: D├â┬¡a del Trabajo',NULL,NULL,'#ef4444'),(93,'2026-06-04','Feriado: Corpus Christi',NULL,NULL,'#ef4444'),(94,'2026-06-05','Feriado: Puente Corpus Christi',NULL,NULL,'#ef4444'),(95,'2026-06-22','Feriado: A├â┬▒o Nuevo Andino Amaz├â┬│nico Chaque├â┬▒o',NULL,NULL,'#ef4444'),(96,'2026-08-06','Feriado: D├â┬¡a de la Independencia de Bolivia',NULL,NULL,'#ef4444'),(97,'2026-08-07','Feriado: Puente de la Independencia',NULL,NULL,'#ef4444'),(98,'2026-11-02','Feriado: D├â┬¡a de Todos los Difuntos',NULL,NULL,'#ef4444'),(99,'2026-12-25','Feriado: Navidad',NULL,NULL,'#ef4444');
/*!40000 ALTER TABLE `calendario_barrios` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `config_sistema` WRITE;
/*!40000 ALTER TABLE `config_sistema` DISABLE KEYS */;
INSERT INTO `config_sistema` (`clave`, `valor`) VALUES ('color_primario','#1a4731'),('nombre_entidad','Gobierno Aut├│nomo Municipal de Tarija'),('sigla_entidad','GAMT');
/*!40000 ALTER TABLE `config_sistema` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `detalle_arboles` WRITE;
/*!40000 ALTER TABLE `detalle_arboles` DISABLE KEYS */;
INSERT INTO `detalle_arboles` (`id_arbol`, `id_solicitud`, `id_especie`, `id_accion_solicitada`, `id_accion_realizar`, `observaciones_arbol`, `url_foto`) VALUES (1,1,18,2,2,'├ürbol ubicado en la acera p├║blica, de aproximadamente 11 metros.','fotos/arbol_1_0.jpg'),(6,4,76,7,8,'├ürbol ubicado en la acera p├║blica, de aproximadamente 9 metros.','fotos/arbol_4_0.jpg'),(7,5,74,5,5,'├ürbol ubicado en la acera p├║blica, de aproximadamente 3 metros.','fotos/arbol_5_0.jpg'),(9,7,3,5,1,'├ürbol ubicado en la acera p├║blica, de aproximadamente 7 metros.','fotos/arbol_7_0.jpg'),(12,9,63,4,4,'├ürbol ubicado en la acera p├║blica, de aproximadamente 3 metros.','fotos/arbol_9_0.jpg'),(13,10,8,3,3,'├ürbol ubicado en la acera p├║blica, de aproximadamente 12 metros.','fotos/arbol_10_0.jpg'),(14,11,41,1,1,'├ürbol ubicado en la acera p├║blica, de aproximadamente 6 metros.','fotos/arbol_11_0.jpg'),(18,14,55,6,6,'├ürbol ubicado en la acera p├║blica, de aproximadamente 5 metros.','fotos/arbol_14_0.jpg'),(19,15,68,1,1,'├ürbol ubicado en la acera p├║blica, de aproximadamente 10 metros.','fotos/arbol_15_0.jpg'),(20,15,67,3,3,'├ürbol ubicado en la acera p├║blica, de aproximadamente 8 metros.','fotos/arbol_15_1.jpg'),(21,16,75,4,2,'├ürbol ubicado en la acera p├║blica, de aproximadamente 4 metros.','fotos/arbol_16_0.jpg'),(23,18,59,4,3,'├ürbol ubicado en la acera p├║blica, de aproximadamente 6 metros.','fotos/arbol_18_0.jpg'),(24,19,23,7,3,'├ürbol ubicado en la acera p├║blica, de aproximadamente 11 metros.','fotos/arbol_19_0.jpg'),(25,19,7,1,1,'├ürbol ubicado en la acera p├║blica, de aproximadamente 9 metros.','fotos/arbol_19_1.jpg'),(27,21,62,5,5,'├ürbol exuberantemente grande, de aproximadamente 12 metros.','fotos/arbol_21_0.jpg'),(28,22,60,2,4,'├ürbol ubicado en la acera p├║blica, de aproximadamente 8 metros.','fotos/arbol_22_0.jpg'),(29,22,35,1,1,'├ürbol ubicado en la acera p├║blica, de aproximadamente 6 metros.','fotos/arbol_22_1.jpg'),(30,22,58,6,6,'├ürbol ubicado en la acera p├║blica, de aproximadamente 5 metros.','fotos/arbol_22_2.jpg'),(34,26,19,3,1,'Solo las puntas',NULL),(35,26,74,3,2,'Solo la parte alta',NULL),(36,24,76,2,8,'├ürbol ubicado en la acera p├║blica, de aproximadamente 9 metros.','fotos/arbol_24_0.jpg'),(37,27,NULL,4,NULL,NULL,NULL);
/*!40000 ALTER TABLE `detalle_arboles` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `distritos` WRITE;
/*!40000 ALTER TABLE `distritos` DISABLE KEYS */;
INSERT INTO `distritos` (`id_distrito`, `numero_distrito`) VALUES (1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(10,10),(11,11),(12,12),(13,13);
/*!40000 ALTER TABLE `distritos` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `especies_arboles` WRITE;
/*!40000 ALTER TABLE `especies_arboles` DISABLE KEYS */;
INSERT INTO `especies_arboles` (`id_especie`, `nombre_comun`, `nombre_cientifico`) VALUES (1,'Acacia de tres espinas','Gleditsia triacanthos'),(2,'Acacia / Aromo','Acacia caven'),(3,'Aca├¡ boliviano','Euterpe precatoria'),(4,'Alcornoque','Quercus suber'),(5,'Algarrobo','Prosopis spp.'),(6,'Aliso','Alnus acuminata'),(7,'├ülamo','Populus nigra'),(8,'├ülamo deltoide','Populus deltoides'),(9,'├ülamo plateado','Populus alba'),(10,'├ülamo vela','Populus nigra'),(11,'Algarrobo negro','Prosopis nigra'),(12,'Albarillo','Prunus armeniaca'),(13,'Araucaria','Araucaria bidwillii'),(14,'Arce','Acer campestre'),(15,'Bingo de Oro','Duranta repens'),(16,'Bolaina','Guazuma crinita'),(17,'Brachichito','Brachychiton populneus'),(18,'Camaju├║','Terminalia oblonga'),(19,'Carnaval','Cassia carnaval'),(20,'Casuarina','Casuarina equisetifolia'),(21,'Ceibo','Erythrina crista-galli'),(22,'Chamba / Leucacia','Leucaena leucocephala'),(23,'Cha├▒ar','Geoffroea decorticans'),(24,'Chirimoya','Annona cherimola'),(25,'Churqui','Acacia caven'),(26,'Cina cina','Parkinsonia aculeata'),(27,'Cipr├®s','Cupressus spp.'),(28,'Ciruelo','Prunus domestica'),(29,'Corona de cristo / Coronillo','Gledisia amorphoides'),(30,'Crespones / Cresp├│n','Lagerstroemia indica'),(31,'Cucarda','Hibiscus rosa-sinensis'),(32,'Cuyoja / Vilco','Anadenanthera colubrina'),(33,'Duranta','Duranta repens'),(34,'Durazno','Prunus persica'),(35,'Estrella Federal','Euphorbia pulcherrima'),(36,'Eucalipto','Eucalyptus spp.'),(37,'Ficus','Ficus benjamina'),(38,'Floripondio','Brugmansia arborea'),(39,'Fresno','Fraxinus spp.'),(40,'Gomero','Ficus elastica'),(41,'Granada','Punica granatum'),(42,'Granadilla','Passiflora ligularis'),(43,'Grevillea','Grevillea robusta'),(44,'Guaranguay','Tecoma stans'),(45,'Guayabo','Psidium guajava'),(46,'Guinda','Prunus cerasus'),(47,'Higuera','Ficus carica'),(48,'Ibirapit├í / Run Run','Peltophorum dubium'),(49,'Jarca','Vachellia aroma'),(50,'Jasmin paraguayo','Brunfelsia calycina'),(51,'Janchicha','Parajubaea sunkha'),(52,'Lapacho','Tabebuia spp.'),(53,'Lapacho amarillo','Handroanthus albus'),(54,'Lapacho blanco','Handroanthus serratifolius'),(55,'Lapacho rosado','Handroanthus impetiginosus'),(56,'Laurel','Ocotea spp.'),(58,'Laurel rosa / Rosa laurel','Nerium oleander'),(59,'Lecher├│n','Euphorbia cotinifolia'),(60,'Ligustre','Ligustrum lucidum'),(61,'Ligustrillo','Ligustrum vulgare'),(62,'Limonero','Citrus limon'),(63,'Magnolia','Magnolia grandiflora'),(64,'Mandarina','Citrus reticulata'),(65,'Manzana','Malus domestica'),(66,'Mara','Swietenia macrophylla'),(67,'Membrillo','Cydonia oblonga'),(68,'Molle','Schinus molle'),(69,'Molle chileno','Schinus fasciculatus'),(70,'Mora','Morus nigra'),(71,'Motac├║','Attalea phalerata'),(72,'Naranjo','Citrus sinensis'),(73,'Naranjo agrio','Citrus aurantium'),(74,'N├¡spero','Eriobotrya japonica'),(75,'Nogal','Juglans spp.'),(76,'Olivo','Olea europaea'),(77,'Olmo','Ulmus spp.'),(80,'Palma real','Syagrus romanzoffiana'),(81,'Palmera abanico','Livistona chinensis'),(83,'Palmera (General)','Arecaceae spp.'),(84,'Palta','Persea americana'),(85,'Papaya','Carica papaya'),(86,'Para├¡so','Melia azedarach'),(87,'Pata de vaca','Bauhinia forficata'),(88,'Pino de cerro','Podocarpus parlatorei'),(89,'Pino patula','Pinus patula'),(90,'Pino radiata','Pinus radiata'),(91,'Pino vela','Cupressus sempervirens'),(92,'Pino (General)','Pinus spp.'),(93,'Pomelo','Citrus paradisi'),(94,'Quebracho colorado','Schinopsis balansae'),(95,'Santa Rita','Bougainvillea sp.'),(96,'Sauce criollo','Salix humboldtiana'),(97,'Sauce llor├│n','Salix babylonica'),(98,'Senasina','Senna spectabilis'),(99,'Soto','Schinopsis haenkeana'),(100,'Taco / Algarrobo blanco','Prosopis alba'),(101,'Tarco','Jacaranda mimosifolia'),(102,'Timboy','Enterolobium contortisiliquium'),(103,'Tipa','Tipuana tipu'),(104,'Toborochi','Ceiba speciosa'),(105,'Tusca','Acacia aroma'),(106,'Urund├®y','Astronium urundeuva'),(107,'No Determinado',NULL);
/*!40000 ALTER TABLE `especies_arboles` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `instituciones` WRITE;
/*!40000 ALTER TABLE `instituciones` DISABLE KEYS */;
INSERT INTO `instituciones` (`id_institucion`, `id_tipo_solicitante`, `nombre_institucion`) VALUES (1,1,'Bella Vista'),(2,1,'Churquis'),(3,1,'Guerrahuayco'),(4,1,'La Pintada'),(5,1,'Lazareto'),(6,1,'Monte Cercado'),(7,1,'Pampa Redonda'),(8,1,'Polla'),(9,1,'San Agust├¡n'),(10,1,'San Jacinto'),(11,1,'San Mateo'),(12,1,'San Pedro de Sola'),(13,1,'Santa Ana la Nueva'),(14,1,'Sella Cercado'),(15,1,'Tolomosa Grande'),(16,1,'Tolomosita'),(17,1,'Turumayo'),(18,1,'Yesera'),(19,2,'15 de Noviembre'),(20,2,'3 de Mayo'),(21,2,'Aranjuez Sud'),(22,2,'Constructor'),(23,2,'Fabril'),(24,2,'German Busch'),(25,2,'Guadalquivir'),(26,2,'IV Centenario'),(27,2,'Nestor Paz'),(28,2,'Palmarcito'),(29,2,'Prosalud'),(30,2,'Hospital Obrero'),(31,3,'Despacho Municipal'),(32,3,'Secretaria Municipal de Infraestructura y Servicios P├║blicos'),(33,3,'Consejo Municipal'),(34,3,'Secretaria Municipal de Planificaci├│n Integral Para El Desarrollo'),(35,3,'Secretaria Municipal de Desarrollo Humano Salud y Deportes'),(36,3,'Direcci├│n de Ingreso - Oficina de Parqueos Municipales'),(37,3,'Entidad de Ordenamiento Territorial de Tarija'),(38,3,'Monasterio Santa Clara'),(39,3,'Sedes'),(40,4,'Infocal'),(41,4,'Cosaalt'),(42,4,'Setar'),(43,4,'Universidad Cat├│lica Boliviana'),(44,4,'Uajms Facultad de Humanidades'),(45,4,'Facultad de Ciencias Agr├¡colas y Forestales'),(46,4,'Asociaci├│n de Comerciantes Minorista 20 de Mayo'),(47,4,'Sindicato de Transporte de Pasajeros La Tablada'),(48,4,'Polic├¡a Bolivia Direcci├│n Departamental Fuerza Especial de Lucha Contra El Crimen'),(49,4,'Epi Morros Blancos'),(50,4,'Tercera Division del Ejercito \"tcnl Padilla\"'),(51,4,'Asociacion de Promesantes Chunchos'),(52,4,'Asociaci├│n Conciencia Ecol├│gica'),(53,6,'Mercado Lourdes'),(54,6,'Mercado Luis de Fuentes'),(55,5,'Junta Vecinal (General)'),(56,7,'Alberto Baldivieso'),(57,7,'Avelina Ra├▒a'),(58,7,'Jos├® Manuel Belgrano'),(59,7,'Bernardo Navajas Trigo'),(60,7,'Bolivia'),(61,7,'Carmen Mealla'),(62,7,'Casterford Castellanos'),(63,7,'Colegio Nacional San Luis'),(64,7,'Edifu'),(65,7,'Esteban Megliaci'),(66,7,'Felipe Palaz├│n'),(67,7,'Hernan Gmeiner'),(68,7,'Humberto Portocarrero I'),(69,7,'Humberto Portocarrero II'),(70,7,'Humberto Portocarrero III'),(71,7,'Jos├® Manuel ├üvila'),(72,7,'Juan XXIII'),(73,7,'Juana Azurduy de Padilla'),(74,7,'Julio Calvo'),(75,7,'La Paz'),(76,7,'Luis de Fuentes'),(77,7,'Ubeet'),(78,7,'Prodat');
/*!40000 ALTER TABLE `instituciones` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `solicitudes_poda` WRITE;
/*!40000 ALTER TABLE `solicitudes_poda` DISABLE KEYS */;
INSERT INTO `solicitudes_poda` (`id_solicitud`, `codigo_anual`, `fecha_ingreso`, `comunicacion_interna`, `id_tipo_solicitante`, `id_institucion`, `nombre_solicitante`, `telefono_solicitante`, `nota_solicitud_sucia`, `id_distrito`, `id_barrio`, `calle`, `numero_casa`, `referencia_casa`, `ubicacion_gps`, `fecha_inspeccion`, `id_tecnico_verificador`, `esta_verificado`, `requiere_plataforma`, `requiere_ficha_tecnica`, `procede_solicitud`, `es_arbol_seco`, `es_emergencia`, `urgencia`, `estado_general`, `fecha_execution`, `id_tecnico_ejecucion`, `observacion_ejecucion`, `observacion_verificacion`, `trabajos_extra`) VALUES (1,'002/26','2026-03-19','CI-797/2026',1,NULL,'Sonia Mart├¡nez','6699923','Pide podar urgente porque hay un nido de avispas grandes que ataca a la gente que pasa.',7,23,'Calle Ingavi N┬░ 238','63','Detr├ís de la iglesia evang├®lica.','-21.537956, -64.736987','2026-03-23',NULL,'S├¡',1,1,1,0,0,'Media','Terminado','2026-03-30',NULL,'Poda ejecutada. El vecino inicialmente se opon├¡a a que cortemos tanto, pero al final entendi├│ el riesgo t├®cnico.',NULL,'Ninguno'),(4,'032/26','2026-05-18',NULL,7,14,'Director(a) de Edifu','7562634','El vecino indica que el pr├│ximo mes es el aniversario del barrio y quieren que la plaza se vea limpia y bonita.',11,75,'Calle Sucre N┬░ 148','11','Frente al colegio, puerta de garaje negra.','-21.537243, -64.738872','2026-05-23',NULL,'S├¡',0,1,1,0,0,'Media','En espera',NULL,NULL,NULL,NULL,NULL),(5,'046/26','2026-01-16','CI-287/2026',1,NULL,'Mar├¡a Vargas','7709322','Menciona que las ramas tapan el letrero comercial de su tienda y las hojas trancan su canaleta de desag├╝e.',6,17,'Calle Alejandro del Carpio N┬░ 218','29','A la vuelta de la tienda de barrio Do├▒a Mar├¡a.','-21.538573, -64.735166','2026-01-19',NULL,'S├¡',0,0,1,0,0,'Baja','Terminado','2026-01-26',NULL,'Se retir├│ el toc├│n superficial usando maquinaria pesada. Aceras despejadas.',NULL,'Ninguno'),(7,'112/26','2026-02-18','CI-263/2026',1,NULL,'Jorge Ch├ívez','6316279','Solicita derribe porque las ra├¡ces est├ín levantando toda la acera de cemento y est├ín rompiendo el tubo de agua potable.',7,28,'Av. Las Am├®ricas N┬░ 292','58','Frente al colegio, puerta de garaje negra.','-21.532158, -64.733596','2026-02-21',NULL,'S├¡',0,0,1,0,0,'Baja','Terminado','2026-02-28',NULL,'Trabajo realizado parcialmente, no se pudo cortar una rama principal debido a la proximidad extrema con cables de SETAR de alta tensi├│n. Pendiente coordinaci├│n.',NULL,'Ninguno'),(9,'129/26','2026-02-19',NULL,1,NULL,'Ramiro Ch├ívez','6990425','El ├írbol sufri├│ una rajadura en el tronco principal tras la ├║ltima granizada y parece que se va a partir a la mitad.',7,34,'Av. Las Am├®ricas N┬░ 263','10','Justo en la esquina frente al surtidor.','-21.533816, -64.739194','2026-02-20',NULL,'S├¡',1,0,1,0,0,'Media','Terminado','2026-02-23',4,'Se retir├│ el toc├│n superficial usando maquinaria pesada. Aceras despejadas.',NULL,'Ninguno'),(10,'156/26','2026-03-24',NULL,7,6,'Director(a) de Monte Cercado','7578762','El ├írbol est├í completamente seco desde el a├▒o pasado y hay riesgo de que caiga sobre el techo de calamina de su vecino si hay una tormenta.',6,6,'Calle Comercio N┬░ 45','71','Al frente de la plaza principal, port├│n verde.','-21.533036, -64.733560','2026-03-26',NULL,'S├¡',1,1,1,1,0,'Alta','Terminado','2026-04-03',4,'Se realiz├│ la poda de todas las ramas secas con ├®xito. El vecino qued├│ conforme.',NULL,'Ninguno'),(11,'234/26','2026-04-18','CI-253/2026',7,15,'Director(a) de Sella Cercado','6967060','El ├írbol sufri├│ una rajadura en el tronco principal tras la ├║ltima granizada y parece que se va a partir a la mitad.',9,58,'Calle Madrid N┬░ 215','35','Al frente de la plaza principal, port├│n verde.','-21.531777, -64.736024','2026-04-22',NULL,'S├¡',0,0,1,0,0,'Media','Terminado','2026-05-01',4,'Atendido de emergencia inmediata por ├írbol ca├¡do en v├¡a p├║blica. Se troz├│ el tronco y se habilit├│ el tr├ífico.',NULL,'Ninguno'),(14,'314/26','2026-01-08','CI-584/2026',7,7,'Director(a) de Pampa Redonda','7233816','Pide podar urgente porque hay un nido de avispas grandes que ataca a la gente que pasa.',7,24,'Calle La Paz N┬░ 285','41','Detr├ís de la iglesia evang├®lica.','-21.534830, -64.736806','2026-01-11',NULL,'S├¡',0,1,1,0,1,'Alta','Terminado','2026-01-14',11,'Trabajo realizado parcialmente, no se pudo cortar una rama principal debido a la proximidad extrema con cables de SETAR de alta tensi├│n. Pendiente coordinaci├│n.',NULL,'Se realiz├│ poda de ra├¡z extra a un ├írbol colindante a solicitud del supervisor.'),(15,'318/26','2026-03-11','CI-840/2026',1,NULL,'Jorge Ch├ívez','6681498','El vecino indica que el pr├│ximo mes es el aniversario del barrio y quieren que la plaza se vea limpia y bonita.',12,80,'Av. Integraci├│n N┬░ 27','94','Frente al colegio, puerta de garaje negra.','-21.532320, -64.738151','2026-03-13',NULL,'S├¡',1,0,1,0,0,'Media','Terminado','2026-03-21',4,'Se realiz├│ la poda de todas las ramas secas con ├®xito. El vecino qued├│ conforme.',NULL,'Ninguno'),(16,'326/26','2026-02-12',NULL,1,NULL,'Ana Mendoza','7847952','Solicitud de poda de ra├¡ces porque ya est├ín rajando el muro perimetral de la casa y hay peligro de derrumbe.',6,17,'Calle Comercio N┬░ 281','74','A media cuadra de la posta policial.','-21.537549, -64.734898','2026-02-16',NULL,'S├¡',0,1,1,0,0,'Baja','Terminado','2026-02-23',NULL,'Se hizo el despunte de reducci├│n de copa sin novedades. Todo tranquilo.',NULL,'Ninguno'),(18,'359/26','2026-03-07','CI-401/2026',1,NULL,'Luisa L├│pez','7311130','Pide podar urgente porque hay un nido de avispas grandes que ataca a la gente que pasa.',7,26,'Calle Sucre N┬░ 110','19','A media cuadra de la posta policial.','-21.537522, -64.739775','2026-03-09',NULL,'S├¡',0,1,1,0,0,'Baja','Terminado','2026-03-13',NULL,'Se procedi├│ al derribe completo del esp├®cimen seco. Se requiri├│ apoyo de cami├│n gr├║a por la altura.',NULL,'Ninguno'),(19,'361/26','2026-01-13','CI-466/2026',1,NULL,'Mar├¡a Cross','7233215','El vecino indica que el pr├│ximo mes es el aniversario del barrio y quieren que la plaza se vea limpia y bonita.',11,74,'Calle Comercio N┬░ 296','93','Cerca de la parada del micro de la l├¡nea 4.','-21.539860, -64.736074','2026-01-14',NULL,'S├¡',1,1,1,0,0,'Baja','Terminado','2026-01-20',NULL,'Se procedi├│ al derribe completo del esp├®cimen seco. Se requiri├│ apoyo de cami├│n gr├║a por la altura.',NULL,'Ninguno'),(21,'388/26','2026-04-15','CI-509/2026',1,NULL,'Ana Flores','7848604','Menciona que las ramas tapan el letrero comercial de su tienda y las hojas trancan su canaleta de desag├╝e.',11,74,'Calle Corrado N┬░ 201','35','A la vuelta de la tienda de barrio Do├▒a Mar├¡a.','-21.534812, -64.735071','2026-04-16',NULL,'S├¡',1,1,1,0,0,'Baja','Terminado','2026-04-20',4,'Se realiz├│ la poda de todas las ramas secas con ├®xito. El vecino qued├│ conforme.',NULL,'Se realiz├│ poda de ra├¡z extra a un ├írbol colindante a solicitud del supervisor.'),(22,'392/26','2026-01-16',NULL,2,21,'Director(a) de 3 de Mayo','7730953','Solicita derribe porque las ra├¡ces est├ín levantando toda la acera de cemento y est├ín rompiendo el tubo de agua potable.',7,24,'Calle Col├│n N┬░ 63','26','Al frente de la plaza principal, port├│n verde.','-21.536340, -64.737107','2026-01-21',NULL,'S├¡',0,0,1,0,0,'Media','Terminado','2026-01-30',4,'Atendido de emergencia inmediata por ├írbol ca├¡do en v├¡a p├║blica. Se troz├│ el tronco y se habilit├│ el tr├ífico.',NULL,'Ninguno'),(24,'409/26','2026-04-12','COD. 452/26',1,NULL,'Jorge Vargas','6584281','Solicitud de poda de ra├¡ces porque ya est├ín rajando el muro perimetral de la casa y hay peligro de derrumbe.',9,58,'Calle Comercio N┬░ 124','77','Al frente de la plaza principal, port├│n verde.','-21.533276, -64.731778','2026-04-16',NULL,'S├¡',0,0,1,0,0,'Media','En espera',NULL,NULL,NULL,'├ürbol ubicado en la acera p├║blica, de aproximadamente 9 metros.','Ninguno'),(26,'026/26','2026-06-06','COD. 1234/26',3,31,'Kevin Perez','78451256','Atender lo antes posible',12,81,'Las pascuas esquin lopez','125','Atras del circo','-21.537921, -64.730072','2026-06-06',NULL,'S├¡',1,1,1,1,1,'Alta','En espera',NULL,NULL,NULL,'Coordinar con el solicitante','Ninguno'),(27,'017/26','2026-06-06',NULL,NULL,NULL,'Alex Subia','65458721','Se esta caendo este arbol',NULL,NULL,'Calle lopes esquina junin',NULL,NULL,'-21.53348972873318, -64.73899841308595',NULL,NULL,'No',0,0,0,0,0,'Media','En espera',NULL,NULL,NULL,NULL,'Ninguno');
/*!40000 ALTER TABLE `solicitudes_poda` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `tipos_solicitantes` WRITE;
/*!40000 ALTER TABLE `tipos_solicitantes` DISABLE KEYS */;
INSERT INTO `tipos_solicitantes` (`id_tipo_solicitante`, `nombre_tipo`) VALUES (1,'├ürea Rural'),(2,'Centro de Salud'),(3,'Instituci├│n P├║blica / Municipal'),(4,'Instituci├│n / Asociaci├│n'),(5,'Organizaci├│n Vecinal'),(6,'Mercado Municipal'),(7,'Unidad Educativa');
/*!40000 ALTER TABLE `tipos_solicitantes` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;



-- Personal (sin fotos, se re-suben desde la UI)
stmt
INSERT INTO personal (id_personal,\nombre_completo,cedula_id,cargo,contacto,contrato,usuario,contrasena,
ole,email,estado,echa_ingreso,echa_nacimiento,\tipo_sangre,contacto_emergencia,celular_emergencia,oto,id_equipo,
ol_equipo) VALUES(1,'CIMAR LUIS FARFAN FIGUEROA','4124454 Tja.','Responsable de ┴rea','73482164','Plazo Fijo','CIMAR 
LUIS FARFAN FIGUEROA','$2b$10$6Z5nkFmUGUwxT6AcxJ4Q9esDhW/r8EhMlBbrx.YyFO/QMExa2KMQK','ADMIN','','Activo',NULL,NULL,NULL
,NULL,NULL,NULL,NULL,NULL),\n(3,'KEVIN FLORES VALLEJOS','GEN_1780717546631','TÚcnico de 
sistemas','69309970','Administrativo','KEVIN FLORES VALLEJOS','$2b$10$Jkjw7GkR02kiOR95Uzr3hOMnjlJbdg2ckM/wYT0p46ox1.0ft
ndfy','ROOT','','Activo','2014-08-07','1995-09-18','O+','Madre','70224507',NULL,NULL,NULL),\n(4,'EDWIN LOPEZ 
HOYOS','GEN_1780716974369','TÚcnico de equipo','72996464','Permanente 
(═tem)',NULL,NULL,'TECNICO',NULL,'Activo',NULL,NULL,NULL,NULL,NULL,NULL,1,'TÚcnico de equipo'),\n(5,'ROBERTO CHAVARRIA 
QUISPE','GEN_1780716982173','Trepador','78247901','ADMINISTRATIVO',NULL,NULL,'TECNICO',NULL,'Activo',NULL,NULL,NULL,NUL
L,NULL,NULL,1,'Cargador'),\n(6,'ROBERTO NARVAEZ','GEN_1780716988694','Trepador','75113822','Permanente 
(═tem)',NULL,NULL,'TECNICO',NULL,'Activo',NULL,NULL,NULL,NULL,NULL,NULL,1,'C;


