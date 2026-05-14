import mysql from 'mysql2/promise';

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'dboficina',
    port: 3306,
  });

  try {
    console.log('Creating calendario_barrios table...');
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
    console.log('Table created successfully.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await pool.end();
  }
}

migrate();
