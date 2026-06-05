const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../oldStore.js');
let dataContent = fs.readFileSync(dataFile, 'utf-8');

// Extract the store string
const startIndex = dataContent.indexOf('store = reactive({') + 17;
const endIndex = dataContent.indexOf('});', startIndex) + 1;
const objStr = dataContent.substring(startIndex, endIndex);

const store = new Function(`return ${objStr}`)();

const personalExcel = [
  { "nombre": "CIMAR LUIS FARFAN FIGUEROA", "cedula": "4124454 Tja.", "cargo": "Responsable De Area", "contrato": "EVENTUAL", "username": "admin", "password": "password", "role": "ADMIN" },
  { "nombre": "LILIAN KARINA CASTRO GARCIA", "cedula": "1894887 Tja.", "cargo": "Tecnico", "contrato": "ADMINISTRATIVO", "username": "carina", "password": "password", "role": "USER" },
  { "nombre": "KEVIN FLORES VALLEJOS", "cedula": "7200607 Tja.", "cargo": "Sistemas", "contrato": "ADMINISTRATIVO", "username": "root", "password": "password", "role": "ROOT" },
  { "nombre": "EDWIN LOPEZ HOYOS", "cedula": "1833889 Tja.", "cargo": "Tecnico", "contrato": "PERMANENTE" },
  { "nombre": "ROBERTO CHAVARRIA QUISPE", "cedula": "7200577 Tja.", "cargo": "Trepador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "ROBERTO NARVAEZ", "cedula": "00000000 Tja.", "cargo": "Trepador", "contrato": "PERMANENTE" },
  { "nombre": "REYNALDO ZENTENO ROJAS", "cedula": "5057779 Tja.", "cargo": "Chofer", "contrato": "EVENTUAL" },
  { "nombre": "BEYMAR GARCIA FLORES", "cedula": "10716931 Tja.", "cargo": "Cargador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "ARMANDO GARECA ZELAYA", "cedula": "5003103 Tja.", "cargo": "Cargador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "PAULINO GUTIERREZ RODRIGUEZ", "cedula": "7110213 Tja.", "cargo": "Cargador", "contrato": "PERMANENTE" },
  { "nombre": "CESAR VEGA PADILLA", "cedula": "3054073 Cbb.", "cargo": "Tecnico", "contrato": "PERMANENTE" },
  { "nombre": "JOSE ENRIQUE ORTEGA", "cedula": "7219742 Tja.", "cargo": "Trepador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "EDGAR PEREZ CHOQUE", "cedula": "7143967 Tja.", "cargo": "Trepador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "BERNARDO IVAN AGUADO COLQUE", "cedula": "10674059 Tja.", "cargo": "Trepador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "DIEGO ORLANDO CARDOZO SANCHEZ", "cedula": "10620182 Tja.", "cargo": "Operador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "EDWIN CALDERON", "cedula": "7137080 Tja.", "cargo": "Chofer", "contrato": "PERMANENTE" },
  { "nombre": "JUAN PABLO BONILLA", "cedula": "7238304 Tja.", "cargo": "Tecnico", "contrato": "ADMINISTRATIVO" },
  { "nombre": "TONI FRANZ ZURITA ZARSURI", "cedula": "12796991 Lp", "cargo": "Trepador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "ROLANDO NINA CACERES", "cedula": "7143149 Tja", "cargo": "Trepador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "CRISTIAN DAVID ORTEGA ACOSTA", "cedula": "7104480 Tja.", "cargo": "Trepador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "ALEX FERNANDO MARQUEZ ORTEGA", "cedula": "7216359 Tja.", "cargo": "Operador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "LUIS PECA PEÑALOZA", "cedula": "7208030 Tja.", "cargo": "Cargador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "JORGE CANDIA DIAZ", "cedula": "4143886 Tja.", "cargo": "Tecnico", "contrato": "CONSULTOR DE LINEA" },
  { "nombre": "JULIANO ROLANDO RAMIREZ LA FUENTE", "cedula": "10669151 Tja.", "cargo": "Toconero", "contrato": "ADMINISTRATIVO" },
  { "nombre": "JOEL ABRAHAM CAMACHO MAMANI", "cedula": "7247850 Tja.", "cargo": "Cargador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "JAVIER FRANCISCO MEJIA YUCRA", "cedula": "7231445 Tja.", "cargo": "Trepador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "BRAYAN ALBORNOZ", "cedula": "7199970 Tja.", "cargo": "Trepador", "contrato": "ADMINISTRATIVO" },
  { "nombre": "ELVIRO DIAZ ORTIZ", "cedula": "7116719 Tja.", "cargo": "Chofer", "contrato": "CONSULTOR DE LINEA" },
  { "nombre": "RICARDO NARVAEZ RAMOS", "cedula": "12409703 Tja.", "cargo": "Toconero", "contrato": "ADMINISTRATIVO" }
];

let sql = `-- Inicialización de Base de Datos (NORMALIZADA CON TABLA PERSONAL)\n\n`;
sql += `CREATE DATABASE IF NOT EXISTS dboficina;\n`;
sql += `USE dboficina;\n\n`;

// 1. Tipos de Institucion
sql += `CREATE TABLE tipos_institucion ( id INT PRIMARY KEY, nombre VARCHAR(255) NOT NULL );\n`;
store.tipos_institucion.forEach(t => sql += `INSERT INTO tipos_institucion (id, nombre) VALUES (${t.id}, "${t.nombre}");\n`);
sql += `\n`;

// 2. Distritos
sql += `CREATE TABLE distritos ( id INT PRIMARY KEY, nombre VARCHAR(50) NOT NULL );\n`;
store.distritos.forEach(d => sql += `INSERT INTO distritos (id, nombre) VALUES (${d.id}, "${d.nombre}");\n`);
sql += `\n`;

// 3. Barrios
sql += `CREATE TABLE barrios ( id INT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, id_distrito INT, FOREIGN KEY (id_distrito) REFERENCES distritos(id) );\n`;
store.barrios.forEach(b => sql += `INSERT INTO barrios (id, nombre, id_distrito) VALUES (${b.id}, "${b.nombre}", ${b.id_distrito});\n`);
sql += `\n`;

// 4. Instituciones
sql += `CREATE TABLE instituciones ( id INT PRIMARY KEY, nombre VARCHAR(255) NOT NULL, id_tipo INT, id_distrito INT, FOREIGN KEY (id_tipo) REFERENCES tipos_institucion(id), FOREIGN KEY (id_distrito) REFERENCES distritos(id) );\n`;
store.instituciones.forEach(i => {
    const id_tipo = i.id_tipo ? i.id_tipo : 'NULL';
    const id_distrito = i.id_distrito ? i.id_distrito : 'NULL';
    sql += `INSERT INTO instituciones (id, nombre, id_tipo, id_distrito) VALUES (${i.id}, "${i.nombre}", ${id_tipo}, ${id_distrito});\n`;
});
sql += `\n`;

// 5. Personal (Fusión de Tecnicos y Usuarios)
sql += `CREATE TABLE personal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    cedula_id VARCHAR(50),
    cargo VARCHAR(100),
    contacto VARCHAR(50),
    tipo_contrato VARCHAR(50),
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'TECNICO',
    estado VARCHAR(20) DEFAULT 'Activo'
);\n`;

personalExcel.forEach((p) => {
    const username = p.username ? `"${p.username}"` : 'NULL';
    const password = p.password ? `"${p.password}"` : 'NULL';
    const role = p.role ? `"${p.role}"` : '"TECNICO"';
    sql += `INSERT INTO personal (nombre, cedula_id, cargo, tipo_contrato, username, password, role) VALUES ("${p.nombre}", "${p.cedula}", "${p.cargo}", "${p.contrato}", ${username}, ${password}, ${role});\n`;
});
sql += `\n`;

// 6. Especies
sql += `CREATE TABLE especies ( id INT PRIMARY KEY, nombre VARCHAR(100) NOT NULL );\n`;
store.especies.forEach(e => sql += `INSERT INTO especies (id, nombre) VALUES (${e.id}, "${e.nombre}");\n`);
sql += `\n`;

// 7. Acciones
sql += `CREATE TABLE acciones ( id INT PRIMARY KEY, nombre VARCHAR(255) NOT NULL );\n`;
store.acciones.forEach(a => sql += `INSERT INTO acciones (id, nombre) VALUES (${a.id}, "${a.nombre}");\n`);
sql += `\n`;

// 8. Solicitudes (Normalizadas)
sql += `
CREATE TABLE solicitudes (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    comunicacion_interna VARCHAR(50),
    fecha_ingreso DATE,
    solicitante_nombre VARCHAR(100),
    solicitante_telefono VARCHAR(50),
    lo_solicitado TEXT,
    id_accion_solicitada INT,
    id_barrio INT,
    calle VARCHAR(255),
    numero_casa VARCHAR(50),
    referencia VARCHAR(255),
    id_nombre_institucional INT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    estado_tramite ENUM('En espera', 'En proceso', 'Ejecutado', 'Rechazado') DEFAULT 'En espera',
    FOREIGN KEY (id_accion_solicitada) REFERENCES acciones(id),
    FOREIGN KEY (id_barrio) REFERENCES barrios(id),
    FOREIGN KEY (id_nombre_institucional) REFERENCES instituciones(id)
);

CREATE TABLE inspecciones (
    id_inspeccion INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL UNIQUE,
    fecha_verificacion DATE,
    id_tecnico_verificacion INT,
    id_especie INT,
    requiere_plataforma BOOLEAN DEFAULT FALSE,
    requiere_setar BOOLEAN DEFAULT FALSE,
    requiere_ficha_tecnica BOOLEAN DEFAULT FALSE,
    procede BOOLEAN DEFAULT TRUE,
    arbol_seco BOOLEAN DEFAULT FALSE,
    es_emergencia BOOLEAN DEFAULT FALSE,
    nivel_urgencia ENUM('Baja', 'Media', 'Alta') DEFAULT 'Baja',
    observacion_verificacion TEXT,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_tecnico_verificacion) REFERENCES personal(id),
    FOREIGN KEY (id_especie) REFERENCES especies(id)
);

CREATE TABLE ejecuciones (
    id_ejecucion INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT NOT NULL UNIQUE,
    fecha_ejecucion DATE,
    id_tecnico_ejecucion INT,
    id_accion INT,
    cantidad_notas INT DEFAULT 0,
    observaciones_finales TEXT,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_tecnico_ejecucion) REFERENCES personal(id),
    FOREIGN KEY (id_accion) REFERENCES acciones(id)
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
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS config_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT
);
INSERT IGNORE INTO config_sistema (clave, valor) VALUES 
('nombre_entidad', 'Gobierno Autónomo Municipal de Tarija'),
('sigla_entidad', 'GAMT'),
('color_primario', '#1a4731');

CREATE TABLE IF NOT EXISTS calendario_barrios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_aniversario DATE NOT NULL,
    nombre_barrio VARCHAR(255) NOT NULL,
    presidente_barrio VARCHAR(255),
    telefono_presidente VARCHAR(50),
    color_etiqueta VARCHAR(50) DEFAULT '#4caf50'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

fs.writeFileSync(path.join(__dirname, 'init.sql'), sql);
console.log('SQL generated successfully with Personal table.');
