import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, '../src/store/mainStore.js');

let dataContent = fs.readFileSync(dataFile, 'utf-8');

// Extract the store string
const startIdx = dataContent.indexOf('store = reactive({') + 17;
const endIdx = dataContent.indexOf('  });', startIdx) + 3;
const storeStr = dataContent.substring(startIdx, endIdx);

// Evaluate it safely
const store = new Function('return ' + storeStr)();

let sql = `-- Inicialización de Base de Datos para dboficina\n\n`;
sql += `CREATE DATABASE IF NOT EXISTS dboficina;\nUSE dboficina;\n\n`;

// 1. Tipos de Institucion
sql += `CREATE TABLE tipos_institucion (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);\n`;
store.tipos_institucion.forEach(t => {
    sql += `INSERT INTO tipos_institucion (id, nombre) VALUES (${t.id}, "${t.nombre}");\n`;
});
sql += `\n`;

// 2. Distritos
sql += `CREATE TABLE distritos (
    id INT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);\n`;
store.distritos.forEach(d => {
    sql += `INSERT INTO distritos (id, nombre) VALUES (${d.id}, "${d.nombre}");\n`;
});
sql += `\n`;

// 3. Barrios
sql += `CREATE TABLE barrios (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_distrito INT,
    FOREIGN KEY (id_distrito) REFERENCES distritos(id)
);\n`;
store.barrios.forEach(b => {
    sql += `INSERT INTO barrios (id, nombre, id_distrito) VALUES (${b.id}, "${b.nombre}", ${b.id_distrito});\n`;
});
sql += `\n`;

// 4. Instituciones
sql += `CREATE TABLE instituciones (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    id_tipo INT,
    id_distrito INT,
    FOREIGN KEY (id_tipo) REFERENCES tipos_institucion(id),
    FOREIGN KEY (id_distrito) REFERENCES distritos(id)
);\n`;
store.instituciones.forEach(i => {
    const id_tipo = i.id_tipo ? i.id_tipo : 'NULL';
    const id_distrito = i.id_distrito ? i.id_distrito : 'NULL';
    sql += `INSERT INTO instituciones (id, nombre, id_tipo, id_distrito) VALUES (${i.id}, "${i.nombre}", ${id_tipo}, ${id_distrito});\n`;
});
sql += `\n`;

// 5. Tecnicos
sql += `CREATE TABLE tecnicos (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);\n`;
store.tecnicos.forEach(t => {
    sql += `INSERT INTO tecnicos (id, nombre) VALUES (${t.id}, "${t.nombre}");\n`;
});
sql += `\n`;

// 6. Especies
sql += `CREATE TABLE especies (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);\n`;
store.especies.forEach(e => {
    sql += `INSERT INTO especies (id, nombre) VALUES (${e.id}, "${e.nombre}");\n`;
});
sql += `\n`;

// 7. Acciones
sql += `CREATE TABLE acciones (
    id INT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);\n`;
store.acciones.forEach(a => {
    sql += `INSERT INTO acciones (id, nombre) VALUES (${a.id}, "${a.nombre}");\n`;
});
sql += `\n`;

// 8. Solicitudes
sql += `CREATE TABLE solicitudes (
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
    lo_solicitado TEXT,
    id_accion_solicitada INT,
    id_tecnico_verificacion INT,
    requiere_plataforma BOOLEAN,
    requiere_setar BOOLEAN,
    requiere_ficha_tecnica BOOLEAN,
    procede BOOLEAN,
    cantidad_notas INT,
    arbol_seco BOOLEAN,
    es_emergencia BOOLEAN,
    nivel_urgencia VARCHAR(50),
    observacion_verificacion TEXT,
    id_tecnico_ejecucion INT,
    fecha_ejecucion DATE,
    observaciones_finales TEXT,
    estado_tramite VARCHAR(50),
    FOREIGN KEY (id_barrio) REFERENCES barrios(id),
    FOREIGN KEY (id_nombre_institucional) REFERENCES instituciones(id),
    FOREIGN KEY (id_accion) REFERENCES acciones(id),
    FOREIGN KEY (id_especie) REFERENCES especies(id),
    FOREIGN KEY (id_accion_solicitada) REFERENCES acciones(id),
    FOREIGN KEY (id_tecnico_verificacion) REFERENCES tecnicos(id),
    FOREIGN KEY (id_tecnico_ejecucion) REFERENCES tecnicos(id)
);\n`;

store.solicitudes.forEach(s => {
    const vals = [
        s.id_solicitud,
        s.fecha_ingreso ? `"${s.fecha_ingreso}"` : 'NULL',
        s.fecha_verificacion ? `"${s.fecha_verificacion}"` : 'NULL',
        s.comunicacion_interna ? `"${s.comunicacion_interna}"` : 'NULL',
        s.id_barrio ? s.id_barrio : 'NULL',
        s.id_nombre_institucional ? s.id_nombre_institucional : 'NULL',
        s.id_accion ? s.id_accion : 'NULL',
        s.id_especie ? s.id_especie : 'NULL',
        s.calle ? `"${s.calle}"` : 'NULL',
        s.numero_casa ? `"${s.numero_casa}"` : 'NULL',
        s.referencia ? `"${s.referencia}"` : 'NULL',
        s.solicitante_nombre ? `"${s.solicitante_nombre}"` : 'NULL',
        s.solicitante_telefono ? `"${s.solicitante_telefono}"` : 'NULL',
        s.lo_solicitado ? `"${s.lo_solicitado}"` : 'NULL',
        s.id_accion_solicitada ? s.id_accion_solicitada : 'NULL',
        s.id_tecnico_verificacion ? s.id_tecnico_verificacion : 'NULL',
        s.requiere_plataforma ? 1 : 0,
        s.requiere_setar ? 1 : 0,
        s.requiere_ficha_tecnica ? 1 : 0,
        s.procede ? 1 : 0,
        s.cantidad_notas ? s.cantidad_notas : 0,
        s.arbol_seco ? 1 : 0,
        s.es_emergencia ? 1 : 0,
        s.nivel_urgencia ? `"${s.nivel_urgencia}"` : 'NULL',
        s.observacion_verificacion ? `"${s.observacion_verificacion}"` : 'NULL',
        s.id_tecnico_ejecucion ? s.id_tecnico_ejecucion : 'NULL',
        s.fecha_ejecucion ? `"${s.fecha_ejecucion}"` : 'NULL',
        s.observaciones_finales ? `"${s.observaciones_finales}"` : 'NULL',
        s.estado_tramite ? `"${s.estado_tramite}"` : 'NULL'
    ];
    sql += `INSERT INTO solicitudes VALUES (${vals.join(', ')});\n`;
});

// 9. Usuarios
sql += `CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    cargo VARCHAR(100),
    email VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'Activo'
);\n`;
sql += `INSERT IGNORE INTO usuarios (id, username, password, role, nombre, cargo, email, estado) VALUES 
(1, 'admin', 'admin', 'ADMIN', 'Ing. Cimar Farfan', 'Ingeniero', 'cfarfan@alcaldiatarija.gob.bo', 'Activo'),
(2, 'root', 'password', 'ROOT', 'Tec. Kevin Flores', 'Técnico', 'sistemas.koffys@gmail.com', 'Activo');\n\n`;

// 10. Historial Impresiones
sql += `CREATE TABLE IF NOT EXISTS historial_impresiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_reporte VARCHAR(255) NOT NULL,
    id_solicitud INT NULL,
    tipo_reporte VARCHAR(100),
    usuario VARCHAR(100),
    fecha_impresion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filtros_aplicados TEXT NULL,
    detalles TEXT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE SET NULL
);\n\n`;

// 11. Config Sistema
sql += `CREATE TABLE IF NOT EXISTS config_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT
);\n`;
sql += `INSERT IGNORE INTO config_sistema (clave, valor) VALUES 
('nombre_entidad', 'Gobierno Autónomo Municipal de Tarija'),
('sigla_entidad', 'GAMT'),
('color_primario', '#1a4731');\n\n`;

// 12. Calendario Barrios
sql += `CREATE TABLE IF NOT EXISTS calendario_barrios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_aniversario DATE NOT NULL,
    nombre_barrio VARCHAR(255) NOT NULL,
    presidente_barrio VARCHAR(255),
    telefono_presidente VARCHAR(50),
    color_etiqueta VARCHAR(50) DEFAULT '#4caf50'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`;

try {
    const calendarSeedFile = path.join(__dirname, '../seed_calendar.sql');
    const calendarSeed = fs.readFileSync(calendarSeedFile, 'utf-8');
    sql += calendarSeed + '\n';
} catch (e) {
    console.error("Error reading seed_calendar.sql:", e);
}

fs.writeFileSync(path.join(__dirname, 'init.sql'), sql);
console.log('SQL generated successfully.');
