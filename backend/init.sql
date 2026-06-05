-- Inicialización de Base de Datos (NORMALIZADA CON TABLA PERSONAL Y DETALLE ARBOLES v3)

DROP DATABASE IF EXISTS dboficina;
CREATE DATABASE dboficina CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dboficina;

-- Desactivar llaves foráneas para poder limpiar tablas
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas nuevas y antiguas si existen
DROP TABLE IF EXISTS detalle_arboles, solicitudes_poda, historial_impresiones, calendario_barrios, config_sistema, personal, instituciones, tipos_solicitantes, barrios, distritos, acciones_catalogo, especies_arboles;
DROP TABLE IF EXISTS solicitudes, usuarios, tecnicos, especies, acciones, tipos_institucion;

-- Reactivar llaves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. CREACIÓN DE TABLAS DE CATÁLOGO (PARAMÉTRICAS)
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
-- 2. CREACIÓN DE TABLAS TRANSACCIONALES (MAESTRO - DETALLE)
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
    FOREIGN KEY (id_tecnico_verificador) REFERENCES personal(id_personal),
    FOREIGN KEY (id_tecnico_ejecucion) REFERENCES personal(id_personal)
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
-- 3. CARGA DE DATOS REALES (DATASET LIMPIO)
-- =============================================================================

-- 3.1 Distritos
INSERT INTO distritos (id_distrito, numero_distrito) VALUES 
(1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(10,10),(11,11),(12,12),(13,13);

-- 3.2 Barrios de Tarija
INSERT INTO barrios (nombre_barrio, id_distrito) VALUES 
('El Molino', 1), ('San Roque', 2), ('Las Panosas', 3), ('La Pampa', 4), ('Virgen de Fatima', 5), 
('La Loma', 6), ('El Carmen', 6), ('Guadalquivir', 6), ('57 Viviendas', 6), ('Luis Pizarro', 6), 
('15 de Noviembre', 6), ('Juan Pablo II', 6), ('Virgen de Chaguaya', 6), ('Libertad', 6), ('Panamericano', 6), 
('15 de Agosto', 6), ('La Torre', 6), ('La Union', 6), ('Carlos Wagnner', 6), ('Paraiso', 6), 
('Los Alamos', 6), ('Los Olivos', 6), ('4 de Julio', 7), ('12 de Octubre', 7), ('IV Centenario', 7), 
('Defensores del Chaco', 7), ('Las Pascuas', 7), ('3 de Mayo', 7), ('Los Chapacos', 7), ('Maria de Los Angeles', 7), 
('15 de Junio', 7), ('Municipal', 7), ('19 de Marzo', 7), ('20 de Enero', 7), ('101 Familias', 7), 
('Nueva Esperanza', 7), ('Eduardo Avaroa', 8), ('Oscar Alfaro', 8), ('San Jose', 8), ('San Marcos', 8), 
('Lourdes', 8), ('La Florida', 8), ('Pascuas', 8), ('Los Laureles', 8), ('La Huerta', 8), 
('6 de Agosto', 9), ('Salamanca', 9), ('San Bernardo', 9), ('Andaluz', 9), ('02 de Mayo', 9), 
('Pedro Antonio Flores', 9), ('Constructor', 9), ('24 de Junio', 9), ('Aniceto Arce', 9), ('Narciso Campero', 9), 
('Luis Espinal', 9), ('7 de Septimbre', 9), ('Bartolome Atard', 9), ('Moto Mendez', 9), ('Juan XXIII', 10), 
('Rosedal', 10), ('Juan Nicolay', 10), ('15 de Abril', 10), ('Aeropuerto', 10), ('Morros Blancos', 10), 
('San Pedro', 10), ('San Jorge 1', 10), ('San Salvador', 10), ('San Jorge 2', 10), ('Artesanal', 10), 
('Lindo San Geronimo', 11), ('San Geronimo Centro', 11), ('San Geronimo Sud', 11), ('San Luis', 11), ('La Terminal', 11), 
('Petrolero', 11), ('El Tejar', 11), ('Miraflores', 12), ('German Busch', 12), ('Aranjuez Sud', 12), 
('San Martin', 12), ('Luis de Fuentes', 13), ('Catedral', 13), ('San Antonio', 13), ('San Blas', 13), 
('Alto Senac', 13), ('Senac', 13), ('Tabladita I', 13), ('Tabladita II', 13), ('Mendez Arcos', 13);

-- 3.3 Tipos de Solicitantes
INSERT INTO tipos_solicitantes (id_tipo_solicitante, nombre_tipo) VALUES 
(1, 'Área Rural'), (2, 'Centro de Salud'), (3, 'Institución Pública / Municipal'), 
(4, 'Institución / Asociación'), (5, 'Organización Vecinal'), (6, 'Mercado Municipal'), (7, 'Unidad Educativa');

-- 3.4 Instituciones de Tarija
INSERT INTO instituciones (id_tipo_solicitante, nombre_institucion) VALUES 
(1, 'Bella Vista'), (1, 'Churquis'), (1, 'Guerrahuayco'), (1, 'La Pintada'), (1, 'Lazareto'), (1, 'Monte Cercado'), (1, 'Pampa Redonda'), (1, 'Polla'), (1, 'San Agustín'), (1, 'San Jacinto'), (1, 'San Mateo'), (1, 'San Pedro de Sola'), (1, 'Santa Ana la Nueva'), (1, 'Sella Cercado'), (1, 'Tolomosa Grande'), (1, 'Tolomosita'), (1, 'Turumayo'), (1, 'Yesera'),
(2, '15 de Noviembre'), (2, '3 de Mayo'), (2, 'Aranjuez Sud'), (2, 'Constructor'), (2, 'Fabril'), (2, 'German Busch'), (2, 'Guadalquivir'), (2, 'IV Centenario'), (2, 'Nestor Paz'), (2, 'Palmarcito'), (2, 'Prosalud'), (2, 'Hospital Obrero'),
(3, 'Despacho Municipal'), (3, 'Secretaria Municipal de Infraestructura y Servicios Públicos'), (3, 'Consejo Municipal'), (3, 'Secretaria Municipal de Planificación Integral Para El Desarrollo'), (3, 'Secretaria Municipal de Desarrollo Humano Salud y Deportes'), (3, 'Dirección de Ingreso - Oficina de Parqueos Municipales'), (3, 'Entidad de Ordenamiento Territorial de Tarija'), (3, 'Monasterio Santa Clara'), (3, 'Sedes'),
(4, 'Infocal'), (4, 'Cosaalt'), (4, 'Setar'), (4, 'Universidad Católica Boliviana'), (4, 'Uajms Facultad de Humanidades'), (4, 'Facultad de Ciencias Agrícolas y Forestales'), (4, 'Asociación de Comerciantes Minorista 20 de Mayo'), (4, 'Sindicato de Transporte de Pasajeros La Tablada'), (4, 'Policía Bolivia Dirección Departamental Fuerza Especial de Lucha Contra El Crimen'), (4, 'Epi Morros Blancos'), (4, 'Tercera Division del Ejercito "tcnl Padilla"'), (4, 'Asociacion de Promesantes Chunchos'), (4, 'Asociación Conciencia Ecológica'),
(6, 'Mercado Lourdes'), (6, 'Mercado Luis de Fuentes'), (5, 'Junta Vecinal (General)'),
(7, 'Alberto Baldivieso'), (7, 'Avelina Raña'), (7, 'José Manuel Belgrano'), (7, 'Bernardo Navajas Trigo'), (7, 'Bolivia'), (7, 'Carmen Mealla'), (7, 'Casterford Castellanos'), (7, 'Colegio Nacional San Luis'), (7, 'Edifu'), (7, 'Esteban Megliaci'), (7, 'Felipe Palazón'), (7, 'Hernan Gmeiner'), (7, 'Humberto Portocarrero I'), (7, 'Humberto Portocarrero II'), (7, 'Humberto Portocarrero III'), (7, 'José Manuel Ávila'), (7, 'Juan XXIII'), (7, 'Juana Azurduy de Padilla'), (7, 'Julio Calvo'), (7, 'La Paz'), (7, 'Luis de Fuentes'), (7, 'Ubeet'), (7, 'Prodat');

-- 3.5 Personal y Usuarios
INSERT INTO personal (nombre_completo, cedula_id, cargo, contacto, contrato, usuario, contrasena, role) VALUES
('CIMAR LUIS FARFAN FIGUEROA', '4124454 Tja.', 'Responsable De Area', '73482164', 'EVENTUAL', 'ADMIN', 'Cimar01', 'ADMIN'),
('LILIAN KARINA CASTRO GARCIA', '1894887 Tja.', 'Tecnico', '72997453', 'ADMINISTRATIVO', 'USER', 'Carina01', 'USER'),
('KEVIN FLORES VALLEJOS', '7200607 Tja.', 'Sistemas', '69309970', 'ADMINISTRATIVO', 'ROOT', 'Koffy01', 'ROOT'),
('EDWIN LOPEZ HOYOS', '1833889 Tja.', 'Tecnico', '72996464', 'PERMANENTE', NULL, NULL, 'TECNICO'),
('ROBERTO CHAVARRIA QUISPE', '7200577 Tja.', 'Trepador', '78247901', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('ROBERTO NARVAEZ', '00000000 Tja.', 'Trepador', '75113822', 'PERMANENTE', NULL, NULL, 'TECNICO'),
('REYNALDO ZENTENO ROJAS', '5057779 Tja.', 'Chofer', '72907569', 'EVENTUAL', NULL, NULL, 'TECNICO'),
('BEYMAR GARCIA FLORES', '10716931 Tja.', 'Cargador', '63792625', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('ARMANDO GARECA ZELAYA', '5003103 Tja.', 'Cargador', '75115551', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('PAULINO GUTIERREZ RODRIGUEZ', '7110213 Tja.', 'Cargador', '69311682', 'PERMANENTE', NULL, NULL, 'TECNICO'),
('CESAR VEGA PADILLA', '3054073 Cbb.', 'Tecnico', '61873799', 'PERMANENTE', NULL, NULL, 'TECNICO'),
('JOSE ENRIQUE ORTEGA', '7219742 Tja.', 'Trepador', '75114807', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('EDGAR PEREZ CHOQUE', '7143967  Tja.', 'Trepador', '70236941', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('BERNARDO IVAN AGUADO COLQUE', '10674059 Tja.', 'Trepador', '67965473', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('DIEGO ORLANDO CARDOZO SANCHEZ', '10620182 Tja.', 'Operador', '75148684', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('EDWIN CALDERON', '7137080 Tja.', 'Chofer', '72942425', 'PERMANENTE', NULL, NULL, 'TECNICO'),
('JUAN PABLO BONILLA', '7238304 Tja.', 'Tecnico', '73451411', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('TONI FRANZ ZURITA ZARSURI', '12796991 Lp', 'Trepador', '69313378', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('ROLANDO NINA CACERES', '7143149 Tja', 'Trepador', '76185838', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('CRISTIAN DAVID ORTEGA ACOSTA', '7104480  Tja.', 'Trepador', '69257096', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('ALEX FERNANDO MARQUEZ ORTEGA', '7216359 Tja.', 'Operador', '77170353', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('LUIS PECA PEÑALOZA', '7208030 Tja.', 'Cargador', '69324565', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('JORGE CANDIA DIAZ', '4143886 Tja.', 'Tecnico', '68742857', 'CONSULTOR DE LINEA', NULL, NULL, 'TECNICO'),
('JULIANO ROLANDO RAMIREZ LA FUENTE', '10669151 Tja.', 'Toconero', '78237004', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('JOEL ABRAHAM CAMACHO MAMANI', '7247850 Tja.', 'Cargador', '70216524', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('JAVIER FRANCISCO MEJIA YUCRA', '7231445 Tja.', 'Trepador', '79255387', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('BRAYAN ALBORNOZ', '7199970 Tja.', 'Trepador', '77174857', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO'),
('ELVIRO DIAZ ORTIZ', '7116719 Tja.', 'Chofer', '74524536', 'CONSULTOR DE LINEA', NULL, NULL, 'TECNICO'),
('RICARDO NARVAEZ RAMOS', '12409703 Tja.', 'Toconero', '67965464', 'ADMINISTRATIVO', NULL, NULL, 'TECNICO');

-- 3.6 Acciones de Poda
INSERT INTO acciones_catalogo (nombre_accion, descripcion) VALUES
('Poda de Formación', 'Corte de ramas secas, elevación de copa y despeje de pantallas urbanas o luminarias.'),
('Despunte', 'Reducción controlada de la copa y altura del árbol para mitigar riesgos o interferencias.'),
('Derribe Controlado', 'Tala o eliminación total del espécimen debido a muerte (árbol seco), pudrición, inclinación severa o daño estructural irreversible.'),
('Emergencia', 'Intervención inmediata por árbol caído o con peligro inminente de colapso.'),
('Poda de Raíces', 'Corte controlado de raíces que causan daños a pavimentos, aceras o estructuras cercanas.'),
('Extracción de Tocón', 'Remoción del remanente del tronco (tocón) y raíces superficiales para evitar rebrotes o plagas.'),
('Poda General y otros', 'Ejecución de múltiples tipos de poda combinada, sujeto al diagnóstico del criterio técnico en campo.'),
('No Determinado', 'Pendiente de evaluación técnica en el lugar.');

-- 3.7 Especies de Árboles
INSERT INTO especies_arboles (nombre_comun, nombre_cientifico) VALUES
('Acacia de tres espinas', 'Gleditsia triacanthos'), ('Acacia / Aromo', 'Acacia caven'), ('Acaí boliviano', 'Euterpe precatoria'), ('Alcornoque', 'Quercus suber'), ('Algarrobo', 'Prosopis spp.'), ('Aliso', 'Alnus acuminata'), ('Álamo', 'Populus nigra'), ('Álamo deltoide', 'Populus deltoides'), ('Álamo plateado', 'Populus alba'), ('Álamo vela', 'Populus nigra'), ('Algarrobo negro', 'Prosopis nigra'), ('Albarillo', 'Prunus armeniaca'), ('Araucaria', 'Araucaria bidwillii'), ('Arce', 'Acer campestre'), ('Bingo de Oro', 'Duranta repens'), ('Bolaina', 'Guazuma crinita'), ('Brachichito', 'Brachychiton populneus'), ('Camajuú', 'Terminalia oblonga'), ('Carnaval', 'Cassia carnaval'), ('Casuarina', 'Casuarina equisetifolia'), ('Ceibo', 'Erythrina crista-galli'), ('Chamba / Leucacia', 'Leucaena leucocephala'), ('Chañar', 'Geoffroea decorticans'), ('Chirimoya', 'Annona cherimola'), ('Churqui', 'Acacia caven'), ('Cina cina', 'Parkinsonia aculeata'), ('Ciprés', 'Cupressus spp.'), ('Ciruelo', 'Prunus domestica'), ('Corona de cristo / Coronillo', 'Gledisia amorphoides'), ('Crespones / Crespón', 'Lagerstroemia indica'), ('Cucarda', 'Hibiscus rosa-sinensis'), ('Cuyoja / Vilco', 'Anadenanthera colubrina'), ('Duranta', 'Duranta repens'), ('Durazno', 'Prunus persica'), ('Estrella Federal', 'Euphorbia pulcherrima'), ('Eucalipto', 'Eucalyptus spp.'), ('Ficus', 'Ficus benjamina'), ('Floripondio', 'Brugmansia arborea'), ('Fresno', 'Fraxinus spp.'), ('Gomero', 'Ficus elastica'), ('Granada', 'Punica granatum'), ('Granadilla', 'Passiflora ligularis'), ('Grevillea', 'Grevillea robusta'), ('Guaranguay', 'Tecoma stans'), ('Guayabo', 'Psidium guajava'), ('Guinda', 'Prunus cerasus'), ('Higueras / Higuera', 'Ficus carica'), ('Ibirapitá / Run Run', 'Peltophorum dubium'), ('Jarca', 'Vachellia aroma'), ('Jasmin paraguayo', 'Brunfelsia calycina'), ('Janchicha', 'Parajubaea sunkha'), ('Lapacho', 'Tabebuia spp.'), ('Lapacho amarillo', 'Handroanthus albus'), ('Lapacho blanco', 'Handroanthus serratifolius'), ('Lapacho rosado', 'Handroanthus impetiginosus'), ('Laurel', 'Ocotea spp.'), ('Laurel de comer', 'Laurus nobilis'), ('Laurel rosa / Rosa laurel', 'Nerium oleander'), ('Lecherón', 'Euphorbia cotinifolia'), ('Ligustre', 'Ligustrum lucidum'), ('Ligustrillo', 'Ligustrum vulgare'), ('Limonero', 'Citrus limon'), ('Magnolia', 'Magnolia grandiflora'), ('Mandarina', 'Citrus reticulata'), ('Manzana', 'Malus domestica'), ('Mara', 'Swietenia macrophylla'), ('Membrillo', 'Cydonia oblonga'), ('Molle', 'Schinus molle'), ('Molle chileno', 'Schinus fasciculatus'), ('Mora', 'Morus nigra'), ('Motacú', 'Attalea phalerata'), ('Naranjo', 'Citrus sinensis'), ('Naranjo agrio', 'Citrus aurantium'), ('Níspero', 'Eriobotrya japonica'), ('Nogal', 'Juglans spp.'), ('Olivo', 'Olea europaea'), ('Olmo', 'Ulmus spp.'), ('Pajarilla', 'Caesalpinia japonica'), ('Pachiuva', 'Socratea exorrhiza'), ('Palma real', 'Syagrus romanzoffiana'), ('Palmera abanico', 'Livistona chinensis'), ('Palmera datilera', 'Phoenix canariensis'), ('Palmera (General)', 'Arecaceae spp.'), ('Palta', 'Persea americana'), ('Papaya', 'Carica papaya'), ('Paraíso', 'Melia azedarach'), ('Pata de vaca', 'Bauhinia forficata'), ('Pino de cerro', 'Podocarpus parlatorei'), ('Pino patula', 'Pinus patula'), ('Pino radiata', 'Pinus radiata'), ('Pino vela', 'Cupressus sempervirens'), ('Pino (General)', 'Pinus spp.'), ('Pomelo', 'Citrus paradisi'), ('Quebracho colorado', 'Schinopsis balansae'), ('Santa Rita', 'Bougainvillea sp.'), ('Sauce criollo', 'Salix humboldtiana'), ('Sauce llorón', 'Salix babylonica'), ('Senasina', 'Senna spectabilis'), ('Soto', 'Schinopsis haenkeana'), ('Taco / Algarrobo blanco', 'Prosopis alba'), ('Tarco', 'Jacaranda mimosifolia'), ('Timboy', 'Enterolobium contortisiliquium'), ('Tipa', 'Tipuana tipu'), ('Toborochi', 'Ceiba speciosa'), ('Tusca', 'Acacia aroma'), ('Urundéy', 'Astronium urundeuva'),
('No Determinado', NULL);

-- =============================================================================
-- 4. POBLADO DE SOLICITUDES DE PRUEBA (25 REGISTROS VARIADOS ENERO-MAYO 2026)
-- =============================================================================

INSERT INTO solicitudes_poda (id_solicitud, codigo_anual, fecha_ingreso, comunicacion_interna, id_tipo_solicitante, id_institucion, nombre_solicitante, telefono_solicitante, nota_solicitud_sucia, id_distrito, id_barrio, calle, numero_casa, referencia_casa, ubicacion_gps, fecha_inspeccion, id_tecnico_verificador, esta_verificado, requiere_plataforma, requiere_ficha_tecnica, procede_solicitud, es_arbol_seco, es_emergencia, urgencia, estado_general, fecha_execution, id_tecnico_ejecucion, observacion_ejecucion, trabajos_extra) VALUES 
(1, '002/26', '2026-03-19', 'CI-797/2026', 1, NULL, 'Sonia Martínez', '6699923', 'Pide podar urgente porque hay un nido de avispas grandes que ataca a la gente que pasa.', 7, 23, 'Calle Ingavi N° 238', '63', 'Detrás de la iglesia evangélica.', '-21.537956, -64.736987', '2026-03-23', 2, 'Sí', 1, 1, 1, 0, 0, 'Media', 'Terminado', '2026-03-30', 22, 'Poda ejecutada. El vecino inicialmente se oponía a que cortemos tanto, pero al final entendió el riesgo técnico.', 'Ninguno'),
(2, '009/26', '2026-01-26', NULL, 1, NULL, 'Sonia Mendoza', '6269415', 'Solicita derribe porque las raíces están levantando toda la acera de cemento y están rompiendo el tubo de agua potable.', 7, 28, 'Av. Las Américas N° 100', '19', 'Cerca de la parada del micro de la línea 4.', '-21.531649, -64.733615', '2026-01-30', 2, 'Sí', 0, 0, 1, 0, 0, 'Media', 'Terminado', '2026-02-01', 4, 'Se realizó la poda de todas las ramas secas con éxito. El vecino quedó conforme.', 'Ninguno'),
(3, '024/26', '2026-03-14', NULL, 1, NULL, 'Jorge Vargas', '7495392', 'Menciona que las ramas tapan el letrero comercial de su tienda y las hojas trancan su canaleta de desagüe.', 13, 89, 'Calle Colón N° 100', '19', 'A media cuadra de la posta policial.', '-21.532354, -64.736181', '2026-03-17', 2, 'Sí', 1, 1, 1, 0, 0, 'Media', 'Terminado', '2026-03-21', 11, 'Se retiró el tocón superficial usando maquinaria pesada. Aceras despejadas.', 'Ninguno'),
(4, '032/26', '2026-05-18', NULL, 7, 14, 'Director(a) de Edifu', '7562634', 'El vecino indica que el próximo mes es el aniversario del barrio y quieren que la plaza se vea limpia y bonita.', 11, 75, 'Calle Sucre N° 148', '11', 'Frente al colegio, puerta de garaje negra.', '-21.537243, -64.738872', '2026-05-23', 2, 'Sí', 0, 1, 1, 0, 0, 'Media', 'En espera', NULL, NULL, NULL, NULL),
(5, '046/26', '2026-01-16', 'CI-287/2026', 1, NULL, 'María Vargas', '7709322', 'Menciona que las ramas tapan el letrero comercial de su tienda y las hojas trancan su canaleta de desagüe.', 6, 17, 'Calle Alejandro del Carpio N° 218', '29', 'A la vuelta de la tienda de barrio Doña María.', '-21.538573, -64.735166', '2026-01-19', 2, 'Sí', 0, 0, 1, 0, 0, 'Baja', 'Terminado', '2026-01-26', 17, 'Se retiró el tocón superficial usando maquinaria pesada. Aceras despejadas.', 'Ninguno'),
(6, '085/26', '2026-03-26', NULL, 1, NULL, 'Juan Sánchez', '6367500', 'Pide una limpieza general de copas porque el árbol está lleno de plantas parásitas (pajarilla) y se está secando.', 9, 56, 'Calle Bolívar N° 178', '60', 'Al frente de la plaza principal, portón verde.', '-21.533230, -64.739775', '2026-03-28', 2, 'Sí', 1, 0, 1, 0, 0, 'Media', 'En espera', NULL, NULL, NULL, NULL),
(7, '112/26', '2026-02-18', 'CI-263/2026', 1, NULL, 'Jorge Chávez', '6316279', 'Solicita derribe porque las raíces están levantando toda la acera de cemento y están rompiendo el tubo de agua potable.', 7, 28, 'Av. Las Américas N° 292', '58', 'Frente al colegio, puerta de garaje negra.', '-21.532158, -64.733596', '2026-02-21', 2, 'Sí', 0, 0, 1, 0, 0, 'Baja', 'Terminado', '2026-02-28', 22, 'Trabajo realizado parcialmente, no se pudo cortar una rama principal debido a la proximidad extrema con cables de SETAR de alta tensión. Pendiente coordinación.', 'Ninguno'),
(8, '115/26', '2026-02-09', NULL, 5, NULL, 'Pedro Flores', '6663529', 'Dice que las ramas ya taparon toda la luminaria pública y en la noche la calle es muy peligrosa y oscura.', 7, 33, 'Calle Corrado N° 208', '47', 'Justo en la esquina frente al surtidor.', '-21.535878, -64.737194', NULL, 2, 'No', 0, 1, 1, 0, 0, 'Media', 'En espera', NULL, NULL, NULL, NULL),
(9, '129/26', '2026-02-19', NULL, 1, NULL, 'Ramiro Chávez', '6990425', 'El árbol sufrió una rajadura en el tronco principal tras la última granizada y parece que se va a partir a la mitad.', 7, 34, 'Av. Las Américas N° 263', '10', 'Justo en la esquina frente al surtidor.', '-21.533816, -64.739194', '2026-02-20', 2, 'Sí', 1, 0, 1, 0, 0, 'Media', 'Terminado', '2026-02-23', 4, 'Se retiró el tocón superficial usando maquinaria pesada. Aceras despejadas.', 'Ninguno'),
(10, '156/26', '2026-03-24', NULL, 7, 6, 'Director(a) de Monte Cercado', '7578762', 'El árbol está completamente seco desde el año pasado y hay riesgo de que caiga sobre el techo de calamina de su vecino si hay una tormenta.', 6, 6, 'Calle Comercio N° 45', '71', 'Al frente de la plaza principal, portón verde.', '-21.533036, -64.733560', '2026-03-26', 2, 'Sí', 1, 1, 1, 1, 0, 'Alta', 'Terminado', '2026-04-03', 4, 'Se realizó la poda de todas las ramas secas con éxito. El vecino quedó conforme.', 'Ninguno'),
(11, '234/26', '2026-04-18', 'CI-253/2026', 7, 15, 'Director(a) de Sella Cercado', '6967060', 'El árbol sufrió una rajadura en el tronco principal tras la última granizada y parece que se va a partir a la mitad.', 9, 58, 'Calle Madrid N° 215', '35', 'Al frente de la plaza principal, portón verde.', '-21.531777, -64.736024', '2026-04-22', 2, 'Sí', 0, 0, 1, 0, 0, 'Media', 'Terminado', '2026-05-01', 4, 'Atendido de emergencia inmediata por árbol caído en vía pública. Se trozó el tronco y se habilitó el tráfico.', 'Ninguno'),
(12, '287/26', '2026-03-01', NULL, 1, NULL, 'David Torres', '7156676', 'Es una carta del director pidiendo despeje porque las ramas del lapacho chocan directo con los cables de alta tensión y botan chispas con el viento.', 10, 69, 'Av. Víctor Paz N° 212', '69', 'Casa con un portón blanco de fierro grande.', '-21.532533, -64.731680', '2026-03-06', 2, 'Sí', 1, 1, 1, 0, 0, 'Media', 'Terminado', '2026-03-15', 11, 'Se realizó la poda de todas las ramas secas con éxito. El vecino quedó conforme.', 'Ninguno'),
(13, '305/26', '2026-05-09', NULL, 1, NULL, 'Martha Mendoza', '6481741', 'Dice que las ramas ya taparon toda la luminaria pública y en la noche la calle es muy peligrosa y oscura.', 7, 30, 'Calle Sucre N° 229', '68', 'Al lado de una casa en construcción.', '-21.537021, -64.738830', '2026-05-13', 2, 'Sí', 0, 1, 1, 0, 0, 'Media', 'En espera', NULL, NULL, NULL, NULL),
(14, '314/26', '2026-01-08', 'CI-584/2026', 7, 7, 'Director(a) de Pampa Redonda', '7233816', 'Pide podar urgente porque hay un nido de avispas grandes que ataca a la gente que pasa.', 7, 24, 'Calle La Paz N° 285', '41', 'Detrás de la iglesia evangélica.', '-21.534830, -64.736806', '2026-01-11', 2, 'Sí', 0, 1, 1, 0, 1, 'Alta', 'Terminado', '2026-01-14', 11, 'Trabajo realizado parcialmente, no se pudo cortar una rama principal debido a la proximidad extrema con cables de SETAR de alta tensión. Pendiente coordinación.', 'Se realizó poda de raíz extra a un árbol colindante a solicitud del supervisor.'),
(15, '318/26', '2026-03-11', 'CI-840/2026', 1, NULL, 'Jorge Chávez', '6681498', 'El vecino indica que el próximo mes es el aniversario del barrio y quieren que la plaza se vea limpia y bonita.', 12, 80, 'Av. Integración N° 27', '94', 'Frente al colegio, puerta de garaje negra.', '-21.532320, -64.738151', '2026-03-13', 2, 'Sí', 1, 0, 1, 0, 0, 'Media', 'Terminado', '2026-03-21', 4, 'Se realizó la poda de todas las ramas secas con éxito. El vecino quedó conforme.', 'Ninguno'),
(16, '326/26', '2026-02-12', NULL, 1, NULL, 'Ana Mendoza', '7847952', 'Solicitud de poda de raíces porque ya están rajando el muro perimetral de la casa y hay peligro de derrumbe.', 6, 17, 'Calle Comercio N° 281', '74', 'A media cuadra de la posta policial.', '-21.537549, -64.734898', '2026-02-16', 2, 'Sí', 0, 1, 1, 0, 0, 'Baja', 'Terminado', '2026-02-23', 17, 'Se hizo el despunte de reducción de copa sin novedades. Todo tranquilo.', 'Ninguno'),
(17, '344/26', '2026-04-10', NULL, 1, NULL, 'Pedro Vargas', '7356262', 'Menciona que las ramas tapan el letrero comercial de su tienda y las hojas trancan su canaleta de desagüe.', 13, 85, 'Calle La Paz N° 108', '43', 'Detrás de la iglesia evangélica.', '-21.538521, -64.738114', NULL, 2, 'No', 1, 0, 1, 0, 0, 'Media', 'En espera', NULL, NULL, NULL, NULL),
(18, '359/26', '2026-03-07', 'CI-401/2026', 1, NULL, 'Luisa López', '7311130', 'Pide podar urgente porque hay un nido de avispas grandes que ataca a la gente que pasa.', 7, 26, 'Calle Sucre N° 110', '19', 'A media cuadra de la posta policial.', '-21.537522, -64.739775', '2026-03-09', 2, 'Sí', 0, 1, 1, 0, 0, 'Baja', 'Terminado', '2026-03-13', 17, 'Se procedió al derribe completo del espécimen seco. Se requirió apoyo de camión grúa por la altura.', 'Ninguno'),
(19, '361/26', '2026-01-13', 'CI-466/2026', 1, NULL, 'María Cross', '7233215', 'El vecino indica que el próximo mes es el aniversario del barrio y quieren que la plaza se vea limpia y bonita.', 11, 74, 'Calle Comercio N° 296', '93', 'Cerca de la parada del micro de la línea 4.', '-21.539860, -64.736074', '2026-01-14', 2, 'Sí', 1, 1, 1, 0, 0, 'Baja', 'Terminado', '2026-01-20', 22, 'Se procedió al derribe completo del espécimen seco. Se requirió apoyo de camión grúa por la altura.', 'Ninguno'),
(20, '365/26', '2026-02-14', NULL, 1, NULL, 'Jorge Vargas', '7630737', 'Pide podar urgente porque hay un nido de avispas grandes que ataca a la gente que pasa.', 6, 6, 'Calle Comercio N° 194', '42', 'Cerca de la parada del micro de la línea 4.', '-21.539076, -64.731776', '2026-02-19', 2, 'Sí', 1, 0, 1, 0, 0, 'Media', 'Terminado', '2026-03-01', 11, 'Se realizó la poda de todas las ramas secas con éxito. El vecino quedó conforme.', 'Ninguno'),
(21, '388/26', '2026-04-15', 'CI-509/2026', 1, NULL, 'Ana Flores', '7848604', 'Menciona que las ramas tapan el letrero comercial de su tienda y las hojas trancan su canaleta de desagüe.', 11, 74, 'Calle Corrado N° 201', '35', 'A la vuelta de la tienda de barrio Doña María.', '-21.534812, -64.735071', '2026-04-16', 2, 'Sí', 1, 1, 1, 0, 0, 'Baja', 'Terminado', '2026-04-20', 4, 'Se realizó la poda de todas las ramas secas con éxito. El vecino quedó conforme.', 'Se realizó poda de raíz extra a un árbol colindante a solicitud del supervisor.'),
(22, '392/26', '2026-01-16', NULL, 2, 21, 'Director(a) de 3 de Mayo', '7730953', 'Solicita derribe porque las raíces están levantando toda la acera de cemento y están rompiendo el tubo de agua potable.', 7, 24, 'Calle Colón N° 63', '26', 'Al frente de la plaza principal, portón verde.', '-21.536340, -64.737107', '2026-01-21', 2, 'Sí', 0, 0, 1, 0, 0, 'Media', 'Terminado', '2026-01-30', 4, 'Atendido de emergencia inmediata por árbol caído en vía pública. Se trozó el tronco y se habilitó el tráfico.', 'Ninguno'),
(23, '401/26', '2026-03-02', 'CI-115/2026', 1, NULL, 'Martha Gómez', '7598501', 'Es una carta del director pidiendo despeje porque las ramas del lapacho chocan directo con los cables de alta tensión y botan chispas con el viento.', 9, 45, 'Calle La Paz N° 100', '11', 'Pasando el puente de tierra, mano derecha.', '-21.539828, -64.734493', '2026-03-06', 2, 'Sí', 0, 0, 1, 0, 0, 'Media', 'Terminado', '2026-03-12', 4, 'Se retiró el tocón superficial usando maquinaria pesada. Aceras despejadas.', 'Ninguno'),
(24, '409/26', '2026-04-12', NULL, 1, NULL, 'Jorge Vargas', '6584281', 'Solicitud de poda de raíces porque ya están rajando el muro perimetral de la casa y hay peligro de derrumbe.', 9, 58, 'Calle Comercio N° 124', '77', 'Al frente de la plaza principal, portón verde.', '-21.533276, -64.731778', '2026-04-16', 2, 'Sí', 0, 0, 1, 0, 0, 'Media', 'En espera', NULL, NULL, NULL, NULL),
(25, '412/26', '2026-01-09', NULL, 7, 20, 'Director(a) de 15 de Noviembre', '6529323', 'El árbol está completamente seco desde el año pasado y hay riesgo de que caiga sobre el techo de calamina de su vecino si hay una tormenta.', 13, 85, 'Calle La Paz N° 148', '33', 'Frente al colegio, puerta de garaje negra.', '-21.534812, -64.736999', '2026-01-12', 2, 'Sí', 1, 1, 1, 1, 0, 'Alta', 'Terminado', '2026-01-19', 11, 'Se procedió al derribe completo del espécimen seco. Se requirió apoyo de camión grúa por la altura.', 'Ninguno');

-- Los árboles adjuntos correspondientes (Detalle Relacionado)
INSERT INTO detalle_arboles (id_solicitud, id_especie, id_accion_solicitada, id_accion_realizar, observaciones_arbol, url_foto) VALUES 
(1, 18, 2, 2, 'Árbol ubicado en la acera pública, de aproximadamente 11 metros.', 'fotos/arbol_1_0.jpg'),
(2, 20, 5, 5, 'Árbol ubicado en la acera pública, de aproximadamente 5 metros.', 'fotos/arbol_2_0.jpg'),
(2, 63, 2, 2, 'Árbol ubicado en la acera pública, de aproximadamente 4 metros.', 'fotos/arbol_2_1.jpg'),
(2, 71, 2, 2, 'Árbol ubicado en la acera pública, de aproximadamente 4 metros.', 'fotos/arbol_2_2.jpg'),
(3, 93, 1, 1, 'Árbol ubicado en la acera pública, de aproximadamente 10 metros.', 'fotos/arbol_3_0.jpg'),
(4, 76, 7, 8, 'Árbol ubicado en la acera pública, de aproximadamente 9 metros.', 'fotos/arbol_4_0.jpg'),
(5, 74, 5, 5, 'Árbol ubicado en la acera pública, de aproximadamente 3 metros.', 'fotos/arbol_5_0.jpg'),
(6, 44, 4, 8, 'Árbol ubicado en la acera pública, de aproximadamente 5 metros.', 'fotos/arbol_6_0.jpg'),
(7, 3, 5, 1, 'Árbol ubicado en la acera pública, de aproximadamente 7 metros.', 'fotos/arbol_7_0.jpg'),
(8, 25, 4, 8, 'Árbol ubicado en la acera pública, de aproximadamente 8 metros.', 'fotos/arbol_8_0.jpg'),
(8, 6, 1, 8, 'Árbol ubicado en la acera pública, de aproximadamente 4 metros.', 'fotos/arbol_8_1.jpg'),
(9, 63, 4, 4, 'Árbol ubicado en la acera pública, de aproximadamente 3 metros.', 'fotos/arbol_9_0.jpg'),
(10, 8, 3, 3, 'Árbol ubicado en la acera pública, de aproximadamente 12 metros.', 'fotos/arbol_10_0.jpg'),
(11, 41, 1, 1, 'Árbol ubicado en la acera pública, de aproximadamente 6 metros.', 'fotos/arbol_11_0.jpg'),
(12, 45, 7, 7, 'Árbol ubicado en la acera pública, de aproximadamente 9 metros.', 'fotos/arbol_12_0.jpg'),
(12, 59, 1, 1, 'Árbol ubicado en la acera pública, de aproximadamente 5 metros.', 'fotos/arbol_12_1.jpg'),
(13, 83, 7, 8, 'Árbol ubicado en la acera pública, de aproximadamente 10 metros.', 'fotos/arbol_13_0.jpg'),
(14, 55, 6, 6, 'Árbol ubicado en la acera pública, de aproximadamente 5 metros.', 'fotos/arbol_14_0.jpg'),
(15, 68, 1, 1, 'Árbol ubicado en la acera pública, de aproximadamente 10 metros.', 'fotos/arbol_15_0.jpg'),
(15, 67, 3, 3, 'Árbol ubicado en la acera pública, de aproximadamente 8 metros.', 'fotos/arbol_15_1.jpg'),
(16, 75, 4, 2, 'Árbol ubicado en la acera pública, de aproximadamente 4 metros.', 'fotos/arbol_16_0.jpg'),
(17, 3, 6, 8, 'Árbol ubicado en la acera pública, de aproximadamente 7 metros.', 'fotos/arbol_17_0.jpg'),
(18, 59, 4, 3, 'Árbol ubicado en la acera pública, de aproximadamente 6 metros.', 'fotos/arbol_18_0.jpg'),
(19, 23, 7, 3, 'Árbol ubicado en la acera pública, de aproximadamente 11 metros.', 'fotos/arbol_19_0.jpg'),
(19, 7, 1, 1, 'Árbol ubicado en la acera pública, de aproximadamente 9 metros.', 'fotos/arbol_19_1.jpg'),
(20, 15, 2, 2, 'Árbol ubicado en la acera pública, de aproximadamente 10 metros.', 'fotos/arbol_20_0.jpg'),
(21, 62, 5, 5, 'Árbol exuberantemente grande, de aproximadamente 12 metros.', 'fotos/arbol_21_0.jpg'),
(22, 60, 2, 4, 'Árbol ubicado en la acera pública, de aproximadamente 8 metros.', 'fotos/arbol_22_0.jpg'),
(22, 35, 1, 1, 'Árbol ubicado en la acera pública, de aproximadamente 6 metros.', 'fotos/arbol_22_1.jpg'),
(22, 58, 6, 6, 'Árbol ubicado en la acera pública, de aproximadamente 5 metros.', 'fotos/arbol_22_2.jpg'),
(23, 8, 3, 3, 'Árbol ubicado en la acera pública, de aproximadamente 4 metros.', 'fotos/arbol_23_0.jpg'),
(24, 76, 2, 8, 'Árbol ubicado en la acera pública, de aproximadamente 9 metros.', 'fotos/arbol_24_0.jpg'),
(25, 45, 6, 3, 'Árbol ubicado en la acera pública, de aproximadamente 12 metros.', 'fotos/arbol_25_0.jpg');

-- Insertar configuración por defecto
INSERT IGNORE INTO config_sistema (clave, valor) VALUES 
('nombre_entidad', 'Gobierno Autónomo Municipal de Tarija'),
('sigla_entidad', 'GAMT'),
('color_primario', '#1a4731');
