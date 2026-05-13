-- Crear tabla de configuración si no existe
USE dboficina;

CREATE TABLE IF NOT EXISTS config_sistema (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT
);

-- Valores iniciales por defecto
INSERT IGNORE INTO config_sistema (clave, valor) VALUES ('nombre_entidad', 'Gobierno Autónomo Municipal de Tarija');
INSERT IGNORE INTO config_sistema (clave, valor) VALUES ('sigla_entidad', 'GAMT');
INSERT IGNORE INTO config_sistema (clave, valor) VALUES ('color_primario', '#1a4731');
