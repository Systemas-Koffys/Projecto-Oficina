-- MySQL dump 10.13  Distrib 9.7.0, for Linux (x86_64)
--
-- Host: localhost    Database: dboficina
-- ------------------------------------------------------
-- Server version	9.7.0

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

--
-- Table structure for table `acciones`
--

DROP TABLE IF EXISTS `acciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acciones` (
  `id` int NOT NULL,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acciones`
--

LOCK TABLES `acciones` WRITE;
/*!40000 ALTER TABLE `acciones` DISABLE KEYS */;
INSERT INTO `acciones` VALUES (1,'Poda de Formación'),(2,'Despunte'),(3,'Derribe Controlado'),(4,'Emergencia'),(5,'Poda de Raíces'),(6,'Extracción de Tocón'),(7,'Poda General'),(8,'No Determinado');
/*!40000 ALTER TABLE `acciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `barrios`
--

DROP TABLE IF EXISTS `barrios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `barrios` (
  `id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `id_distrito` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_distrito` (`id_distrito`),
  CONSTRAINT `barrios_ibfk_1` FOREIGN KEY (`id_distrito`) REFERENCES `distritos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `barrios`
--

LOCK TABLES `barrios` WRITE;
/*!40000 ALTER TABLE `barrios` DISABLE KEYS */;
INSERT INTO `barrios` VALUES (1,'EL MOLINO',1),(2,'SAN ROQUE',2),(3,'LAS PANOSAS',3),(4,'LA PAMPA',4),(5,'VIRGEN DE FATIMA',5),(6,'LA LOMA',6),(7,'EL CARMEN',6),(8,'GUADALQUIVIR',6),(9,'57 VIVIENDAS',6),(10,'LUIS PIZARRO',6),(11,'15 DE NOVIEMBRE',6),(12,'JUAN PABLO II',6),(13,'VIRGEN DE CHAGUAYA',6),(14,'LIBERTAD',6),(15,'PANAMERICANO',6),(16,'15 DE AGOSTO',6),(17,'LA TORRE',6),(18,'LA UNION',6),(19,'CARLOS WAGNNER',6),(20,'PARAISO',6),(21,'LOS ALAMOS',6),(22,'LOS OLIVOS',6),(23,'4 DE JULIO',7),(24,'12 DE OCTUBRE',7),(25,'IV CENTENARIO',7),(26,'DEFENSORES DEL CHACO',7),(27,'LAS PASCUAS',7),(28,'3 DE MAYO',7),(29,'LOS CHAPACOS',7),(30,'MARIA DE LOS ANGELES',7),(31,'15 DE JUNIO',7),(32,'MUNICIPAL',7),(33,'19 DE MARZO',7),(34,'20 DE ENERO',7),(35,'101 FAMILIAS',7),(36,'NUEVA ESPERANZA',7),(37,'EDUARDO AVAROA',8),(38,'OSCAR ALFARO',8),(39,'SAN JOSE',8),(40,'SAN MARCOS',8),(41,'LOURDES',8),(42,'LA FLORIDA',8),(43,'PASCUAS',8),(44,'LOS LAURELES',8),(45,'LA HUERTA',8),(46,'6 DE AGOSTO',9),(47,'SALAMANCA',9),(48,'SAN BERNARDO',9),(49,'ANDALUZ',9),(50,'02 DE MAYO',9),(51,'PEDRO ANTONIO FLORES',9),(52,'CONSTRUCTOR',9),(53,'24 DE JUNIO',9),(54,'ANICETO ARCE',9),(55,'NARCISO CAMPERO',9),(56,'LUIS ESPINAL',9),(57,'7 DE SEPTIMBRE',9),(58,'BARTOLOME ATARD',9),(59,'MOTO MENDEZ',9),(60,'JUAN XXIII',10),(61,'ROSEDAL',10),(62,'JUAN NICOLAY',10),(63,'15 DE ABRIL',10),(64,'AEROPUERTO',10),(65,'MORROS BLANCOS',10),(66,'SAN PEDRO',10),(67,'SAN JORGE 1',10),(68,'SAN SALVADOR',10),(69,'SAN JORGE 2',10),(70,'ARTESANAL',10),(71,'LINDO SAN GERONIMO',11),(72,'SAN GERONIMO CENTRO',11),(73,'SAN GERONIMO SUD',11),(74,'SAN LUIS',11),(75,'LA TERMINAL',11),(76,'PETROLERO',11),(77,'EL TEJAR',11),(78,'MIRAFLORES',12),(79,'GERMAN BUSCH',12),(80,'ARANJUEZ SUD',12),(81,'SAN MARTIN',12),(82,'LUIS DE FUENTES',13),(83,'CATEDRAL',13),(84,'SAN ANTONIO',13),(85,'SAN BLAS',13),(86,'ALTO SENAC',13),(87,'SENAC',13),(88,'TABLADITA I',13),(89,'TABLADITA II',13),(90,'MENDEZ ARCOS',13);
/*!40000 ALTER TABLE `barrios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendario_barrios`
--

DROP TABLE IF EXISTS `calendario_barrios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendario_barrios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha_aniversario` date NOT NULL,
  `nombre_barrio` varchar(255) NOT NULL,
  `presidente_barrio` varchar(255) DEFAULT NULL,
  `telefono_presidente` varchar(50) DEFAULT NULL,
  `color_etiqueta` varchar(50) DEFAULT '#4caf50',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendario_barrios`
--

LOCK TABLES `calendario_barrios` WRITE;
/*!40000 ALTER TABLE `calendario_barrios` DISABLE KEYS */;
INSERT INTO `calendario_barrios` VALUES (1,'2026-05-01','VIRGEN DE CHAGUAYA','jose perez','78451236','#4a10b7'),(2,'2026-05-02','San Roque','Juan P??rez','71234567','#e11d48'),(3,'2026-05-10','F??tima','Mar??a L??pez','78901234','#2563eb'),(4,'2026-05-15','Senac','Carlos Garc??a','76543210','#16a34a'),(5,'2026-05-20','Juan XXIII','Ana Mart??nez','75432109','#d97706'),(6,'2026-05-25','Los Chapacos','Luis Rodr??guez','71122334','#9333ea'),(7,'2026-05-30','El Carmen','Elena G??mez','72233445','#0891b2'),(8,'2026-06-03','Las Panosas','Roberto D??az','73344556','#4f46e5'),(9,'2026-06-08','La Loma','Sof??a Romero','74455667','#ea580c'),(10,'2026-06-12','Abaroa','Miguel S??nchez','75566778','#65a30d'),(11,'2026-06-18','Tabladita','Laura Torres','76677889','#0d9488'),(12,'2026-06-22','Lourdes','Pedro Flores','77788990','#c026d3'),(13,'2026-06-28','Morros Blancos','Carmen Ruiz','78899001','#be123c'),(14,'2026-07-04','Villa Avaroa','Jorge Vargas','79900112','#1d4ed8'),(15,'2026-07-09','Defensores del Chaco','Teresa Castro','71011223','#b45309'),(16,'2026-07-14','Palmarcito','Ra??l Ortiz','72122334','#15803d'),(17,'2026-07-20','Luis Pizarro','Patricia Silva','73233445','#a21caf'),(18,'2026-07-25','El Constructor','Mario Reyes','74344556','#be185d'),(19,'2026-07-31','Sim??n Bol??var','Rosa M??ndez','75455667','#0369a1'),(20,'2026-08-05','San Jos??','Hugo Navarro','76566778','#4338ca'),(21,'2026-08-10','Central','Silvia R??os','77677889','#c2410c'),(22,'2026-08-16','Guadalquivir','Andr??s Mendoza','78788990','#4d7c0f'),(23,'2026-08-21','Aranjuez','Gloria Morales','79899001','#0f766e'),(24,'2026-08-26','M??ndez Arcos','Ricardo Vega','71900112','#a21caf'),(25,'2026-08-30','San Bernardo','Luc??a Herrera','72011223','#9f1239'),(26,'2026-09-02','Los Olivos','Esteban Aguilar','73122334','#1e40af'),(27,'2026-09-07','San Mart??n','Victoria Pe??a','74233445','#b45309'),(28,'2026-09-13','San Jer??nimo','Fernando Cruz','75344556','#166534'),(29,'2026-09-18','San Luis','Isabel Delgado','76455667','#86198f'),(30,'2026-09-24','Aeropuerto','Gabriel C??rdenas','77566778','#9d174d'),(31,'2026-09-29','Miraflores','M??nica Salazar','78677889','#075985'),(32,'2026-10-04','San Mateo','H??ctor Cabrera','79788990','#3730a3'),(33,'2026-10-09','La Florida','Alicia Vald??s','71899001','#9a3412'),(34,'2026-10-15','San Blas','Francisco Medina','72900112','#3f6212'),(35,'2026-10-20','Eulogio Ruiz','Daniela R??os','73011223','#115e59'),(36,'2026-10-25','Mendietas','Arturo Gil','74122334','#701a75'),(37,'2026-10-31','Pedro Antonio Flores','Sonia Le??n','75233445','#881337'),(38,'2026-11-05','Villa F??tima','V??ctor Ponce','76344556','#1e3a8a'),(39,'2026-11-10','15 de Abril','Natalia Moya','77455667','#7c2d12'),(40,'2026-11-16','Barrio Nuevo','Rodrigo Blanco','78566778','#14532d'),(41,'2026-11-21','Luis Espinal','Valeria Soto','79677889','#581c87'),(42,'2026-11-26','Rosedal','Guillermo Pacheco','71788990','#831843'),(43,'2026-11-30','Moyatas','Carolina Paz','72899001','#0c4a6e'),(44,'2026-12-04','Villa Busch','Julio Paredes','73900112','#312e81'),(45,'2026-12-09','El Trigal','Teresa Rojas','74011223','#78350f'),(46,'2026-12-14','Las Rosas','Mart??n Su??rez','75122334','#064e3b'),(47,'2026-12-20','La Pampa','Diana Mu??oz','76233445','#4c1d95'),(48,'2026-12-25','El Molino','Felipe Ortiz','77344556','#9f1239'),(49,'2026-12-30','1 de Mayo','Renata Dom??nguez','78455667','#082f49');
/*!40000 ALTER TABLE `calendario_barrios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config_sistema`
--

DROP TABLE IF EXISTS `config_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config_sistema` (
  `clave` varchar(100) NOT NULL,
  `valor` text,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config_sistema`
--

LOCK TABLES `config_sistema` WRITE;
/*!40000 ALTER TABLE `config_sistema` DISABLE KEYS */;
INSERT INTO `config_sistema` VALUES ('color_primario','#1a4731'),('nombre_entidad','Gobierno Autónomo Municipal de Tarija'),('sigla_entidad','GAMT');
/*!40000 ALTER TABLE `config_sistema` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `distritos`
--

DROP TABLE IF EXISTS `distritos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `distritos` (
  `id` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `distritos`
--

LOCK TABLES `distritos` WRITE;
/*!40000 ALTER TABLE `distritos` DISABLE KEYS */;
INSERT INTO `distritos` VALUES (1,'Distrito 1'),(2,'Distrito 2'),(3,'Distrito 3'),(4,'Distrito 4'),(5,'Distrito 5'),(6,'Distrito 6'),(7,'Distrito 7'),(8,'Distrito 8'),(9,'Distrito 9'),(10,'Distrito 10'),(11,'Distrito 11'),(12,'Distrito 12'),(13,'Distrito 13');
/*!40000 ALTER TABLE `distritos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `especies`
--

DROP TABLE IF EXISTS `especies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especies` (
  `id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `especies`
--

LOCK TABLES `especies` WRITE;
/*!40000 ALTER TABLE `especies` DISABLE KEYS */;
INSERT INTO `especies` VALUES (1,'Acacia (Aromo)'),(2,'Alcornoque (Quercus suber l.)'),(3,'Algarrobo (Prosopis spp.)'),(4,'Arce (Acer spp.)'),(5,'Carnaval (Cassia carnaval)'),(6,'Casuarina (Casuarina equisetifolia)'),(7,'Ceibo (Erythrina crista-galli)'),(8,'Chañar (Geoffroea decorticans)'),(9,'Churqui (Acacia (Aromo) caven)'),(10,'Ciprés (Cupressus spp.)'),(11,'Ciruelo (Prunus domestica)'),(12,'Cucarda (hibiscus rosa-sinensis)'),(13,'Crespón (lagerstroemia indica)'),(14,'Eucalipto (eucalyptus spp.)'),(15,'Fresno (fraxinus spp.)'),(16,'Grevillea (grevillea robusta)'),(17,'Guaranguay (schinopsis balansae)'),(18,'Jarca (Vachellia aroma)'),(19,'Lapacho blanco (handroanthus serratifolius)'),(20,'Lapacho rosado (handroanthus impetiginosus)'),(21,'Lapacho amarillo (handroanthus albus)'),(22,'Lapacho morado (handroanthus heptaphyllus)'),(23,'Lapacho negro (handroanthus chrysanthus)'),(24,'Laurel (ocotea spp.)'),(25,'Lecherón (euphorbia cotinifolia)'),(26,'Leucacia (leucaena leucocephala)'),(27,'Ligustre (ligustrum lucidum)'),(28,'Limonero (citrus limon)'),(29,'Mora (Morus nigra)'),(30,'Mara (Swietenia macrophylla King)'),(31,'Molle (schinus molle)'),(32,'Naranjo (citrus sinensis)'),(33,'Níspero (eriobotrya japonica)'),(34,'Nogal (juglans spp.)'),(35,'Olmo (ulmus spp.)'),(36,'Palmera (arecaceae spp.)'),(37,'Motacú (attalea phalerata)'),(38,'Janchicha (parajubaea sunkha)'),(39,'Acai boliviano (euterpe precatoria)'),(40,'Palma real (syagrus romanzoffiana)'),(41,'Pachiuva (socratea exorrhiza)'),(42,'Paraíso (melia azedarach)'),(43,'Pino (pinus spp.)'),(44,'Sauce (salix spp.)'),(45,'Senasina (senna spectabilis)'),(46,'Taco (erythrina spp.)'),(47,'Tarco (jacaranda mimosifolia)'),(48,'Timboy (enterolobium contortisiliquum)'),(49,'Toborochi (ceiba speciosa)'),(50,'Mara (swietenia macrophylla)'),(51,'Bolaina (guazuma crinita)'),(52,'Camajuu (terminalia oblonga)'),(53,'Cuyoja (anadenanthera colubrina)'),(54,'Soto (schinopsis haenkeana)'),(55,'Aliso (alnus acuminata)'),(56,'Palo santo (bursera graveolens)'),(57,'Urundéy (astronium urundeuva)'),(58,'Molle chileno (Schinus molle)'),(59,'Rosa laurel (Nerium oleander)'),(60,'Pata de vaca (Bauhinia forficata)'),(61,'Brachichito (Brachychiton populneus)'),(62,'Higuera (Ficus carica)'),(63,'Rum Rum (Virapita Rum rum)'),(64,'Tipa (Tipuana tipu)'),(65,'No Determinado');
/*!40000 ALTER TABLE `especies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_impresiones`
--

DROP TABLE IF EXISTS `historial_impresiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_impresiones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_reporte` varchar(255) DEFAULT NULL,
  `id_solicitud` int DEFAULT NULL,
  `tipo_reporte` varchar(50) DEFAULT NULL,
  `fecha_impresion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario` varchar(100) DEFAULT NULL,
  `filtros_aplicados` text,
  `detalles` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_solicitud` (`id_solicitud`),
  CONSTRAINT `historial_impresiones_ibfk_1` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_impresiones`
--

LOCK TABLES `historial_impresiones` WRITE;
/*!40000 ALTER TABLE `historial_impresiones` DISABLE KEYS */;
INSERT INTO `historial_impresiones` VALUES (1,'Reporte Individual - 12',6,'Individual','2026-05-13 16:38:10','Tec. Kevin Flores',NULL,NULL),(2,'Reporte Individual - 154/26',7,'Individual','2026-05-13 16:40:35','Tec. Kevin Flores',NULL,NULL),(3,'Reporte Individual - 12',3,'Individual','2026-05-13 17:23:04','Tec. Kevin Flores',NULL,NULL);
/*!40000 ALTER TABLE `historial_impresiones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instituciones`
--

DROP TABLE IF EXISTS `instituciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instituciones` (
  `id` int NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `id_tipo` int DEFAULT NULL,
  `id_distrito` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_tipo` (`id_tipo`),
  KEY `id_distrito` (`id_distrito`),
  CONSTRAINT `instituciones_ibfk_1` FOREIGN KEY (`id_tipo`) REFERENCES `tipos_institucion` (`id`),
  CONSTRAINT `instituciones_ibfk_2` FOREIGN KEY (`id_distrito`) REFERENCES `distritos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instituciones`
--

LOCK TABLES `instituciones` WRITE;
/*!40000 ALTER TABLE `instituciones` DISABLE KEYS */;
INSERT INTO `instituciones` VALUES (1,'BELLA VISTA',1,NULL),(2,'CHURQUIS',NULL,NULL),(3,'GUERRAHUAYCO',1,NULL),(4,'LA PINTADA',1,NULL),(5,'LAZARETO',1,NULL),(6,'MONTE CERCADO',1,NULL),(7,'PAMPA REDONDA',1,NULL),(8,'POLLA',1,NULL),(9,'SAN AGUSTIN',1,NULL),(10,'SAN JACINTO',1,NULL),(11,'SAN MATEO',1,NULL),(12,'SAN PEDRO DE SOLA',1,NULL),(13,'SANTA ANA LA NUEVA',1,NULL),(14,'SELLA CERCADO',1,NULL),(15,'TOLOMOSA GRANDE',1,NULL),(16,'TOLOMOSITA',1,NULL),(17,'TURUMAYO',1,NULL),(18,'YESERA',1,NULL),(19,'C.S. 15 DE NOVIEMBRE',2,NULL),(20,'C.S. 3 DE MAYO',2,NULL),(21,'C.S. ARANJUEZ SUD',2,NULL),(22,'C.S. CONSTRUCTOR',2,NULL),(23,'C.S. FABRIL',2,NULL),(24,'C.S. GERMAN BUSCH',2,NULL),(25,'C.S. GUADALQUIVIR',2,NULL),(26,'C.S. IV. CENTENARIO',2,NULL),(27,'C.S. NESTOR PAZ',2,NULL),(28,'C.S. PALMARCITO',2,NULL),(29,'C.S. SAN ANTONIO',2,NULL),(30,'C.S. SAN BLAS',2,NULL),(31,'C.S. SAN JORGE',2,NULL),(32,'C.S. SAN LUIS',2,NULL),(33,'C.S. TABLADITA',2,NULL),(34,'C.S. VILLA AVAROA',2,NULL),(35,'C.S. VIRGEN DE GUADALUPE',2,NULL),(36,'Hospital Obrero C.N.S',2,NULL),(37,'SEDES',2,NULL),(38,'Prosalud',2,NULL),(39,'U.E. ALBERTO BALDIVIESO',3,NULL),(40,'U.E. AVELINA RAÑA',3,NULL),(41,'U.E. JOSE MANUEL BELGRANO',3,NULL),(42,'U.E. BOLIVIA',3,NULL),(43,'U.E. CARMEN MEALLA',3,NULL),(44,'U.E. COLEGIO NACIONAL SAN LUIS',3,NULL),(45,'U.E. FELIPE PALAZON',3,NULL),(46,'U.E. LA SALLE',3,NULL),(47,'Universidad Autónoma Juan Mishael Saracho',3,NULL),(48,'Universidad Católica Boliviana',3,NULL),(49,'Instituto Tecnologico Agropecuario San Andres',3,NULL),(50,'Infocal',3,NULL),(51,'Junta Vecinal',4,NULL),(52,'Club Pumas Chapacos',4,NULL),(53,'Asociacion de Promesantes Chunchos',4,NULL),(54,'Asociación Conciencia Ecológica',4,NULL),(55,'Sindicato De Transporte De Pasajeros La Tablada',4,NULL),(56,'Federacion departamental de auto transporte 15 de abril',4,NULL),(57,'Asociación de comerciantes minorista 20 de Mayo',4,NULL),(58,'Despacho Municipal',5,NULL),(59,'Secretaria M. de Infraestructura y Servicios',5,NULL),(60,'Secretaria M. De Planificación Integral',5,NULL),(61,'Consejo Municipal',5,NULL),(62,'Mercado Lourdes',5,NULL),(63,'Mercado Luis de Fuentes',5,NULL),(64,'Dirección de ingreso - oficina de parqueos',5,NULL),(65,'Tercera Division del Ejercito TCNL PADILLA',6,NULL),(66,'Policía Bolivia FELCC',6,NULL),(67,'SETAR',6,NULL),(68,'Cosaalt',6,NULL),(69,'Servicio Eléctrico Industrial EMSEIQQ',6,NULL),(70,'Camara departamental de transporte',6,NULL);
/*!40000 ALTER TABLE `instituciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes`
--

DROP TABLE IF EXISTS `solicitudes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes` (
  `id_solicitud` int NOT NULL AUTO_INCREMENT,
  `fecha_ingreso` date DEFAULT NULL,
  `fecha_verificacion` date DEFAULT NULL,
  `comunicacion_interna` varchar(50) DEFAULT NULL,
  `id_barrio` int DEFAULT NULL,
  `id_nombre_institucional` int DEFAULT NULL,
  `id_accion` int DEFAULT NULL,
  `id_especie` int DEFAULT NULL,
  `calle` varchar(255) DEFAULT NULL,
  `numero_casa` varchar(50) DEFAULT NULL,
  `referencia` varchar(255) DEFAULT NULL,
  `solicitante_nombre` varchar(100) DEFAULT NULL,
  `solicitante_telefono` varchar(50) DEFAULT NULL,
  `solicitante_descripcion` text,
  `lo_solicitado` text,
  `id_accion_solicitada` int DEFAULT NULL,
  `id_tecnico_verificacion` int DEFAULT NULL,
  `requiere_plataforma` tinyint(1) DEFAULT '0',
  `requiere_setar` tinyint(1) DEFAULT '0',
  `requiere_ficha_tecnica` tinyint(1) DEFAULT '0',
  `procede` tinyint(1) DEFAULT '0',
  `cantidad_notas` int DEFAULT '1',
  `arbol_seco` tinyint(1) DEFAULT '0',
  `es_emergencia` tinyint(1) DEFAULT '0',
  `segunda_nota` tinyint(1) DEFAULT '0',
  `es_urgencia` tinyint(1) DEFAULT '0',
  `nivel_urgencia` varchar(50) DEFAULT 'Baja',
  `observacion_verificacion` text,
  `id_tecnico_ejecucion` int DEFAULT NULL,
  `fecha_ejecucion` date DEFAULT NULL,
  `observaciones_finales` text,
  `estado_tramite` varchar(50) DEFAULT 'En espera',
  `id_tipo_institucion` int DEFAULT NULL,
  PRIMARY KEY (`id_solicitud`),
  KEY `id_barrio` (`id_barrio`),
  KEY `id_nombre_institucional` (`id_nombre_institucional`),
  KEY `id_accion` (`id_accion`),
  KEY `id_especie` (`id_especie`),
  KEY `id_accion_solicitada` (`id_accion_solicitada`),
  KEY `id_tecnico_verificacion` (`id_tecnico_verificacion`),
  KEY `id_tecnico_ejecucion` (`id_tecnico_ejecucion`),
  CONSTRAINT `solicitudes_ibfk_1` FOREIGN KEY (`id_barrio`) REFERENCES `barrios` (`id`),
  CONSTRAINT `solicitudes_ibfk_2` FOREIGN KEY (`id_nombre_institucional`) REFERENCES `instituciones` (`id`),
  CONSTRAINT `solicitudes_ibfk_3` FOREIGN KEY (`id_accion`) REFERENCES `acciones` (`id`),
  CONSTRAINT `solicitudes_ibfk_4` FOREIGN KEY (`id_especie`) REFERENCES `especies` (`id`),
  CONSTRAINT `solicitudes_ibfk_5` FOREIGN KEY (`id_accion_solicitada`) REFERENCES `acciones` (`id`),
  CONSTRAINT `solicitudes_ibfk_6` FOREIGN KEY (`id_tecnico_verificacion`) REFERENCES `tecnicos` (`id`),
  CONSTRAINT `solicitudes_ibfk_7` FOREIGN KEY (`id_tecnico_ejecucion`) REFERENCES `tecnicos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes`
--

LOCK TABLES `solicitudes` WRITE;
/*!40000 ALTER TABLE `solicitudes` DISABLE KEYS */;
INSERT INTO `solicitudes` VALUES (1,'2024-05-01','2024-05-03','Cod 0001/24',1,NULL,1,31,'Av. Las Américas','S/N','Frente al parque','Juan Pérez','76543210','Árbol choca con cables.',NULL,1,1,1,1,0,1,1,0,0,0,0,'Intermedia',NULL,NULL,NULL,NULL,'En espera',NULL),(2,'2024-05-02','2024-05-04','Cod 0002/24',10,39,3,14,'Calle Colón','123','Colegio','Prof. Martha Llanos','71122334','Árbol seco.',NULL,4,2,0,0,1,1,1,1,1,0,0,'Alta',NULL,NULL,NULL,NULL,'En espera',NULL),(3,'2026-05-13','2026-05-08','12',18,32,NULL,NULL,'Dfsdf','','','Dsfdf','','','',4,NULL,1,0,1,0,1,1,1,0,1,'Baja','',2,NULL,'','En espera',2),(4,'2026-05-13','2026-05-08','12',18,32,NULL,NULL,'Dfsdf','','','Dsfdf','','','',4,NULL,1,0,1,0,1,1,1,0,1,'Baja','',2,NULL,'','Terminado',2),(5,'2026-05-13','2026-05-08','12',18,32,NULL,NULL,'Dfsdf','','','Dsfdf','','','',4,NULL,1,0,1,0,1,1,1,0,1,'Baja','',2,NULL,'','En espera',2),(6,'2026-05-13','2026-05-08','12',18,32,NULL,NULL,'Dfsdf','','','Dsfdf','','','',4,NULL,1,0,1,0,1,1,1,0,1,'Baja','',2,NULL,'','En espera',2),(7,'2026-05-13','2026-05-14','154/26',78,47,3,8,'Las rosas esquina pascuas','544','Frente a la iglesia','Kevin flores','78451258','El arbol estorba la puerta de ingreso','',1,2,1,1,1,1,1,1,1,1,1,'Alta','El vecino debe conseguir firma del presidente de barrio',4,'2026-05-14','Se realizo correctamente el derribe, coordinar para el siguiente arbol','En espera',3),(8,'2026-05-27','2026-05-27','155/26',8,20,1,10,'Calle Bolivar','334','Referencia aleatoria 1','Ricardo Diaz','75150448','El arbol estorba los cables','Poda/Derribe según inspección',4,4,0,0,1,1,1,0,0,0,0,'Alta','Inspeccion automatica 1',6,'2026-05-01','Trabajo generado automaticamente','Archivado',3),(9,'2026-05-13','2026-05-13','156/26',6,5,8,6,'Av. Principal','311','Referencia aleatoria 2','Carla Ramirez','77091661','Raices levantando la acera','Poda/Derribe según inspección',1,6,1,0,1,1,1,0,0,0,0,'Alta','Inspeccion automatica 2',12,'2026-05-16','Trabajo generado automaticamente','En proceso',2),(10,'2026-05-25','2026-05-25','157/26',5,34,7,2,'Los Tajibos','148','Referencia aleatoria 3','Ricardo Vargas','75323490','Arbol seco con riesgo de caida','Poda/Derribe según inspección',1,5,1,0,1,0,0,0,0,0,0,'Media','Inspeccion automatica 3',5,'2026-05-17','Trabajo generado automaticamente','En proceso',4),(11,'2026-05-12','2026-05-12','158/26',7,8,3,9,'Los Tajibos','358','Referencia aleatoria 4','Juan Perez','77467636','Limpieza de ramas secas','Poda/Derribe según inspección',5,11,1,0,1,1,1,0,0,0,0,'Alta','Inspeccion automatica 4',6,'2026-05-06','Trabajo generado automaticamente','En espera',1),(12,'2026-05-10','2026-05-10','159/26',10,37,8,1,'Calle Bolivar','198','Referencia aleatoria 5','Elena Diaz','78917302','Raices levantando la acera','Poda/Derribe según inspección',2,3,1,0,1,0,1,0,0,0,0,'Media','Inspeccion automatica 5',11,'2026-05-26','Trabajo generado automaticamente','Completado',4),(13,'2026-05-28','2026-05-28','160/26',7,41,2,2,'Av. Libertad','510','Referencia aleatoria 6','Sofia Sanchez','76821189','El arbol estorba los cables','Poda/Derribe según inspección',5,10,1,0,1,1,0,0,0,0,0,'Media','Inspeccion automatica 6',12,'2026-05-10','Trabajo generado automaticamente','Completado',1),(14,'2026-05-02','2026-05-02','161/26',7,28,5,6,'Calle 5','460','Referencia aleatoria 7','Sofia Rodriguez','77363659','Arbol seco con riesgo de caida','Poda/Derribe según inspección',1,2,0,0,1,0,1,0,0,1,1,'Media','Inspeccion automatica 7',6,'2026-05-21','Trabajo generado automaticamente','Terminado',1),(15,'2026-05-08','2026-05-08','162/26',4,11,6,10,'Los Tajibos','421','Referencia aleatoria 8','Juan Vargas','76142317','Arbol inclinado peligroso','Poda/Derribe según inspección',8,6,0,1,1,1,1,0,0,0,0,'Media','Inspeccion automatica 8',3,'2026-05-06','Trabajo generado automaticamente','En proceso',5),(16,'2026-05-16','2026-05-16','163/26',6,24,3,1,'Calle Sucre','273','Referencia aleatoria 9','Paula Vargas','72067005','Solicitud de poda de formacion','Poda/Derribe según inspección',7,11,0,1,1,1,0,0,0,0,0,'Alta','Inspeccion automatica 9',7,'2026-05-09','Trabajo generado automaticamente','Pendiente',5),(17,'2026-05-25','2026-05-25','164/26',1,4,7,3,'Pasaje A','557','Referencia aleatoria 10','Maria Rodriguez','79903938','Obstruccion de visibilidad en esquina','Poda/Derribe según inspección',8,12,1,1,1,1,2,0,0,0,0,'Alta','Inspeccion automatica 10',1,'2026-05-09','Trabajo generado automaticamente','Completado',5),(18,'2026-05-08','2026-05-08','165/26',3,50,7,10,'Av. Principal','838','Referencia aleatoria 11','Sofia Lopez','73598135','Raices levantando la acera','Poda/Derribe según inspección',5,4,1,0,1,1,0,0,0,0,0,'Media','Inspeccion automatica 11',5,'2026-05-27','Trabajo generado automaticamente','Completado',4),(19,'2026-05-13','2026-05-13','155/26',31,53,5,43,'Calle 5','683','Referencia aleatoria 1','Elena Sanchez','74825683','Solicitud de poda de formacion','Poda/Derribe según inspección',7,6,0,0,1,1,0,0,1,0,0,'Media','Inspeccion automatica 1',16,'2026-05-16','Trabajo generado automaticamente','En espera',4),(20,'2026-05-18','2026-05-18','156/26',44,38,3,7,'Av. Principal','641','Referencia aleatoria 2','Ana Fernandez','78393532','Arbol seco con riesgo de caida','Poda/Derribe según inspección',5,11,0,0,1,0,2,0,0,0,0,'Alta','Inspeccion automatica 2',6,'2026-05-26','Trabajo generado automaticamente','En proceso',1),(21,'2026-05-20','2026-05-20','157/26',35,11,5,57,'Calle Sucre','947','Referencia aleatoria 3','Sofia Vargas','74428661','Solicitud de poda de formacion','Poda/Derribe según inspección',8,11,1,0,1,1,1,0,0,0,0,'Media','Inspeccion automatica 3',10,'2026-05-15','Trabajo generado automaticamente','En espera',2),(22,'2026-05-12','2026-05-12','158/26',53,23,8,57,'Pasaje A','573','Referencia aleatoria 4','Lucia Ramirez','79239518','Arbol inclinado peligroso','Poda/Derribe según inspección',1,12,0,0,1,1,0,0,1,0,0,'Media','Inspeccion automatica 4',3,'2026-05-05','Trabajo generado automaticamente','Pendiente',2),(23,'2026-05-08','2026-05-08','159/26',67,22,2,21,'Las Rosas','419','Referencia aleatoria 5','Paula Garcia','72425038','Ramas golpeando el techo','Poda/Derribe según inspección',2,11,1,0,1,1,2,0,0,0,0,'Media','Inspeccion automatica 5',3,'2026-05-26','Trabajo generado automaticamente','Archivado',2),(24,'2026-05-18','2026-05-18','160/26',78,3,5,28,'Pasaje A','618','Referencia aleatoria 6','Maria Ramirez','77545407','Obstruccion de visibilidad en esquina','Poda/Derribe según inspección',7,1,1,0,1,1,2,0,0,0,0,'Alta','Inspeccion automatica 6',1,'2026-05-20','Trabajo generado automaticamente','En espera',4),(25,'2026-05-26','2026-05-26','161/26',78,26,4,51,'Las Rosas','293','Referencia aleatoria 7','Lucia Sanchez','75536573','Solicitud de poda de formacion','Poda/Derribe según inspección',1,15,1,0,1,1,2,0,0,0,0,'Alta','Inspeccion automatica 7',19,'2026-05-17','Trabajo generado automaticamente','Pendiente',3),(26,'2026-05-12','2026-05-12','162/26',80,48,1,55,'Calle Bolivar','221','Referencia aleatoria 8','Maria Fernandez','79868954','Solicitud de poda de formacion','Poda/Derribe según inspección',1,5,0,0,1,1,1,0,0,0,0,'Media','Inspeccion automatica 8',19,'2026-05-13','Trabajo generado automaticamente','En proceso',3),(27,'2026-05-05','2026-05-05','163/26',11,2,3,2,'Av. Libertad','729','Referencia aleatoria 9','Elena Torres','73159038','Obstruccion de visibilidad en esquina','Poda/Derribe según inspección',4,16,1,1,1,1,1,0,0,0,0,'Alta','Inspeccion automatica 9',18,'2026-05-26','Trabajo generado automaticamente','Completado',4),(28,'2026-05-20','2026-05-20','164/26',55,21,7,32,'Av. Libertad','293','Referencia aleatoria 10','Lucia Martinez','77089440','Arbol seco con riesgo de caida','Poda/Derribe según inspección',3,3,1,0,1,1,1,0,1,0,0,'Media','Inspeccion automatica 10',13,'2026-05-12','Trabajo generado automaticamente','En proceso',4),(29,'2026-05-08','2026-05-08','165/26',44,36,3,59,'Calle Bolivar','548','Referencia aleatoria 11','Maria Rodriguez','75311836','Obstruccion de visibilidad en esquina','Poda/Derribe según inspección',8,15,0,1,1,1,2,1,0,0,1,'Alta','Inspeccion automatica 11',11,'2026-05-10','Trabajo generado automaticamente','Archivado',4),(30,'2026-05-02','2026-05-02','166/26',28,51,7,57,'Calle 5','407','Referencia aleatoria 12','Miguel Sanchez','79625225','Raices levantando la acera','Poda/Derribe según inspección',2,2,0,1,1,0,2,0,0,0,0,'Media','Inspeccion automatica 12',1,'2026-05-13','Trabajo generado automaticamente','En espera',6),(31,'2026-05-22','2026-05-22','167/26',48,22,4,40,'Las Rosas','790','Referencia aleatoria 13','Ana Fernandez','77746626','Limpieza de ramas secas','Poda/Derribe según inspección',4,11,0,0,1,1,0,0,0,0,1,'Media','Inspeccion automatica 13',11,'2026-05-17','Trabajo generado automaticamente','Pendiente',1),(32,'2026-05-11','2026-05-11','168/26',84,30,7,8,'Calle Sucre','221','Referencia aleatoria 14','Elena Torres','74668049','Raices levantando la acera','Poda/Derribe según inspección',5,11,0,0,1,1,1,1,1,0,1,'Alta','Inspeccion automatica 14',7,'2026-05-04','Trabajo generado automaticamente','En proceso',4),(33,'2026-05-02','2026-05-02','169/26',59,3,4,61,'Calle 5','930','Referencia aleatoria 15','Ana Garcia','74360603','Arbol inclinado peligroso','Poda/Derribe según inspección',4,17,1,0,1,0,1,0,0,0,0,'Alta','Inspeccion automatica 15',4,'2026-05-07','Trabajo generado automaticamente','En espera',4),(34,'2026-05-08','2026-05-08','170/26',62,11,4,64,'Calle Sucre','1','Referencia aleatoria 16','Luis Fernandez','77959542','Arbol seco con riesgo de caida','Poda/Derribe según inspección',4,12,0,0,1,0,2,1,0,0,0,'Alta','Inspeccion automatica 16',2,'2026-05-14','Trabajo generado automaticamente','Pendiente',3),(35,'2026-05-21','2026-05-21','171/26',58,58,6,22,'Calle 5','21','Referencia aleatoria 17','Ricardo Martinez','76442850','Limpieza de ramas secas','Poda/Derribe según inspección',2,3,1,0,1,1,1,0,0,0,0,'Alta','Inspeccion automatica 17',1,'2026-05-21','Trabajo generado automaticamente','En proceso',3),(36,'2026-05-16','2026-05-16','172/26',74,33,1,19,'Las Rosas','127','Referencia aleatoria 18','Carla Sanchez','77614847','El arbol estorba los cables','Poda/Derribe según inspección',1,1,0,0,1,1,0,0,1,0,0,'Media','Inspeccion automatica 18',15,'2026-05-24','Trabajo generado automaticamente','En proceso',4),(37,'2026-05-05','2026-05-05','173/26',76,64,3,12,'Las Rosas','703','Referencia aleatoria 19','Maria Vargas','71592760','Obstruccion de visibilidad en esquina','Poda/Derribe según inspección',4,4,0,0,1,1,0,1,1,0,1,'Alta','Inspeccion automatica 19',14,'2026-05-23','Trabajo generado automaticamente','En proceso',2),(38,'2026-05-02','2026-05-02','174/26',72,51,3,7,'Pasaje A','836','Referencia aleatoria 20','Juan Garcia','78307563','Arbol inclinado peligroso','Poda/Derribe según inspección',8,7,1,0,1,0,1,0,0,0,0,'Media','Inspeccion automatica 20',19,'2026-05-22','Trabajo generado automaticamente','Pendiente',5),(39,'2026-05-19','2026-05-19','175/26',17,44,4,50,'Calle Bolivar','129','Referencia aleatoria 21','Maria Perez','79743665','Arbol inclinado peligroso','Poda/Derribe según inspección',1,6,1,0,1,1,2,1,0,0,0,'Alta','Inspeccion automatica 21',7,'2026-05-16','Trabajo generado automaticamente','Pendiente',5),(40,'2026-05-05','2026-05-05','176/26',4,17,5,9,'Los Tajibos','683','Referencia aleatoria 22','Ana Garcia','73251693','Solicitud de poda de formacion','Poda/Derribe según inspección',2,10,1,0,1,0,1,0,0,0,0,'Alta','Inspeccion automatica 22',16,'2026-05-05','Trabajo generado automaticamente','En proceso',5),(41,'2026-05-17','2026-05-17','177/26',42,57,8,17,'Calle Sucre','212','Referencia aleatoria 23','Carla Torres','76871477','Raices levantando la acera','Poda/Derribe según inspección',5,18,0,0,1,1,1,0,0,0,0,'Media','Inspeccion automatica 23',18,'2026-05-19','Trabajo generado automaticamente','Archivado',1),(42,'2026-05-05','2026-05-05','178/26',24,24,4,27,'Los Pinos','503','Referencia aleatoria 24','Ricardo Vargas','78449033','Ramas golpeando el techo','Poda/Derribe según inspección',2,18,0,0,1,0,0,0,0,0,0,'Alta','Inspeccion automatica 24',13,'2026-05-28','Trabajo generado automaticamente','Archivado',6),(43,'2026-05-08','2026-05-08','179/26',61,66,2,43,'Calle Sucre','532','Referencia aleatoria 25','Juan Sanchez','71350166','Solicitud de poda de formacion','Poda/Derribe según inspección',8,12,1,0,1,1,2,0,0,0,1,'Media','Inspeccion automatica 25',14,'2026-05-19','Trabajo generado automaticamente','En espera',6),(44,'2026-05-21','2026-05-21','180/26',57,67,1,6,'Av. Libertad','238','Referencia aleatoria 26','Carla Lopez','78998640','Raices levantando la acera','Poda/Derribe según inspección',1,3,0,0,1,0,0,1,0,0,1,'Alta','Inspeccion automatica 26',1,'2026-05-15','Trabajo generado automaticamente','En proceso',6),(45,'2026-05-20','2026-05-20','181/26',54,70,4,38,'Pasaje A','863','Referencia aleatoria 27','Pedro Diaz','71368569','Raices levantando la acera','Poda/Derribe según inspección',8,14,0,1,1,0,2,0,0,0,0,'Media','Inspeccion automatica 27',6,'2026-05-17','Trabajo generado automaticamente','Completado',4),(46,'2026-05-21','2026-05-21','182/26',14,48,5,2,'Pasaje A','955','Referencia aleatoria 28','Maria Gomez','74162649','Ramas golpeando el techo','Poda/Derribe según inspección',7,17,1,1,1,1,0,0,0,0,0,'Alta','Inspeccion automatica 28',10,'2026-05-03','Trabajo generado automaticamente','Pendiente',4),(47,'2026-05-15','2026-05-15','183/26',39,27,3,58,'Las Rosas','73','Referencia aleatoria 29','Elena Fernandez','73324160','El arbol estorba los cables','Poda/Derribe según inspección',5,13,1,0,1,0,2,0,0,0,1,'Media','Inspeccion automatica 29',16,'2026-05-03','Trabajo generado automaticamente','Archivado',3),(48,'2026-05-12','2026-05-12','184/26',23,62,3,44,'Pasaje A','884','Referencia aleatoria 30','Maria Martinez','79172747','Raices levantando la acera','Poda/Derribe según inspección',2,16,0,0,1,1,2,0,0,0,0,'Media','Inspeccion automatica 30',3,'2026-05-16','Trabajo generado automaticamente','Pendiente',3),(49,'2026-05-17','2026-05-17','185/26',45,6,6,33,'Av. Libertad','769','Referencia aleatoria 31','Diego Vargas','77211430','Ramas golpeando el techo','Poda/Derribe según inspección',2,17,0,0,1,1,2,0,0,0,0,'Alta','Inspeccion automatica 31',7,'2026-05-25','Trabajo generado automaticamente','En espera',3),(50,'2026-05-03','2026-05-03','186/26',76,41,1,25,'Calle Sucre','71','Referencia aleatoria 32','Elena Torres','75437544','Arbol inclinado peligroso','Poda/Derribe según inspección',8,17,0,1,1,1,1,0,0,0,0,'Media','Inspeccion automatica 32',5,'2026-05-11','Trabajo generado automaticamente','En proceso',5),(51,'2026-05-03','2026-05-03','187/26',8,46,8,5,'Los Tajibos','116','Referencia aleatoria 33','Luis Perez','77084815','Limpieza de ramas secas','Poda/Derribe según inspección',2,13,0,0,1,0,2,0,0,0,0,'Alta','Inspeccion automatica 33',13,'2026-05-25','Trabajo generado automaticamente','Completado',2),(52,'2026-05-01','2026-05-01','188/26',83,50,1,45,'Calle Bolivar','777','Referencia aleatoria 34','Lucia Ramirez','79317698','Raices levantando la acera','Poda/Derribe según inspección',1,15,1,0,1,1,2,1,0,0,0,'Media','Inspeccion automatica 34',1,'2026-05-16','Trabajo generado automaticamente','En proceso',3),(53,'2026-05-21','2026-05-21','189/26',65,63,1,56,'Calle 5','512','Referencia aleatoria 35','Roberto Gomez','72040375','Solicitud de poda de formacion','Poda/Derribe según inspección',8,17,1,0,1,1,2,0,0,0,0,'Alta','Inspeccion automatica 35',3,'2026-05-03','Trabajo generado automaticamente','Terminado',4),(54,'2026-05-12','2026-05-12','190/26',86,47,1,10,'Av. Principal','257','Referencia aleatoria 36','Luis Vargas','71976797','El arbol estorba los cables','Poda/Derribe según inspección',7,18,0,0,1,1,1,0,1,0,0,'Alta','Inspeccion automatica 36',19,'2026-05-28','Trabajo generado automaticamente','En espera',3),(55,'2026-05-16','2026-05-16','191/26',75,70,7,16,'Av. Libertad','929','Referencia aleatoria 37','Lucia Gomez','75444256','Solicitud de poda de formacion','Poda/Derribe según inspección',3,11,1,0,1,0,0,1,0,0,0,'Media','Inspeccion automatica 37',10,'2026-05-03','Trabajo generado automaticamente','Archivado',3),(56,'2026-05-08','2026-05-08','192/26',22,41,4,46,'Calle Bolivar','946','Referencia aleatoria 38','Ana Torres','74228153','Raices levantando la acera','Poda/Derribe según inspección',4,17,0,1,1,1,0,0,0,0,0,'Alta','Inspeccion automatica 38',15,'2026-05-20','Trabajo generado automaticamente','Archivado',4),(57,'2026-05-19','2026-05-19','193/26',32,7,5,16,'Calle Sucre','322','Referencia aleatoria 39','Carla Garcia','72757804','Limpieza de ramas secas','Poda/Derribe según inspección',1,19,0,0,1,1,1,0,0,0,0,'Media','Inspeccion automatica 39',12,'2026-05-20','Trabajo generado automaticamente','Archivado',3),(58,'2026-05-12','2026-05-12','194/26',76,26,1,29,'Los Pinos','255','Referencia aleatoria 40','Pedro Rodriguez','72313542','Limpieza de ramas secas','Poda/Derribe según inspección',7,15,0,1,1,0,2,0,0,0,0,'Media','Inspeccion automatica 40',19,'2026-05-25','Trabajo generado automaticamente','Completado',5),(59,'2026-05-16','2026-05-16','195/26',18,65,2,57,'Calle 5','179','Referencia aleatoria 41','Carla Martinez','78939468','Solicitud de poda de formacion','Poda/Derribe según inspección',6,4,1,0,1,1,2,0,1,0,0,'Media','Inspeccion automatica 41',15,'2026-05-06','Trabajo generado automaticamente','En proceso',5),(60,'2026-05-06','2026-05-06','196/26',41,11,6,29,'Las Rosas','32','Referencia aleatoria 42','Pedro Sanchez','75954193','Arbol seco con riesgo de caida','Poda/Derribe según inspección',6,5,1,0,1,1,2,0,0,0,1,'Media','Inspeccion automatica 42',12,'2026-05-21','Trabajo generado automaticamente','Pendiente',4),(61,'2026-05-21','2026-05-21','197/26',26,49,7,5,'Av. Principal','795','Referencia aleatoria 43','Paula Ramirez','75781118','Obstruccion de visibilidad en esquina','Poda/Derribe según inspección',6,2,1,0,1,1,2,1,0,0,1,'Media','Inspeccion automatica 43',12,'2026-05-15','Trabajo generado automaticamente','Pendiente',5),(62,'2026-05-08','2026-05-08','198/26',59,2,2,60,'Las Rosas','108','Referencia aleatoria 44','Miguel Perez','73324558','Raices levantando la acera','Poda/Derribe según inspección',2,15,1,0,1,1,2,0,1,0,1,'Media','Inspeccion automatica 44',7,'2026-05-12','Trabajo generado automaticamente','Pendiente',2),(63,'2026-05-09','2026-05-09','199/26',64,29,2,2,'Los Tajibos','310','Referencia aleatoria 45','Luis Sanchez','75338097','Ramas golpeando el techo','Poda/Derribe según inspección',5,2,0,1,1,1,0,0,0,0,0,'Alta','Inspeccion automatica 45',11,'2026-05-07','Trabajo generado automaticamente','Completado',1),(64,'2026-05-24','2026-05-24','200/26',72,24,4,21,'Av. Libertad','111','Referencia aleatoria 46','Sofia Perez','76759328','Limpieza de ramas secas','Poda/Derribe según inspección',3,3,1,0,1,0,1,1,1,0,0,'Alta','Inspeccion automatica 46',13,'2026-05-25','Trabajo generado automaticamente','Archivado',3),(65,'2026-05-24','2026-05-24','201/26',15,15,6,41,'Av. Principal','244','Referencia aleatoria 47','Luis Perez','77057379','Obstruccion de visibilidad en esquina','Poda/Derribe según inspección',1,17,0,0,1,1,0,0,1,0,0,'Alta','Inspeccion automatica 47',7,'2026-05-28','Trabajo generado automaticamente','En espera',3),(66,'2026-05-09','2026-05-09','202/26',5,13,3,46,'Pasaje A','749','Referencia aleatoria 48','Roberto Martinez','79012986','Arbol seco con riesgo de caida','Poda/Derribe según inspección',7,4,0,0,1,1,2,0,0,0,0,'Alta','Inspeccion automatica 48',19,'2026-05-16','Trabajo generado automaticamente','En espera',1),(67,'2026-05-12','2026-05-12','203/26',48,4,2,37,'Av. Principal','285','Referencia aleatoria 49','Sofia Sanchez','74340224','Obstruccion de visibilidad en esquina','Poda/Derribe según inspección',2,17,1,1,1,1,1,1,1,0,0,'Alta','Inspeccion automatica 49',3,'2026-05-02','Trabajo generado automaticamente','Pendiente',1),(68,'2026-05-17','2026-05-17','204/26',48,34,3,52,'Calle Sucre','789','Referencia aleatoria 50','Carla Gomez','77652022','Arbol seco con riesgo de caida','Poda/Derribe según inspección',2,17,1,1,1,1,0,0,0,0,0,'Alta','Inspeccion automatica 50',14,'2026-05-02','Trabajo generado automaticamente','Completado',4),(69,'2026-05-01','2026-05-01','205/26',44,32,5,56,'Calle 5','788','Referencia aleatoria 51','Elena Lopez','74890227','Arbol seco con riesgo de caida','Poda/Derribe según inspección',2,14,1,0,1,1,1,0,0,0,0,'Media','Inspeccion automatica 51',14,'2026-05-17','Trabajo generado automaticamente','Archivado',5),(70,'2026-05-25','2026-05-25','206/26',87,49,2,65,'Pasaje A','986','Referencia aleatoria 52','Lucia Rodriguez','75748108','Arbol inclinado peligroso','Poda/Derribe según inspección',7,1,0,0,1,1,2,1,0,0,0,'Media','Inspeccion automatica 52',16,'2026-05-28','Trabajo generado automaticamente','Archivado',3),(71,'2026-05-26','2026-05-26','207/26',30,23,3,37,'Av. Libertad','718','Referencia aleatoria 53','Luis Rodriguez','76604412','Raices levantando la acera','Poda/Derribe según inspección',5,1,0,1,1,1,2,0,0,0,0,'Alta','Inspeccion automatica 53',10,'2026-05-16','Trabajo generado automaticamente','Completado',6),(72,'2026-05-13','2026-05-13','208/26',87,63,5,1,'Calle 5','995','Referencia aleatoria 54','Paula Lopez','76936691','Arbol seco con riesgo de caida','Poda/Derribe según inspección',5,7,0,0,1,1,2,1,0,0,0,'Alta','Inspeccion automatica 54',17,'2026-05-14','Trabajo generado automaticamente','Completado',3),(73,'2026-05-15','2026-05-15','209/26',25,45,4,40,'Calle Sucre','655','Referencia aleatoria 55','Roberto Martinez','77543560','Arbol seco con riesgo de caida','Poda/Derribe según inspección',7,15,1,0,1,1,1,0,0,0,0,'Alta','Inspeccion automatica 55',3,'2026-05-09','Trabajo generado automaticamente','Archivado',2);
/*!40000 ALTER TABLE `solicitudes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tecnicos`
--

DROP TABLE IF EXISTS `tecnicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tecnicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `tipo_contrato` varchar(100) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `celular` varchar(50) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `tipo_sangre` varchar(10) DEFAULT NULL,
  `contacto_emergencia` varchar(100) DEFAULT NULL,
  `celular_emergencia` varchar(50) DEFAULT NULL,
  `foto` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tecnicos`
--

LOCK TABLES `tecnicos` WRITE;
/*!40000 ALTER TABLE `tecnicos` DISABLE KEYS */;
INSERT INTO `tecnicos` VALUES (1,'Ing. Cimar Farfan',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'Ing. Karina Castro',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'Ing. Cesar Vega',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'Ing. Edwin Lopez',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,'Ing. Jorge Candia',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,'Ing. Pablo Bonilla',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,'Tec. Kevin Flores',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,'Carlos Ramirez','Cargador','Eventual (Consultor)',NULL,'72145678',NULL,'O+',NULL,NULL,NULL),(11,'Marcos Quispe','Tecnico de verificacion','Eventual (Consultor)',NULL,'75489612',NULL,'A+',NULL,NULL,NULL),(12,'Roberto Vaca','Chofer','Pasante/Practica',NULL,'65841235',NULL,'B+',NULL,NULL,NULL),(13,'Daniel Mendez','Tecnico de verificacion','Pasante/Practica',NULL,'71234569',NULL,'O-',NULL,NULL,NULL),(14,'Samuel Flores','Tecnico de verificacion','Contrato Externo',NULL,'78541236',NULL,'A-',NULL,NULL,NULL),(15,'Luis Portal','Tecnico de verificacion','Permanente (Item)',NULL,'60214587',NULL,'O+',NULL,NULL,NULL),(16,'Fernando Zenteno','Cargador','Contrato Externo',NULL,'73214568',NULL,'AB+',NULL,NULL,NULL),(17,'Jorge Aramayo','Encargado de area','Contrato Externo',NULL,'75551234',NULL,'B-',NULL,NULL,NULL),(18,'Adrian Ruiz','Tecnico de equipo','Eventual (Consultor)',NULL,'72112233',NULL,'O+',NULL,NULL,NULL),(19,'Miguel Soliz','Tecnico de sistemas','Permanente (Item)',NULL,'68541239',NULL,'A+',NULL,NULL,NULL);
/*!40000 ALTER TABLE `tecnicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_institucion`
--

DROP TABLE IF EXISTS `tipos_institucion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_institucion` (
  `id` int NOT NULL,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_institucion`
--

LOCK TABLES `tipos_institucion` WRITE;
/*!40000 ALTER TABLE `tipos_institucion` DISABLE KEYS */;
INSERT INTO `tipos_institucion` VALUES (1,'Área Rural'),(2,'Salud y Hospitales'),(3,'Educación'),(4,'Organización Social'),(5,'Entidad Municipal'),(6,'Institución u Organización');
/*!40000 ALTER TABLE `tipos_institucion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'Activo',
  `foto` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'admin','admin','ADMIN','Ing. Cimar Farfan','Ingeniero','cfarfan@alcaldiatarija.gob.bo','Activo',NULL),(2,'root','password','ROOT','Tec. Kevin Flores','Técnico','sistemas.koffys@gmail.com','Activo',NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-15  6:02:39
