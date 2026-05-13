-- Inicialización de Base de Datos para dboficina
-- Codificación: UTF-8 (utf8mb4) para español: ñ, acentos, etc.

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS dboficina CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dboficina;

-- 1. Tablas de Catálogos
CREATE TABLE tipos_institucion (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);
INSERT INTO tipos_institucion (id, nombre) VALUES (1, "Área Rural"), (2, "Salud y Hospitales"), (3, "Educación"), (4, "Organización Social"), (5, "Entidad Municipal"), (6, "Institución u Organización");

CREATE TABLE distritos (
    id INT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);
INSERT INTO distritos (id, nombre) VALUES (1, "Distrito 1"), (2, "Distrito 2"), (3, "Distrito 3"), (4, "Distrito 4"), (5, "Distrito 5"), (6, "Distrito 6"), (7, "Distrito 7"), (8, "Distrito 8"), (9, "Distrito 9"), (10, "Distrito 10"), (11, "Distrito 11"), (12, "Distrito 12"), (13, "Distrito 13");

CREATE TABLE barrios (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_distrito INT,
    FOREIGN KEY (id_distrito) REFERENCES distritos(id)
);
-- (Se asume que los barrios se cargan aquí)
INSERT INTO barrios (id, nombre, id_distrito) VALUES (1, "EL MOLINO", 1), (2, "SAN ROQUE", 2), (3, "LAS PANOSAS", 3), (4, "LA PAMPA", 4), (5, "VIRGEN DE FATIMA", 5), (6, "LA LOMA", 6), (7, "EL CARMEN", 6), (8, "GUADALQUIVIR", 6), (9, "57 VIVIENDAS", 6), (10, "LUIS PIZARRO", 6), (11, "15 DE NOVIEMBRE", 6), (12, "JUAN PABLO II", 6), (13, "VIRGEN DE CHAGUAYA", 6), (14, "LIBERTAD", 6), (15, "PANAMERICANO", 6), (16, "15 DE AGOSTO", 6), (17, "LA TORRE", 6), (18, "LA UNION", 6), (19, "CARLOS WAGNNER", 6), (20, "PARAISO", 6), (21, "LOS ALAMOS", 6), (22, "LOS OLIVOS", 6), (23, "4 DE JULIO", 7), (24, "12 DE OCTUBRE", 7), (25, "IV CENTENARIO", 7), (26, "DEFENSORES DEL CHACO", 7), (27, "LAS PASCUAS", 7), (28, "3 DE MAYO", 7), (29, "LOS CHAPACOS", 7), (30, "MARIA DE LOS ANGELES", 7), (31, "15 DE JUNIO", 7), (32, "MUNICIPAL", 7), (33, "19 DE MARZO", 7), (34, "20 DE ENERO", 7), (35, "101 FAMILIAS", 7), (36, "NUEVA ESPERANZA", 7), (37, "EDUARDO AVAROA", 8), (38, "OSCAR ALFARO", 8), (39, "SAN JOSE", 8), (40, "SAN MARCOS", 8), (41, "LOURDES", 8), (42, "LA FLORIDA", 8), (43, "PASCUAS", 8), (44, "LOS LAURELES", 8), (45, "LA HUERTA", 8), (46, "6 DE AGOSTO", 9), (47, "SALAMANCA", 9), (48, "SAN BERNARDO", 9), (49, "ANDALUZ", 9), (50, "02 DE MAYO", 9), (51, "PEDRO ANTONIO FLORES", 9), (52, "CONSTRUCTOR", 9), (53, "24 DE JUNIO", 9), (54, "ANICETO ARCE", 9), (55, "NARCISO CAMPERO", 9), (56, "LUIS ESPINAL", 9), (57, "7 DE SEPTIMBRE", 9), (58, "BARTOLOME ATARD", 9), (59, "MOTO MENDEZ", 9), (60, "JUAN XXIII", 10), (61, "ROSEDAL", 10), (62, "JUAN NICOLAY", 10), (63, "15 DE ABRIL", 10), (64, "AEROPUERTO", 10), (65, "MORROS BLANCOS", 10), (66, "SAN PEDRO", 10), (67, "SAN JORGE 1", 10), (68, "SAN SALVADOR", 10), (69, "SAN JORGE 2", 10), (70, "ARTESANAL", 10), (71, "LINDO SAN GERONIMO", 11), (72, "SAN GERONIMO CENTRO", 11), (73, "SAN GERONIMO SUD", 11), (74, "SAN LUIS", 11), (75, "LA TERMINAL", 11), (76, "PETROLERO", 11), (77, "EL TEJAR", 11), (78, "MIRAFLORES", 12), (79, "GERMAN BUSCH", 12), (80, "ARANJUEZ SUD", 12), (81, "SAN MARTIN", 12), (82, "LUIS DE FUENTES", 13), (83, "CATEDRAL", 13), (84, "SAN ANTONIO", 13), (85, "SAN BLAS", 13), (86, "ALTO SENAC", 13), (87, "SENAC", 13), (88, "TABLADITA I", 13), (89, "TABLADITA II", 13), (90, "MENDEZ ARCOS", 13);

CREATE TABLE instituciones (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    id_tipo INT,
    id_distrito INT,
    FOREIGN KEY (id_tipo) REFERENCES tipos_institucion(id),
    FOREIGN KEY (id_distrito) REFERENCES distritos(id)
);
INSERT INTO instituciones (id, nombre, id_tipo, id_distrito) VALUES (1, "BELLA VISTA", 1, NULL), (19, "C.S. 15 DE NOVIEMBRE", 2, NULL), (39, "U.E. ALBERTO BALDIVIESO", 3, NULL), (51, "Junta Vecinal", 4, NULL), (58, "Despacho Municipal", 5, NULL), (67, "SETAR", 6, NULL);

CREATE TABLE tecnicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cargo VARCHAR(100),
    tipo_contrato VARCHAR(100),
    fecha_ingreso DATE,
    celular VARCHAR(50),
    fecha_nacimiento DATE,
    tipo_sangre VARCHAR(10),
    contacto_emergencia VARCHAR(100),
    celular_emergencia VARCHAR(50),
    foto LONGTEXT
);
INSERT INTO tecnicos (id, nombre) VALUES (1, "Ing. Cimar Farfan"), (2, "Ing. Karina Castro"), (3, "Ing. Cesar Vega"), (4, "Ing. Edwin Lopez"), (5, "Ing. Jorge Candia"), (6, "Ing. Pablo Bonilla"), (7, "Tec. Kevin Flores");

CREATE TABLE especies (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);
INSERT INTO especies (id, nombre) VALUES (1, "Acacia (Aromo)"), (14, "Eucalipto (eucalyptus spp.)"), (31, "Molle (schinus molle)"), (43, "Pino (pinus spp.)"), (65, "No Determinado");

CREATE TABLE acciones (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);
INSERT INTO acciones (id, nombre) VALUES (1, "Poda de Formación"), (2, "Despunte"), (3, "Derribe Controlado"), (4, "Emergencia"), (5, "Poda de Raíces"), (6, "Extracción de Tocón"), (7, "Poda General"), (8, "No Determinado");

-- 2. Tablas Principales
CREATE TABLE solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    fecha_ingreso DATE,
    fecha_verificacion DATE,
    comunicacion_interna VARCHAR(50),
    id_barrio INT,
    id_nombre_institucional INT,
    id_accion INT,
    id_especie INT,
    calle VARCHAR(255),
    numero_casa VARCHAR(50),
    referencia VARCHAR(255),
    solicitante_nombre VARCHAR(100),
    solicitante_telefono VARCHAR(50),
    solicitante_descripcion TEXT,
    lo_solicitado TEXT,
    id_accion_solicitada INT,
    id_tecnico_verificacion INT,
    requiere_plataforma BOOLEAN DEFAULT FALSE,
    requiere_setar BOOLEAN DEFAULT FALSE,
    requiere_ficha_tecnica BOOLEAN DEFAULT FALSE,
    procede BOOLEAN DEFAULT FALSE,
    cantidad_notas INT DEFAULT 1,
    arbol_seco BOOLEAN DEFAULT FALSE,
    es_emergencia BOOLEAN DEFAULT FALSE,
    segunda_nota BOOLEAN DEFAULT FALSE,
    es_urgencia BOOLEAN DEFAULT FALSE,
    nivel_urgencia VARCHAR(50) DEFAULT 'Baja',
    observacion_verificacion TEXT,
    id_tecnico_ejecucion INT,
    fecha_ejecucion DATE,
    observaciones_finales TEXT,
    estado_tramite VARCHAR(50) DEFAULT 'En espera',
    id_tipo_institucion INT,
    FOREIGN KEY (id_barrio) REFERENCES barrios(id),
    FOREIGN KEY (id_nombre_institucional) REFERENCES instituciones(id),
    FOREIGN KEY (id_accion) REFERENCES acciones(id),
    FOREIGN KEY (id_especie) REFERENCES especies(id),
    FOREIGN KEY (id_accion_solicitada) REFERENCES acciones(id),
    FOREIGN KEY (id_tecnico_verificacion) REFERENCES tecnicos(id),
    FOREIGN KEY (id_tecnico_ejecucion) REFERENCES tecnicos(id)
);

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    cargo VARCHAR(100),
    email VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'Activo',
    foto LONGTEXT
);

CREATE TABLE historial_impresiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_reporte VARCHAR(255),
    id_solicitud INT,
    tipo_reporte VARCHAR(50), -- 'Individual' | 'Hoja de Ruta'
    fecha_impresion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario VARCHAR(100),
    filtros_aplicados TEXT, -- Resumen de filtros si es Hoja de Ruta
    detalles JSON, -- Lista de IDs si es consolidado
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE SET NULL
);

CREATE TABLE config_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT
);

-- 3. Carga de Datos Iniciales
INSERT INTO usuarios (username, password, role, nombre, cargo, email, estado) VALUES 
('admin', 'admin', 'ADMIN', 'Ing. Cimar Farfan', 'Ingeniero', 'cfarfan@alcaldiatarija.gob.bo', 'Activo'),
('root', 'password', 'ROOT', 'Tec. Kevin Flores', 'Técnico', 'sistemas.koffys@gmail.com', 'Activo');

INSERT INTO config_sistema (clave, valor) VALUES 
('nombre_entidad', 'Gobierno Autónomo Municipal de Tarija'),
('sigla_entidad', 'GAMT'),
('color_primario', '#1a4731');

-- Solicitudes de Prueba (Asegurando todas las columnas)
INSERT INTO solicitudes (fecha_ingreso, fecha_verificacion, comunicacion_interna, id_barrio, id_nombre_institucional, id_accion, id_especie, calle, numero_casa, referencia, solicitante_nombre, solicitante_telefono, solicitante_descripcion, id_accion_solicitada, id_tecnico_verificacion, requiere_plataforma, requiere_setar, requiere_ficha_tecnica, procede, cantidad_notas, arbol_seco, es_emergencia, nivel_urgencia, estado_tramite) VALUES 
('2024-05-01', '2024-05-03', 'Cod 0001/24', 1, NULL, 1, 31, 'Av. Las Américas', 'S/N', 'Frente al parque', 'Juan Pérez', '76543210', 'Árbol choca con cables.', 1, 1, 1, 1, 0, 1, 1, 0, 0, 'Intermedia', 'En espera'),
('2024-05-02', '2024-05-04', 'Cod 0002/24', 10, 39, 3, 14, 'Calle Colón', '123', 'Colegio', 'Prof. Martha Llanos', '71122334', 'Árbol seco.', 4, 2, 0, 0, 1, 1, 1, 1, 1, 'Alta', 'En espera');
