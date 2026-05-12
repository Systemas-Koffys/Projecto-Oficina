import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { exec } from 'child_process';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configuración de conexión flexible (Docker o Local)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dboficina',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Ruta de salud
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// RUTA CRITICA: Usuarios para el selector de login (Nombres completos con respaldo)
app.get('/api/usuarios/publico', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT nombre, username, role FROM usuarios');
    const processed = rows.map(u => ({
      nombre: u.nombre || u.username, // Si no hay nombre, usa el username
      role: u.role
    }));
    res.json(processed);
  } catch (error) {
    console.error('Error:', error);
    res.json([
      { nombre: 'Ing. Cimar Farfan', role: 'ADMIN' },
      { nombre: 'Tec. Kevin Flores', role: 'ROOT' }
    ]);
  }
});

// Catálogos (Lo que ya funcionaba)
app.get('/api/catalogos', async (req, res) => {
  try {
    const [tecnicos] = await pool.query('SELECT * FROM tecnicos');
    const [acciones] = await pool.query('SELECT * FROM acciones');
    const [especies] = await pool.query('SELECT * FROM especies');
    const [tipos_institucion] = await pool.query('SELECT * FROM tipos_institucion');
    const [instituciones] = await pool.query('SELECT * FROM instituciones');
    const [distritos] = await pool.query('SELECT * FROM distritos');
    const [barrios] = await pool.query('SELECT * FROM barrios');
    res.json({ tecnicos, acciones, especies, tipos_institucion, instituciones, distritos, barrios });
  } catch (error) {
    res.status(500).json({ error: 'Error en catálogos' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body; // 'username' ahora puede ser el nombre completo
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE (username = ? OR nombre = ?) AND password = ?', [username, username, password]);
    
    if (rows.length > 0) {
      const user = rows[0];
      delete user.password; // Por seguridad, no enviamos el password de vuelta
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// El resto de rutas de solicitudes (Mantenidas igual)
app.get('/api/solicitudes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM solicitudes');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error solicitudes' });
  }
});

// --- GESTIÓN DE USUARIOS (CRUD) ---

// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Crear un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  const { username, password, role, nombre, cargo, email, estado, foto } = req.body;
  console.log(`Creando nuevo usuario: ${username}`);
  
  try {
    const [result] = await pool.query(
      'INSERT INTO usuarios (username, password, role, nombre, cargo, email, estado, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, password, role, nombre, cargo, email, estado || 'Activo', foto || null]
    );
    console.log(`✅ Usuario creado con ID: ${result.insertId}`);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar un usuario
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role, nombre, cargo, email, estado, foto } = req.body;
  
  console.log(`Intentando actualizar usuario ID: ${id} (${username})`);
  
  try {
    const fields = ['username=?', 'role=?', 'nombre=?', 'cargo=?', 'email=?', 'estado=?', 'foto=?'];
    const params = [username, role, nombre, cargo, email, estado, foto || null];

    if (password && password.trim() !== '') {
      fields.push('password=?');
      params.push(password);
    }
    
    params.push(id);
    const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id=?`;

    await pool.query(query, params);
    console.log(`✅ Usuario ${id} actualizado con éxito`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar un usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// --- HISTORIAL DE IMPRESIONES ---

// Obtener historial
app.get('/api/impresiones', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, s.comunicacion_interna 
      FROM historial_impresiones h
      LEFT JOIN solicitudes s ON h.id_solicitud = s.id_solicitud
      ORDER BY h.fecha_impresion DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Registrar impresión
app.post('/api/impresiones', async (req, res) => {
  try {
    const { id_solicitud, tipo_reporte, usuario, detalles } = req.body;
    await pool.query(
      'INSERT INTO historial_impresiones (id_solicitud, tipo_reporte, usuario, detalles) VALUES (?, ?, ?, ?)',
      [id_solicitud || null, tipo_reporte, usuario, detalles || null]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error al registrar impresión:', error);
    res.status(500).json({ error: 'Error al registrar impresión' });
  }
});

// --- GESTIÓN DE CATÁLOGOS (DINÁMICO) ---
const TABLAS_PERMITIDAS = ['tecnicos', 'acciones', 'especies', 'tipos_institucion', 'instituciones', 'distritos', 'barrios'];

app.post('/api/catalogos/:tabla', async (req, res) => {
  const { tabla } = req.params;
  if (!TABLAS_PERMITIDAS.includes(tabla)) return res.status(400).json({ error: 'Tabla no permitida' });
  
  try {
    const fields = Object.keys(req.body).join(', ');
    const placeholders = Object.keys(req.body).map(() => '?').join(', ');
    const values = Object.values(req.body);
    
    const [result] = await pool.query(`INSERT INTO ${tabla} (${fields}) VALUES (${placeholders})`, values);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error(`Error al insertar en ${tabla}:`, error);
    res.status(500).json({ error: 'Error al insertar registro' });
  }
});

app.put('/api/catalogos/:tabla/:id', async (req, res) => {
  const { tabla, id } = req.params;
  const id_field = (tabla === 'barrios' || tabla === 'distritos') ? 'id' : 'id'; // Ajustar si alguna tabla usa otro nombre de ID
  
  if (!TABLAS_PERMITIDAS.includes(tabla)) return res.status(400).json({ error: 'Tabla no permitida' });

  try {
    const data = { ...req.body };
    delete data.id; // No permitimos actualizar el ID primario
    
    const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    await pool.query(`UPDATE ${tabla} SET ${sets} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error al actualizar ${tabla}:`, error);
    res.status(500).json({ error: 'Error al actualizar registro' });
  }
});

app.delete('/api/catalogos/:tabla/:id', async (req, res) => {
  const { tabla, id } = req.params;
  if (!TABLAS_PERMITIDAS.includes(tabla)) return res.status(400).json({ error: 'Tabla no permitida' });

  try {
    await pool.query(`DELETE FROM ${tabla} WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error al eliminar de ${tabla}:`, error);
    res.status(500).json({ error: 'Error al eliminar registro' });
  }
});

// --- CONFIGURACIÓN DEL SISTEMA ---
app.get('/api/config', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM config_sistema');
    // Convertir array de {clave, valor} a un solo objeto
    const config = {};
    rows.forEach(r => config[r.clave] = r.valor);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const configs = req.body; // Objeto { clave: valor, ... }
    for (const [clave, valor] of Object.entries(configs)) {
      await pool.query(
        'INSERT INTO config_sistema (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
        [clave, valor, valor]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

// --- RESPALDO DE BASE DE DATOS ---
app.get('/api/backup', (req, res) => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const pass = process.env.DB_PASSWORD || 'password';
  const db   = process.env.DB_NAME || 'dboficina';
  
  const fileName = `backup_oficina_${new Date().toISOString().split('T')[0]}.sql`;
  
  // Usamos docker exec para asegurarnos de que el comando funcione sin necesidad de MySQL local
  const cmd = `docker exec db_oficina mysqldump -u root -ppassword ${db}`;
  
  exec(cmd, { maxBuffer: 1024 * 1024 * 25 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error al generar backup:', error);
      return res.status(500).json({ error: 'Error al generar el respaldo' });
    }
    
    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/sql');
    res.send(stdout);
  });
});

app.listen(port, () => {
  console.log(`🚀 Servidor listo en puerto ${port}`);
});
