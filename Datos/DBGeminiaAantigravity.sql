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
    contrasena VARCHAR(255) NULL
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
INSERT INTO personal (nombre_completo, cedula_id, cargo, contacto, contrato, usuario, contrasena) VALUES
('CIMAR LUIS FARFAN FIGUEROA', '4124454 Tja.', 'Responsable De Area', '73482164', 'EVENTUAL', 'ADMIN', 'Cimar01'),
('LILIAN KARINA CASTRO GARCIA', '1894887 Tja.', 'Tecnico', '72997453', 'ADMINISTRATIVO', 'USER', 'Carina01'),
('KEVIN FLORES VALLEJOS', '7200607 Tja.', 'Sistemas', '69309970', 'ADMINISTRATIVO', 'ROOT', 'Koffy01'),
('EDWIN LOPEZ HOYOS', '1833889 Tja.', 'Tecnico', '72996464', 'PERMANENTE', NULL, NULL),
('ROBERTO CHAVARRIA QUISPE', '7200577 Tja.', 'Trepador', '78247901', 'ADMINISTRATIVO', NULL, NULL),
('ROBERTO NARVAEZ', '00000000 Tja.', 'Trepador', '75113822', 'PERMANENTE', NULL, NULL),
('REYNALDO ZENTENO ROJAS', '5057779 Tja.', 'Chofer', '72907569', 'EVENTUAL', NULL, NULL),
('BEYMAR GARCIA FLORES', '10716931 Tja.', 'Cargador', '63792625', 'ADMINISTRATIVO', NULL, NULL),
('ARMANDO GARECA ZELAYA', '5003103 Tja.', 'Cargador', '75115551', 'ADMINISTRATIVO', NULL, NULL),
('PAULINO GUTIERREZ RODRIGUEZ', '7110213 Tja.', 'Cargador', '69311682', 'PERMANENTE', NULL, NULL),
('CESAR VEGA PADILLA', '3054073 Cbb.', 'Tecnico', '61873799', 'PERMANENTE', NULL, NULL),
('JOSE ENRIQUE ORTEGA', '7219742 Tja.', 'Trepador', '75114807', 'ADMINISTRATIVO', NULL, NULL),
('EDGAR PEREZ CHOQUE', '7143967  Tja.', 'Trepador', '70236941', 'ADMINISTRATIVO', NULL, NULL),
('BERNARDO IVAN AGUADO COLQUE', '10674059 Tja.', 'Trepador', '67965473', 'ADMINISTRATIVO', NULL, NULL),
('DIEGO ORLANDO CARDOZO SANCHEZ', '10620182 Tja.', 'Operador', '75148684', 'ADMINISTRATIVO', NULL, NULL),
('EDWIN CALDERON', '7137080 Tja.', 'Chofer', '72942425', 'PERMANENTE', NULL, NULL),
('JUAN PABLO BONILLA', '7238304 Tja.', 'Tecnico', '73451411', 'ADMINISTRATIVO', NULL, NULL),
('TONI FRANZ ZURITA ZARSURI', '12796991 Lp', 'Trepador', '69313378', 'ADMINISTRATIVO', NULL, NULL),
('ROLANDO NINA CACERES', '7143149 Tja', 'Trepador', '76185838', 'ADMINISTRATIVO', NULL, NULL),
('CRISTIAN DAVID ORTEGA ACOSTA', '7104480  Tja.', 'Trepador', '69257096', 'ADMINISTRATIVO', NULL, NULL),
('ALEX FERNANDO MARQUEZ ORTEGA', '7216359 Tja.', 'Operador', '77170353', 'ADMINISTRATIVO', NULL, NULL),
('LUIS PECA PEÑALOZA', '7208030 Tja.', 'Cargador', '69324565', 'ADMINISTRATIVO', NULL, NULL),
('JORGE CANDIA DIAZ', '4143886 Tja.', 'Tecnico', '68742857', 'CONSULTOR DE LINEA', NULL, NULL),
('JULIANO ROLANDO RAMIREZ LA FUENTE', '10669151 Tja.', 'Toconero', '78237004', 'ADMINISTRATIVO', NULL, NULL),
('JOEL ABRAHAM CAMACHO MAMANI', '7247850 Tja.', 'Cargador', '70216524', 'ADMINISTRATIVO', NULL, NULL),
('JAVIER FRANCISCO MEJIA YUCRA', '7231445 Tja.', 'Trepador', '79255387', 'ADMINISTRATIVO', NULL, NULL),
('BRAYAN ALBORNOZ', '7199970 Tja.', 'Trepador', '77174857', 'ADMINISTRATIVO', NULL, NULL),
('ELVIRO DIAZ ORTIZ', '7116719 Tja.', 'Chofer', '74524536', 'CONSULTOR DE LINEA', NULL, NULL),
('RICARDO NARVAEZ RAMOS', '12409703 Tja.', 'Toconero', '67965464', 'ADMINISTRATIVO', NULL, NULL);

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