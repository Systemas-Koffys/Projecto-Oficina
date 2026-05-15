import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { exec } from 'child_process';

const app = express();
const port = 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuración de conexión flexible (Docker o Local)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dboficina',
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  },
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

// SEMBRADO DE DATOS (PARA PRUEBAS)
app.get('/api/dev/seed', async (req, res) => {
  try {
    // ASEGURAR QUE LAS COLUMNAS EXISTAN (Por si la migración no se corrió)
    try {
      await pool.query('ALTER TABLE solicitudes ADD COLUMN lat DECIMAL(10,8)');
      await pool.query('ALTER TABLE solicitudes ADD COLUMN lng DECIMAL(11,8)');
      console.log("Columnas lat/lng añadidas.");
    } catch (e) {
      console.log("Las columnas ya existen o hubo un error menor.");
    }
    const barrios = [1, 2, 3, 4, 5, 6, 7, 8];
    const acciones = [1, 2, 3, 4, 5];
    const tecnicos = [1, 2, 3, 4];
    const estados = ['Ejecutado', 'En espera', 'En proceso'];
    const urgencias = ['Baja', 'Media', 'Alta'];
    const solicitantes = ['Maria Delgado', 'Jose Luis Choque', 'Ana Maria Vaca', 'Carlos Mendez', 'Lucia Sirpa', 'Roberto Zenteno', 'Elena Flores', 'Pedro Armella'];
    
    console.log("Sembrando 100 registros...");
    
    for (let i = 0; i < 100; i++) {
        const id_barrio = barrios[Math.floor(Math.random() * barrios.length)];
        const id_accion = acciones[Math.floor(Math.random() * acciones.length)];
        const id_tec = tecnicos[Math.floor(Math.random() * tecnicos.length)];
        const estado = estados[Math.floor(Math.random() * estados.length)];
        const urgencia = (Math.random() > 0.8) ? 'Alta' : urgencias[Math.floor(Math.random() * urgencias.length)];
        const es_emergencia = (urgencia === 'Alta' && Math.random() > 0.5) ? 1 : 0;
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 120));
        const fecha_ingreso = fecha.toISOString().split('T')[0];
        let fecha_ejecucion = null;
        if (estado === 'Ejecutado') {
            const fechaE = new Date(fecha);
            fechaE.setDate(fechaE.getDate() + Math.floor(Math.random() * 15));
            fecha_ejecucion = fechaE.toISOString().split('T')[0];
        }
        const lat = -21.535 + (Math.random() - 0.5) * 0.05;
        const lng = -64.732 + (Math.random() - 0.5) * 0.05;

        const sql = `INSERT INTO solicitudes 
            (comunicacion_interna, fecha_ingreso, solicitante_nombre, solicitante_telefono, calle, id_barrio, id_accion_solicitada, nivel_urgencia, es_emergencia, estado_tramite, id_tecnico_ejecucion, fecha_ejecucion, lat, lng, solicitante_descripcion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        await pool.query(sql, [
            `CI-${200 + i}`, fecha_ingreso,
            solicitantes[Math.floor(Math.random() * solicitantes.length)],
            '7' + Math.floor(1000000 + Math.random() * 9000000),
            'Calle ' + (Math.floor(Math.random() * 100) + 1),
            id_barrio, id_accion, urgencia, es_emergencia, estado,
            estado === 'Ejecutado' ? id_tec : null, fecha_ejecucion,
            lat, lng, 'Carga de prueba masiva para Dashboard'
        ]);
    }
    res.json({ success: true, message: '100 registros sembrados correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTA CRITICA: Usuarios para el selector de login
app.get('/api/usuarios/publico', async (req, res) => {
  console.log('--- Nueva petición a /api/usuarios/publico ---');
  try {
    console.log('Ejecutando query en la base de datos...');
    const [rows] = await pool.query('SELECT nombre, username, role FROM usuarios');
    console.log(`Query exitosa. Se encontraron ${rows.length} usuarios.`);
    
    const processed = rows.map(u => ({
      nombre: u.nombre || u.username,
      role: u.role
    }));
    res.json(processed);
  } catch (error) {
    console.error('❌ ERROR DETALLADO EN /api/usuarios/publico:', error);
    res.status(500).json({ error: 'Error al cargar personal', detail: error.message });
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

// --- GESTIÓN DE SOLICITUDES ---

app.get('/api/solicitudes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM solicitudes ORDER BY fecha_ingreso DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

app.post('/api/solicitudes', async (req, res) => {
  try {
    const data = req.body;
    
    // Lista de columnas permitidas en la tabla 'solicitudes'
    const allowedColumns = [
      'fecha_ingreso', 'fecha_verificacion', 'comunicacion_interna', 'id_barrio',
      'id_nombre_institucional', 'id_accion', 'id_especie', 'calle', 'numero_casa',
      'referencia', 'solicitante_nombre', 'solicitante_telefono', 'solicitante_descripcion',
      'lo_solicitado', 'id_accion_solicitada', 'id_tecnico_verificacion', 'requiere_plataforma',
      'requiere_setar', 'requiere_ficha_tecnica', 'procede', 'cantidad_notas',
      'arbol_seco', 'es_emergencia', 'segunda_nota', 'es_urgencia', 'nivel_urgencia',
      'observacion_verificacion', 'id_tecnico_ejecucion', 'fecha_ejecucion',
      'observaciones_finales', 'estado_tramite', 'id_tipo_institucion', 'lat', 'lng'
    ];

    const filteredData = {};
    const dateColumns = ['fecha_ingreso', 'fecha_verificacion', 'fecha_ejecucion'];
    
    allowedColumns.forEach(col => {
      if (data[col] !== undefined) {
        // Si es una columna de fecha y viene vacía, enviamos NULL para evitar errores de MySQL
        if (dateColumns.includes(col) && data[col] === '') {
          filteredData[col] = null;
        } else {
          filteredData[col] = data[col];
        }
      }
    });

    console.log('Insertando nueva solicitud:', filteredData.comunicacion_interna);
    
    const fields = Object.keys(filteredData).join(', ');
    const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
    const values = Object.values(filteredData);
    
    const query = `INSERT INTO solicitudes (${fields}) VALUES (${placeholders})`;
    const [result] = await pool.query(query, values);
    
    res.json({ success: true, id_solicitud: result.insertId });
  } catch (error) {
    console.error('Error al insertar solicitud:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = req.body;
    const allowedColumns = [
      'fecha_ingreso', 'fecha_verificacion', 'comunicacion_interna', 'id_barrio',
      'id_nombre_institucional', 'id_accion', 'id_especie', 'calle', 'numero_casa',
      'referencia', 'solicitante_nombre', 'solicitante_telefono', 'solicitante_descripcion',
      'lo_solicitado', 'id_accion_solicitada', 'id_tecnico_verificacion', 'requiere_plataforma',
      'requiere_setar', 'requiere_ficha_tecnica', 'procede', 'cantidad_notas',
      'arbol_seco', 'es_emergencia', 'segunda_nota', 'es_urgencia', 'nivel_urgencia',
      'observacion_verificacion', 'id_tecnico_ejecucion', 'fecha_ejecucion',
      'observaciones_finales', 'estado_tramite', 'id_tipo_institucion', 'lat', 'lng'
    ];

    const filteredData = {};
    const dateColumns = ['fecha_ingreso', 'fecha_verificacion', 'fecha_ejecucion'];

    allowedColumns.forEach(col => {
      if (data[col] !== undefined) {
        // Si es una columna de fecha y viene vacía, enviamos NULL para evitar errores de MySQL
        if (dateColumns.includes(col) && data[col] === '') {
          filteredData[col] = null;
        } else {
          filteredData[col] = data[col];
        }
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.json({ success: true, message: 'Nada que actualizar' });
    }

    const sets = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(filteredData), id];
    
    const query = `UPDATE solicitudes SET ${sets} WHERE id_solicitud = ?`;
    await pool.query(query, values);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar solicitud:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM solicitudes WHERE id_solicitud = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar solicitud:', error);
    res.status(500).json({ error: 'Error al eliminar solicitud' });
  }
});

// --- GESTIÓN DE USUARIOS (CRUD) ---

// Obtener todos los usuarios (sin la foto para no saturar)
app.get('/api/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener la foto de un usuario específico (bajo demanda)
app.get('/api/usuarios/:id/foto', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT foto FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length > 0) res.json({ foto: rows[0].foto });
    else res.status(404).json({ error: 'No encontrado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// --- HISTORIAL DE IMPRESIONES (Reportes Inmutables) ---

// Obtener historial completo
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

// Registrar nueva impresión (Generación de Reporte)
app.post('/api/impresiones', async (req, res) => {
  try {
    const { nombre_reporte, id_solicitud, tipo_reporte, usuario, filtros_aplicados, detalles } = req.body;
    
    // Si no viene nombre, generamos uno por defecto
    const finalName = nombre_reporte || `${tipo_reporte} - ${new Date().toLocaleDateString()}`;

    const [result] = await pool.query(
      'INSERT INTO historial_impresiones (nombre_reporte, id_solicitud, tipo_reporte, usuario, filtros_aplicados, detalles) VALUES (?, ?, ?, ?, ?, ?)',
      [finalName, id_solicitud || null, tipo_reporte, usuario, filtros_aplicados || null, detalles || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error al registrar impresión:', error);
    res.status(500).json({ error: 'Error al registrar impresión' });
  }
});

// Actualizar solo el nombre del reporte (Única edición permitida)
app.put('/api/impresiones/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_reporte } = req.body;
  try {
    await pool.query('UPDATE historial_impresiones SET nombre_reporte = ? WHERE id = ?', [nombre_reporte, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar nombre del reporte:', error);
    res.status(500).json({ error: 'Error al actualizar nombre del reporte' });
  }
});

// Eliminar registro del historial
app.delete('/api/impresiones/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM historial_impresiones WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar registro de historial:', error);
    res.status(500).json({ error: 'Error al eliminar registro de historial' });
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
// --- RUTAS CALENDARIO FESTIVO ---
app.get('/api/calendario', async (req, res) => {
  try {
    const query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM solicitudes s 
              JOIN barrios b ON s.id_barrio = b.id 
              WHERE b.nombre = c.nombre_barrio) AS solicitudes_count
      FROM calendario_barrios c
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener calendario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/calendario', async (req, res) => {
  try {
    const { fecha_aniversario, nombre_barrio, presidente_barrio, telefono_presidente, color_etiqueta } = req.body;
    const [result] = await pool.query(
      'INSERT INTO calendario_barrios (fecha_aniversario, nombre_barrio, presidente_barrio, telefono_presidente, color_etiqueta) VALUES (?, ?, ?, ?, ?)',
      [fecha_aniversario, nombre_barrio, presidente_barrio, telefono_presidente, color_etiqueta]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Error al guardar evento de calendario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/calendario/:id', async (req, res) => {
  try {
    const { fecha_aniversario, nombre_barrio, presidente_barrio, telefono_presidente, color_etiqueta } = req.body;
    await pool.query(
      'UPDATE calendario_barrios SET fecha_aniversario=?, nombre_barrio=?, presidente_barrio=?, telefono_presidente=?, color_etiqueta=? WHERE id=?',
      [fecha_aniversario, nombre_barrio, presidente_barrio, telefono_presidente, color_etiqueta, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

app.delete('/api/calendario/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM calendario_barrios WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

const finalPort = process.env.PORT || port;
app.listen(finalPort, '0.0.0.0', () => {
  console.log(`🚀 Servidor listo en puerto ${finalPort}`);
});
