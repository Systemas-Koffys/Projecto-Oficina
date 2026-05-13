-- Limpieza y actualización del historial de impresiones
USE dboficina;

-- Borrar tabla si existe para recrearla con la nueva estructura
DROP TABLE IF EXISTS historial_impresiones;

CREATE TABLE historial_impresiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_reporte VARCHAR(255) NOT NULL,
    id_solicitud INT NULL, -- Puede ser NULL si es un reporte consolidado (hoja de ruta)
    tipo_reporte VARCHAR(100), -- "Individual", "Hoja de Ruta", "Consolidado"
    usuario VARCHAR(100),
    fecha_impresion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filtros_aplicados TEXT NULL, -- Guardar los filtros usados como JSON o texto
    detalles TEXT NULL,
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE SET NULL
);

-- Truncar para asegurar que esté vacía
TRUNCATE TABLE historial_impresiones;
