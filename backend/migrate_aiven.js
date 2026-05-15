import mysql from 'mysql2/promise';

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.AIVEN_HOST || 'mysql-2c0ee49c-projectooficina.h.aivencloud.com',
    port: process.env.AIVEN_PORT || 18175,
    user: process.env.AIVEN_USER || 'avnadmin',
    password: process.env.AIVEN_PASSWORD, // No dejar hardcoded
    database: process.env.AIVEN_DB || 'defaultdb',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Creando tabla calendario_barrios en Aiven...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendario_barrios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha_aniversario DATE NOT NULL,
        nombre_barrio VARCHAR(255) NOT NULL,
        presidente_barrio VARCHAR(255),
        telefono_presidente VARCHAR(50),
        color_etiqueta VARCHAR(50) DEFAULT '#4caf50'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabla creada con éxito.');

    console.log('Insertando 48 registros de prueba...');
    await pool.query(`
INSERT INTO calendario_barrios (fecha_aniversario, nombre_barrio, presidente_barrio, telefono_presidente, color_etiqueta) VALUES
('2026-05-02', 'San Roque', 'Juan Pérez', '71234567', '#e11d48'),
('2026-05-10', 'Fátima', 'María López', '78901234', '#2563eb'),
('2026-05-15', 'Senac', 'Carlos García', '76543210', '#16a34a'),
('2026-05-20', 'Juan XXIII', 'Ana Martínez', '75432109', '#d97706'),
('2026-05-25', 'Los Chapacos', 'Luis Rodríguez', '71122334', '#9333ea'),
('2026-05-30', 'El Carmen', 'Elena Gómez', '72233445', '#0891b2'),

('2026-06-03', 'Las Panosas', 'Roberto Díaz', '73344556', '#4f46e5'),
('2026-06-08', 'La Loma', 'Sofía Romero', '74455667', '#ea580c'),
('2026-06-12', 'Abaroa', 'Miguel Sánchez', '75566778', '#65a30d'),
('2026-06-18', 'Tabladita', 'Laura Torres', '76677889', '#0d9488'),
('2026-06-22', 'Lourdes', 'Pedro Flores', '77788990', '#c026d3'),
('2026-06-28', 'Morros Blancos', 'Carmen Ruiz', '78899001', '#be123c'),

('2026-07-04', 'Villa Avaroa', 'Jorge Vargas', '79900112', '#1d4ed8'),
('2026-07-09', 'Defensores del Chaco', 'Teresa Castro', '71011223', '#b45309'),
('2026-07-14', 'Palmarcito', 'Raúl Ortiz', '72122334', '#15803d'),
('2026-07-20', 'Luis Pizarro', 'Patricia Silva', '73233445', '#a21caf'),
('2026-07-25', 'El Constructor', 'Mario Reyes', '74344556', '#be185d'),
('2026-07-31', 'Simón Bolívar', 'Rosa Méndez', '75455667', '#0369a1'),

('2026-08-05', 'San José', 'Hugo Navarro', '76566778', '#4338ca'),
('2026-08-10', 'Central', 'Silvia Ríos', '77677889', '#c2410c'),
('2026-08-16', 'Guadalquivir', 'Andrés Mendoza', '78788990', '#4d7c0f'),
('2026-08-21', 'Aranjuez', 'Gloria Morales', '79899001', '#0f766e'),
('2026-08-26', 'Méndez Arcos', 'Ricardo Vega', '71900112', '#a21caf'),
('2026-08-30', 'San Bernardo', 'Lucía Herrera', '72011223', '#9f1239'),

('2026-09-02', 'Los Olivos', 'Esteban Aguilar', '73122334', '#1e40af'),
('2026-09-07', 'San Martín', 'Victoria Peña', '74233445', '#b45309'),
('2026-09-13', 'San Jerónimo', 'Fernando Cruz', '75344556', '#166534'),
('2026-09-18', 'San Luis', 'Isabel Delgado', '76455667', '#86198f'),
('2026-09-24', 'Aeropuerto', 'Gabriel Cárdenas', '77566778', '#9d174d'),
('2026-09-29', 'Miraflores', 'Mónica Salazar', '78677889', '#075985'),

('2026-10-04', 'San Mateo', 'Héctor Cabrera', '79788990', '#3730a3'),
('2026-10-09', 'La Florida', 'Alicia Valdés', '71899001', '#9a3412'),
('2026-10-15', 'San Blas', 'Francisco Medina', '72900112', '#3f6212'),
('2026-10-20', 'Eulogio Ruiz', 'Daniela Ríos', '73011223', '#115e59'),
('2026-10-25', 'Mendietas', 'Arturo Gil', '74122334', '#701a75'),
('2026-10-31', 'Pedro Antonio Flores', 'Sonia León', '75233445', '#881337'),

('2026-11-05', 'Villa Fátima', 'Víctor Ponce', '76344556', '#1e3a8a'),
('2026-11-10', '15 de Abril', 'Natalia Moya', '77455667', '#7c2d12'),
('2026-11-16', 'Barrio Nuevo', 'Rodrigo Blanco', '78566778', '#14532d'),
('2026-11-21', 'Luis Espinal', 'Valeria Soto', '79677889', '#581c87'),
('2026-11-26', 'Rosedal', 'Guillermo Pacheco', '71788990', '#831843'),
('2026-11-30', 'Moyatas', 'Carolina Paz', '72899001', '#0c4a6e'),

('2026-12-04', 'Villa Busch', 'Julio Paredes', '73900112', '#312e81'),
('2026-12-09', 'El Trigal', 'Teresa Rojas', '74011223', '#78350f'),
('2026-12-14', 'Las Rosas', 'Martín Suárez', '75122334', '#064e3b'),
('2026-12-20', 'La Pampa', 'Diana Muñoz', '76233445', '#4c1d95'),
('2026-12-25', 'El Molino', 'Felipe Ortiz', '77344556', '#9f1239'),
('2026-12-30', '1 de Mayo', 'Renata Domínguez', '78455667', '#082f49');
    `);
    console.log('Registros insertados con éxito.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('Los registros ya existen.');
    } else {
      console.error('Error durante la migración en Aiven:', err);
    }
  } finally {
    await pool.end();
  }
}

migrate();
