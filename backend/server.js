import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { exec } from 'child_process';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_oficina_2026';

// Middleware de Autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  // Si no está en cabeceras, buscar en los parámetros query de la URL (para descargas directas)
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (!token) return res.status(401).json({ error: 'Acceso denegado: Token requerido' });
  
  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ error: 'Acceso denegado: Token inválido o expirado' });
    
    try {
      const [rows] = await pool.query('SELECT estado FROM personal WHERE id_personal = ?', [user.id]);
      if (rows.length === 0 || rows[0].estado !== 'Activo') {
        return res.status(401).json({ error: 'Tu cuenta ha sido suspendida.' });
      }
    } catch (dbErr) {
      console.error('Error validando estado del usuario:', dbErr);
    }

    req.user = user;
    next();
  });
};

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Aplicar middleware de autenticación a todas las rutas de /api excepto públicas
app.use('/api', (req, res, next) => {
  const publicRoutes = ['/login', '/usuarios/publico', '/health', '/dev/seed'];
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  // Permitir GET /config públicamente para mostrar logotipos en el login
  if (req.path === '/config' && req.method === 'GET') {
    return next();
  }
  return authenticateToken(req, res, next);
});

// Configuración de conexión flexible (Docker o Local)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dboficina',
  port: process.env.DB_PORT || 3306,
  charset: 'UTF8MB4_UNICODE_CI',
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Forzar charset utf8mb4 en cada conexión nueva para compatibilidad con ENUMs acentuados
pool.on('connection', (connection) => {
  connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
});


// Helper de Auditoría Inmutable
function sanitizeAuditDetails(obj) {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeAuditDetails(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = `[DATOS_LARGOS: ${value.substring(0, 30)}... (longitud: ${value.length})]`;
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeAuditDetails(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

async function registrarAuditoria(req, accion, tablaAfectada, registroId, detalles) {
  try {
    const usuario = req.user?.username || req.user?.nombre || 'SISTEMA';
    const role = req.user?.role || 'SISTEMA';
    
    const sanitized = sanitizeAuditDetails(detalles);
    const cleanDetalles = sanitized ? (typeof sanitized === 'object' ? JSON.stringify(sanitized) : String(sanitized)) : null;

    const query = 'INSERT INTO auditoria_actividad (usuario, role, accion, tabla_afectada, registro_id, detalles) VALUES (?, ?, ?, ?, ?, ?)';
    await pool.query(query, [usuario, role, accion, tablaAfectada, registroId, cleanDetalles]);
    console.log(`[AUDITORÍA] Registro insertado con éxito: ${usuario} -> ${accion} en ${tablaAfectada}`);
  } catch (error) {
    console.error('❌ ERROR AL GUARDAR REGISTRO DE AUDITORÍA:', error);
  }
}

// Helper para formatear fechas a YYYY-MM-DD para MySQL
function formatDbDate(val) {
  if (!val) return null;
  try {
    const strVal = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
      return strVal;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

// Ruta de salud
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Ruta para inicializar y sembrar la base de datos (Útil para entornos como Render/Aiven)
app.get('/api/dev/seed', async (req, res) => {
  console.log('--- Nueva petición a /api/dev/seed ---');
  
  // Validación de seguridad para inicialización de base de datos
  const seedToken = req.query.token || req.headers['x-seed-token'];
  const expectedToken = process.env.SEED_SECRET || 'secret_seed_token_2026';
  
  if (seedToken !== expectedToken) {
    console.warn('⚠️ Intento de sembrado no autorizado.');
    return res.status(403).json({ error: 'No autorizado: Token de sembrado inválido' });
  }
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const initSqlPath = path.resolve(__dirname, 'init.sql');

    if (!fs.existsSync(initSqlPath)) {
      console.error(`❌ init.sql no encontrado en: ${initSqlPath}`);
      return res.status(404).json({ error: 'Archivo init.sql no encontrado' });
    }

    const sqlContent = fs.readFileSync(initSqlPath, 'utf8');
    
    // Separar las sentencias SQL limpiando espacios y comentarios vacíos
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        if (!stmt) return false;
        
        // Quitar comentarios SQL que comienzan con '--' o '/*'
        const cleanStmt = stmt
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
          
        if (!cleanStmt) return false;

        const upper = cleanStmt.toUpperCase();
        // Omitir comandos de creación y selección de base de datos
        if (
          upper.startsWith('CREATE DATABASE') || 
          upper.startsWith('DROP DATABASE') || 
          upper.startsWith('USE ')
        ) {
          return false;
        }
        return true;
      });

    console.log(`Iniciando ejecución de ${statements.length} sentencias SQL...`);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          await connection.query(stmt);
        } catch (queryErr) {
          console.error(`❌ Error en sentencia ${i + 1}/${statements.length}:`, queryErr.message);
          console.error('Sentencia fallida:', stmt);
          await connection.rollback();
          throw new Error(`Sentencia ${i + 1} falló: ${queryErr.message}`);
        }
      }
      
      await connection.commit();
      console.log('✅ Base de datos inicializada y sembrada con éxito.');
      res.json({ success: true, message: 'Base de datos sembrada e inicializada con éxito' });
    } catch (dbErr) {
      res.status(500).json({ error: 'Error al sembrar la base de datos', detail: dbErr.message });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error general en /api/dev/seed:', error);
    res.status(500).json({ error: 'Error interno del servidor', detail: error.message });
  }
});

// RUTA CRITICA: Usuarios para el selector de login
app.get('/api/usuarios/publico', async (req, res) => {
  console.log('--- Nueva petición a /api/usuarios/publico ---');
  try {
    console.log('Ejecutando query en la base de datos...');
    const [rows] = await pool.query('SELECT nombre_completo, usuario, role, cargo, foto FROM personal WHERE usuario IS NOT NULL');
    console.log(`Query exitosa. Se encontraron ${rows.length} usuarios.`);
    
    const processed = rows.map(u => ({
      nombre: u.nombre_completo || u.usuario,
      username: u.usuario,
      role: u.role,
      cargo: u.cargo,
      foto: u.foto
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
    const [tecnicos] = await pool.query('SELECT id_personal AS id, nombre_completo AS nombre, cedula_id, cargo, contacto AS celular, contrato AS tipo_contrato, usuario AS username, role, email, estado, fecha_ingreso, fecha_nacimiento, tipo_sangre, contacto_emergencia, celular_emergencia, foto, id_equipo, rol_equipo FROM personal');
    const [acciones] = await pool.query('SELECT id_accion AS id, nombre_accion AS nombre, descripcion FROM acciones_catalogo');
    const [especies] = await pool.query('SELECT id_especie AS id, nombre_comun AS nombre, nombre_cientifico FROM especies_arboles');
    const [tipos_institucion] = await pool.query('SELECT id_tipo_solicitante AS id, nombre_tipo AS nombre FROM tipos_solicitantes');
    const [instituciones] = await pool.query('SELECT id_institucion AS id, id_tipo_solicitante AS id_tipo, nombre_institucion AS nombre, id_distrito FROM instituciones');
    const [distritos] = await pool.query('SELECT id_distrito AS id, numero_distrito AS nombre FROM distritos');
    const [barrios] = await pool.query('SELECT id_barrio AS id, nombre_barrio AS nombre, id_distrito FROM barrios');
    res.json({ tecnicos, acciones, especies, tipos_institucion, instituciones, distritos, barrios });
  } catch (error) {
    console.error('❌ ERROR EN CATÁLOGOS:', error);
    res.status(500).json({ error: 'Error en catálogos', detail: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body; 
  try {
    const [rows] = await pool.query('SELECT * FROM personal WHERE usuario = ? OR nombre_completo = ?', [username, username]);
    
    if (rows.length > 0) {
      const user = rows[0];
      let passwordMatch = false;

      // Migración silenciosa de Bcrypt: Si no está encriptada, la verificamos y la encriptamos
      if (user.contrasena && !user.contrasena.startsWith('$2b$')) {
        if (user.contrasena === password) {
            passwordMatch = true;
            // Encriptamos la contraseña para futuros logins
            const hashed = await bcrypt.hash(password, 10);
            await pool.query('UPDATE personal SET contrasena = ? WHERE id_personal = ?', [hashed, user.id_personal]);
        }
      } else {
        // Validación normal con Bcrypt
        passwordMatch = await bcrypt.compare(password, user.contrasena);
      }
      
      if (passwordMatch) {
          if (user.estado !== 'Activo') {
              return res.status(403).json({ success: false, error: 'Su cuenta ha sido suspendida por el administrador.' });
          }

          // Mapear campos para compatibilidad con el frontend
          user.id = user.id_personal;
          user.nombre = user.nombre_completo;
          user.username = user.usuario;
          
          delete user.contrasena;
          
          // Generar Token JWT
          const token = jwt.sign({ id: user.id_personal, username: user.usuario, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
          
          res.json({ success: true, user, token });
      } else {
          res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
      }
    } else {
      res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// --- GESTIÓN DE SOLICITUDES (NORMALIZADA EN 3 TABLAS) ---

// --- GESTIÓN DE SOLICITUDES (NORMALIZADA EN MAESTRO-DETALLE v3) ---

app.get('/api/solicitudes', async (req, res) => {
  try {
    const query = `
      SELECT 
        id_solicitud,
        codigo_anual,
        fecha_ingreso,
        comunicacion_interna,
        id_tipo_solicitante AS id_tipo_institucion,
        id_institucion AS id_nombre_institucional,
        nombre_solicitante AS solicitante_nombre,
        telefono_solicitante AS solicitante_telefono,
        nota_solicitud_sucia AS solicitante_descripcion,
        id_distrito,
        id_barrio,
        calle,
        numero_casa,
        referencia_casa AS referencia,
        ubicacion_gps,
        fecha_inspeccion AS fecha_verificacion,
        id_tecnico_verificador AS id_tecnico_verificacion,
        esta_verificado,
        requiere_plataforma,
        requiere_ficha_tecnica,
        procede_solicitud AS procede,
        es_arbol_seco AS arbol_seco,
        es_emergencia,
        urgencia AS nivel_urgencia,
        estado_general AS estado_tramite,
        fecha_execution AS fecha_ejecucion,
        fecha_programada,
        id_tecnico_ejecucion,
        observacion_ejecucion AS observaciones_finales,
        observacion_verificacion,
        trabajos_extra
      FROM solicitudes_poda
      ORDER BY fecha_ingreso DESC
    `;
    const [rows] = await pool.query(query);
    
    // Obtener detalles de árboles para todas las solicitudes
    const [trees] = await pool.query('SELECT * FROM detalle_arboles');
    
    const treesBySol = {};
    trees.forEach(t => {
      if (!treesBySol[t.id_solicitud]) {
        treesBySol[t.id_solicitud] = [];
      }
      treesBySol[t.id_solicitud].push({
        id_arbol: t.id_arbol,
        id_especie: t.id_especie,
        id_accion_solicitada: t.id_accion_solicitada,
        id_accion_realizar: t.id_accion_realizar,
        observaciones_arbol: t.observaciones_arbol,
        url_foto: t.url_foto
      });
    });
    
    // Mapear campos para compatibilidad y parsear booleanos
    const processed = rows.map(r => {
      r.requiere_plataforma = !!r.requiere_plataforma;
      r.requiere_ficha_tecnica = !!r.requiere_ficha_tecnica;
      r.procede = !!r.procede;
      r.arbol_seco = !!r.arbol_seco;
      r.es_emergencia = !!r.es_emergencia;
      
      // Parsear ubicación GPS para lat y lng
      r.lat = null;
      r.lng = null;
      if (r.ubicacion_gps) {
        const parts = r.ubicacion_gps.split(',');
        if (parts.length === 2) {
          const parsedLat = parseFloat(parts[0].trim());
          const parsedLng = parseFloat(parts[1].trim());
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            r.lat = parsedLat;
            r.lng = parsedLng;
          }
        }
      }
      
      // Para compatibilidad hacia atrás en la vista (mostrar primera especie y acción si existe)
      const list = treesBySol[r.id_solicitud] || [];
      r.arboles = list;
      
      if (list.length > 0) {
        r.id_especie = list[0].id_especie;
        r.id_accion_solicitada = list[0].id_accion_solicitada;
        r.id_accion = list[0].id_accion_realizar;
        r.observacion_verificacion = r.observacion_verificacion || list[0].observaciones_arbol;
      } else {
        r.id_especie = null;
        r.id_accion_solicitada = null;
        r.id_accion = null;
        r.observacion_verificacion = r.observacion_verificacion || null;
      }
      
      return r;
    });
    
    res.json(processed);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

app.post('/api/solicitudes', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const data = req.body;

    // Validar unicidad de codigo de comunicacion interna
    if (data.comunicacion_interna && data.comunicacion_interna.trim() !== '') {
      const [existing] = await connection.query(
        'SELECT codigo_anual FROM solicitudes_poda WHERE LOWER(TRIM(comunicacion_interna)) = LOWER(TRIM(?))',
        [data.comunicacion_interna]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, error: `El código de comunicación interna ya existe en la solicitud ${existing[0].codigo_anual}` });
      }
    }
    
    // Autocompletar distrito si falta
    let id_distrito = data.id_distrito;
    if (!id_distrito && data.id_barrio) {
      const [barrioRow] = await connection.query('SELECT id_distrito FROM barrios WHERE id_barrio = ?', [data.id_barrio]);
      if (barrioRow.length > 0) {
        id_distrito = barrioRow[0].id_distrito;
      }
    }
    
    // Generar código anual secuencial (formato: 001/26)
    const currentYear = new Date().getFullYear();
    const yearSuffix = String(currentYear).slice(-2);
    const [countResult] = await connection.query('SELECT COUNT(*) AS total FROM solicitudes_poda WHERE YEAR(fecha_ingreso) = ?', [currentYear]);
    const nextNum = (countResult[0]?.total || 0) + 1;
    const codigo_anual = `${String(nextNum).padStart(3, '0')}/${yearSuffix}`;

    const latVal = (data.lat !== undefined && data.lat !== null && data.lat !== '') ? String(data.lat).trim() : null;
    const lngVal = (data.lng !== undefined && data.lng !== null && data.lng !== '') ? String(data.lng).trim() : null;
    const gps = (latVal && lngVal) ? `${latVal}, ${lngVal}` : null;

    const solData = {
      codigo_anual,
      fecha_ingreso: formatDbDate(data.fecha_ingreso) || new Date().toISOString().split('T')[0],
      comunicacion_interna: data.comunicacion_interna || null,
      id_tipo_solicitante: data.id_tipo_institucion || null,
      id_institucion: data.id_nombre_institucional || null,
      nombre_solicitante: data.solicitante_nombre || '',
      telefono_solicitante: data.solicitante_telefono || null,
      nota_solicitud_sucia: data.solicitante_descripcion || null,
      id_distrito: id_distrito || null,
      id_barrio: data.id_barrio || null,
      calle: data.calle || null,
      numero_casa: data.numero_casa || null,
      referencia_casa: data.referencia || null,
      ubicacion_gps: gps,
      fecha_inspeccion: formatDbDate(data.fecha_verificacion) || null,
      id_tecnico_verificador: data.id_tecnico_verificacion || null,
      esta_verificado: data.fecha_verificacion ? 'Sí' : 'No',
      observacion_verificacion: data.observacion_verificacion || null,
      requiere_plataforma: data.requiere_plataforma ? 1 : 0,
      requiere_ficha_tecnica: data.requiere_ficha_tecnica ? 1 : 0,
      procede_solicitud: data.procede ? 1 : 0,
      es_arbol_seco: data.arbol_seco ? 1 : 0,
      es_emergencia: data.es_emergencia ? 1 : 0,
      urgencia: data.nivel_urgencia || 'Media',
      estado_general: data.estado_tramite || 'En espera',
      fecha_execution: formatDbDate(data.fecha_ejecucion) || null,
      fecha_programada: formatDbDate(data.fecha_programada) || null,
      id_tecnico_ejecucion: data.id_tecnico_ejecucion || null,
      observacion_ejecucion: data.observaciones_finales || null,
      trabajos_extra: data.trabajos_extra || 'Ninguno'
    };

    const [resultSol] = await connection.query('INSERT INTO solicitudes_poda SET ?', solData);
    const id_solicitud = resultSol.insertId;

    // Procesar array de árboles
    let arbolesList = data.arboles || [];
    if (arbolesList.length === 0 && (data.id_especie || data.id_accion_solicitada)) {
      arbolesList.push({
        id_especie: data.id_especie || null,
        id_accion_solicitada: data.id_accion_solicitada || null,
        id_accion_realizar: data.id_accion || null,
        observaciones_arbol: data.observacion_verificacion || '',
        url_foto: data.url_foto || ''
      });
    }

    for (let arb of arbolesList) {
      await connection.query('INSERT INTO detalle_arboles SET ?', {
        id_solicitud,
        id_especie: arb.id_especie || null,
        id_accion_solicitada: arb.id_accion_solicitada || null,
        id_accion_realizar: arb.id_accion_realizar || null,
        observaciones_arbol: arb.observaciones_arbol || null,
        url_foto: arb.url_foto || null
      });
    }

    await connection.commit();
    await registrarAuditoria(req, 'CREAR', 'solicitudes_poda', id_solicitud, { codigo_anual: solData.codigo_anual, solicitante: solData.nombre_solicitante });
    res.json({ success: true, id_solicitud });
  } catch (error) {
    await connection.rollback();
    console.error('Error al insertar solicitud:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

app.put('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const data = req.body;

    // Validar unicidad de codigo de comunicacion interna
    if (data.comunicacion_interna && data.comunicacion_interna.trim() !== '') {
      const [existing] = await connection.query(
        'SELECT codigo_anual FROM solicitudes_poda WHERE LOWER(TRIM(comunicacion_interna)) = LOWER(TRIM(?)) AND id_solicitud != ?',
        [data.comunicacion_interna, id]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, error: `El código de comunicación interna ya existe en la solicitud ${existing[0].codigo_anual}` });
      }
    }

    let id_distrito = data.id_distrito;
    if (!id_distrito && data.id_barrio) {
      const [barrioRow] = await connection.query('SELECT id_distrito FROM barrios WHERE id_barrio = ?', [data.id_barrio]);
      if (barrioRow.length > 0) {
        id_distrito = barrioRow[0].id_distrito;
      }
    }

    const solData = {
      fecha_ingreso: formatDbDate(data.fecha_ingreso),
      comunicacion_interna: data.comunicacion_interna || null,
      id_tipo_solicitante: data.id_tipo_institucion || null,
      id_institucion: data.id_nombre_institucional || null,
      nombre_solicitante: data.solicitante_nombre,
      telefono_solicitante: data.solicitante_telefono || null,
      nota_solicitud_sucia: data.solicitante_descripcion || null,
      id_distrito: id_distrito || null,
      id_barrio: data.id_barrio || null,
      calle: data.calle || null,
      numero_casa: data.numero_casa || null,
      referencia_casa: data.referencia || null,
      fecha_inspeccion: formatDbDate(data.fecha_verificacion) || null,
      id_tecnico_verificador: data.id_tecnico_verificacion || null,
      esta_verificado: data.fecha_verificacion ? 'Sí' : 'No',
      observacion_verificacion: data.observacion_verificacion || null,
      requiere_plataforma: data.requiere_plataforma ? 1 : 0,
      requiere_ficha_tecnica: data.requiere_ficha_tecnica ? 1 : 0,
      procede_solicitud: data.procede ? 1 : 0,
      es_arbol_seco: data.arbol_seco ? 1 : 0,
      es_emergencia: data.es_emergencia ? 1 : 0,
      urgencia: data.nivel_urgencia || 'Media',
      estado_general: data.estado_tramite || 'En espera',
      fecha_execution: formatDbDate(data.fecha_ejecucion) || null,
      fecha_programada: formatDbDate(data.fecha_programada) || null,
      id_tecnico_ejecucion: data.id_tecnico_ejecucion || null,
      observacion_ejecucion: data.observaciones_finales || null,
      trabajos_extra: data.trabajos_extra || 'Ninguno'
    };

    const latVal = (data.lat !== undefined && data.lat !== null && data.lat !== '') ? String(data.lat).trim() : null;
    const lngVal = (data.lng !== undefined && data.lng !== null && data.lng !== '') ? String(data.lng).trim() : null;
    solData.ubicacion_gps = (latVal && lngVal) ? `${latVal}, ${lngVal}` : null;

    await connection.query('UPDATE solicitudes_poda SET ? WHERE id_solicitud = ?', [solData, id]);

    // Actualizar lista de árboles (eliminar viejos e insertar los nuevos)
    if (data.arboles) {
      await connection.query('DELETE FROM detalle_arboles WHERE id_solicitud = ?', [id]);
      for (let arb of data.arboles) {
        await connection.query('INSERT INTO detalle_arboles SET ?', {
          id_solicitud: id,
          id_especie: arb.id_especie || null,
          id_accion_solicitada: arb.id_accion_solicitada || null,
          id_accion_realizar: arb.id_accion_realizar || null,
          observaciones_arbol: arb.observaciones_arbol || null,
          url_foto: arb.url_foto || null
        });
      }
    }

    await connection.commit();
    await registrarAuditoria(req, 'MODIFICAR', 'solicitudes_poda', id, { estado_tramite: solData.estado_general, solicitante: solData.nombre_solicitante });
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar solicitud:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM solicitudes_poda WHERE id_solicitud = ?', [id]);
    await registrarAuditoria(req, 'ELIMINAR', 'solicitudes_poda', id, { id_solicitud: id });
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
    const [rows] = await pool.query('SELECT id_personal AS id, nombre_completo AS nombre, usuario AS username, role, cargo, email, estado, foto FROM personal WHERE usuario IS NOT NULL AND usuario != ""');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener la foto de un usuario específico (bajo demanda)
app.get('/api/usuarios/:id/foto', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT foto FROM personal WHERE id_personal = ?', [req.params.id]);
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
    if (role === 'ROOT') {
        return res.status(403).json({ success: false, error: 'Acción bloqueada: No se puede asignar el rol ROOT a otros usuarios.' });
    }
    let finalPassword = password;
    if (password) {
        finalPassword = await bcrypt.hash(password, 10);
    }
    
    // Verificar si ya existe este empleado en el personal por su nombre
    const [existing] = await pool.query('SELECT id_personal FROM personal WHERE nombre_completo = ?', [nombre]);
    
    if (existing.length > 0) {
      const id = existing[0].id_personal;
      await pool.query(
        'UPDATE personal SET usuario = ?, contrasena = ?, role = ?, cargo = ?, email = ?, estado = ?, foto = ? WHERE id_personal = ?',
        [username, finalPassword, role, cargo, email, estado || 'Activo', foto || null, id]
      );
      console.log(`✅ Personal existente actualizado a Usuario con ID: ${id}`);
      await registrarAuditoria(req, 'MODIFICAR', 'personal', id, { usuario: username, role: role, cargo: cargo, status: 'Acceso habilitado' });
      res.json({ success: true, id: id });
    } else {
      const uniqueCedula = username ? `${username} Tja.` : `GEN_${Date.now()}`;
      const [result] = await pool.query(
        'INSERT INTO personal (usuario, contrasena, role, nombre_completo, cargo, email, estado, foto, cedula_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [username, finalPassword, role, nombre, cargo, email, estado || 'Activo', foto || null, uniqueCedula]
      );
      console.log(`✅ Usuario nuevo creado con ID: ${result.insertId}`);
      await registrarAuditoria(req, 'CREAR', 'personal', result.insertId, { usuario: username, role: role, cargo: cargo });
      res.json({ success: true, id: result.insertId });
    }
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
    // PROTECCIÓN PARA EL USUARIO ROOT
    const [userCheck] = await pool.query('SELECT role FROM personal WHERE id_personal = ?', [id]);
    if (userCheck.length > 0 && userCheck[0].role === 'ROOT') {
        if (role !== 'ROOT') {
            return res.status(403).json({ success: false, error: 'No se puede quitar el rol ROOT al usuario principal.' });
        }
        if (estado === 'Inactivo') {
            return res.status(403).json({ success: false, error: 'Acción bloqueada: No puedes auto-suspender al ROOT principal.' });
        }
    }
    
    if (role === 'ROOT' && (!userCheck.length || userCheck[0].role !== 'ROOT')) {
        return res.status(403).json({ success: false, error: 'Acción bloqueada: No se puede asignar el rol ROOT a otros usuarios.' });
    }

    const fields = ['usuario=?', 'role=?', 'nombre_completo=?', 'cargo=?', 'email=?', 'estado=?'];
    const params = [username, role, nombre, cargo, email, estado];

    if (foto !== undefined) {
      fields.push('foto=?');
      params.push(foto);
    }

    if (password && password.trim() !== '') {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('contrasena=?');
      params.push(hashed);
    }
    
    params.push(id);
    const query = `UPDATE personal SET ${fields.join(', ')} WHERE id_personal=?`;

    await pool.query(query, params);
    console.log(`✅ Usuario ${id} actualizado con éxito`);
    await registrarAuditoria(req, 'MODIFICAR', 'personal', id, { usuario: username, role: role, cargo: cargo, estado: estado });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar un usuario (Revocar acceso, no eliminar operario)
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // PROTECCIÓN PARA EL USUARIO ROOT
    const [userCheck] = await pool.query('SELECT role FROM personal WHERE id_personal = ?', [id]);
    if (userCheck.length > 0 && userCheck[0].role === 'ROOT') {
        return res.status(403).json({ error: 'Acción bloqueada: No se puede revocar el acceso al usuario ROOT principal.' });
    }

    await pool.query(
      'UPDATE personal SET usuario = NULL, contrasena = NULL, role = "TECNICO" WHERE id_personal = ?',
      [id]
    );
    console.log(`✅ Acceso de usuario revocado con éxito para ID: ${id}`);
    await registrarAuditoria(req, 'ELIMINAR', 'personal', id, { status: 'Acceso revocado' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al revocar acceso de usuario:', error);
    res.status(500).json({ error: 'Error al revocar acceso' });
  }
});

// --- HISTORIAL DE IMPRESIONES (Reportes Inmutables) ---

// Obtener historial completo
app.get('/api/impresiones', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, s.comunicacion_interna 
      FROM historial_impresiones h
      LEFT JOIN solicitudes_poda s ON h.id_solicitud = s.id_solicitud
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

// ==========================================
// --- CONTROL DE HERRAMIENTAS E INVENTARIO ---
// ==========================================

// 1. Obtener catálogo general de ítems
app.get('/api/inventario/items', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventario_items ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener catálogo de inventario:', error);
    res.status(500).json({ error: 'Error al obtener catálogo de inventario' });
  }
});

// Crear nuevo ítem en el catálogo
app.post('/api/inventario/items', async (req, res) => {
  try {
    const { nombre, tipo, descripcion, unidad_medida } = req.body;
    const [result] = await pool.query(
      'INSERT INTO inventario_items (nombre, tipo, descripcion, unidad_medida) VALUES (?, ?, ?, ?)',
      [nombre, tipo, descripcion || null, unidad_medida || 'Unidad']
    );
    
    // Si es consumible o repuesto, inicializar su fila en inventario_consumibles con 0
    if (tipo === 'Consumible' || tipo === 'Repuesto') {
      await pool.query(
        'INSERT INTO inventario_consumibles (id_item, cantidad_almacen, cantidad_oficina, cantidad_tecnicos) VALUES (?, 0, 0, 0)',
        [result.insertId]
      );
    }
    
    await registrarAuditoria(req, 'CREAR', 'inventario_items', result.insertId, { nombre, tipo });
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error al crear ítem de inventario:', error);
    res.status(500).json({ error: 'Error al crear ítem de inventario' });
  }
});

// 2. Obtener lista de activos codificados (motosierras, pértigas, escaleras, etc.)
app.get('/api/inventario/activos', async (req, res) => {
  try {
    const query = `
      SELECT 
        a.*, 
        i.nombre AS item_nombre,
        p1.nombre_completo AS custodio_nombre,
        p2.nombre_completo AS operario_nombre
      FROM inventario_activos a
      JOIN inventario_items i ON a.id_item = i.id_item
      LEFT JOIN personal p1 ON a.id_custodio = p1.id_personal
      LEFT JOIN personal p2 ON a.id_usuario_operario = p2.id_personal
      ORDER BY a.codigo_activo ASC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener activos de inventario:', error);
    res.status(500).json({ error: 'Error al obtener activos de inventario' });
  }
});

// Registrar un activo codificado (ficha técnica)
app.post('/api/inventario/activos', async (req, res) => {
  try {
    const data = req.body;
    const insertData = {
      id_item: data.id_item,
      modelo: data.modelo || null,
      marca: data.marca || null,
      procedencia: data.procedencia || null,
      capacidad: data.capacidad || null,
      potencia_hp: data.potencia_hp || null,
      cilindrada_cm3: data.cilindrada_cm3 || null,
      motor: data.motor || null,
      peso_kg: data.peso_kg || null,
      longitud_espada: data.longitud_espada || null,
      cadena: data.cadena || null,
      paso_cadena: data.paso_cadena || null,
      fecha_adquisicion: formatDbDate(data.fecha_adquisicion) || null,
      numero_chasis: data.numero_chasis,
      codigo_activo: data.codigo_activo,
      estado: data.estado || 'Bueno',
      uso: data.uso || 'Moderado',
      ubicacion_actual: data.ubicacion_actual || 'Almacen',
      id_custodio: data.id_custodio || null,
      id_usuario_operario: data.id_usuario_operario || null,
      observaciones: data.observaciones || null
    };

    const [result] = await pool.query('INSERT INTO inventario_activos SET ?', [insertData]);
    await registrarAuditoria(req, 'CREAR', 'inventario_activos', result.insertId, { codigo_activo: insertData.codigo_activo, numero_chasis: insertData.numero_chasis });
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error al crear activo de inventario:', error);
    res.status(500).json({ error: 'Error al crear activo de inventario', detail: error.message });
  }
});

// Modificar Ficha Técnica o Custodia
app.put('/api/inventario/activos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateData = {
      modelo: data.modelo || null,
      marca: data.marca || null,
      procedencia: data.procedencia || null,
      capacidad: data.capacidad || null,
      potencia_hp: data.potencia_hp || null,
      cilindrada_cm3: data.cilindrada_cm3 || null,
      motor: data.motor || null,
      peso_kg: data.peso_kg || null,
      longitud_espada: data.longitud_espada || null,
      cadena: data.cadena || null,
      paso_cadena: data.paso_cadena || null,
      fecha_adquisicion: formatDbDate(data.fecha_adquisicion) || null,
      numero_chasis: data.numero_chasis,
      codigo_activo: data.codigo_activo,
      estado: data.estado || 'Bueno',
      uso: data.uso || 'Moderado',
      ubicacion_actual: data.ubicacion_actual || 'Almacen',
      id_custodio: data.id_custodio || null,
      id_usuario_operario: data.id_usuario_operario || null,
      observaciones: data.observaciones || null
    };

    await pool.query('UPDATE inventario_activos SET ? WHERE id_activo = ?', [updateData, id]);
    await registrarAuditoria(req, 'MODIFICAR', 'inventario_activos', id, { codigo_activo: updateData.codigo_activo, estado: updateData.estado });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar activo de inventario:', error);
    res.status(500).json({ error: 'Error al actualizar activo de inventario', detail: error.message });
  }
});

// 3. Obtener existencias de Consumibles y Repuestos (Cantidades por ubicación)
app.get('/api/inventario/consumibles', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*, 
        i.nombre AS item_nombre,
        i.tipo AS item_tipo,
        i.unidad_medida
      FROM inventario_consumibles c
      JOIN inventario_items i ON c.id_item = i.id_item
      ORDER BY i.nombre ASC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener consumibles de inventario:', error);
    res.status(500).json({ error: 'Error al obtener consumibles de inventario' });
  }
});

// 4. Registrar movimiento de inventario (Ingreso, Traslado, Entrega)
app.post('/api/inventario/movimientos', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const data = req.body; 
    
    const qty = parseInt(data.cantidad);
    const itemId = parseInt(data.id_item);
    
    const [itemCheck] = await connection.query('SELECT tipo FROM inventario_items WHERE id_item = ?', [itemId]);
    if (itemCheck.length === 0) {
      throw new Error('El ítem no existe en el catálogo.');
    }
    const itemTipo = itemCheck[0].tipo;
    
    if (data.tipo_movimiento !== 'Ingreso') {
      const [stockCheck] = await connection.query('SELECT * FROM inventario_consumibles WHERE id_item = ?', [itemId]);
      if (stockCheck.length > 0) {
        const stock = stockCheck[0];
        let availableStock = 0;
        if (data.origen === 'Almacén') availableStock = stock.cantidad_almacen;
        else if (data.origen === 'Oficina') availableStock = stock.cantidad_oficina;
        else if (data.origen === 'Técnico') availableStock = stock.cantidad_tecnicos;
        
        if (availableStock < qty) {
          throw new Error(`Stock insuficiente en ${data.origen}. Disponible: ${availableStock}, Solicitado: ${qty}`);
        }
      } else {
        throw new Error('Stock no inicializado para este ítem.');
      }
    }

    let estadoDevolucion = 'No aplica';
    if (itemTipo === 'Repuesto' && data.tipo_movimiento === 'Entrega' && data.id_activo_destino) {
      estadoDevolucion = 'Pendiente devolución';
    }

    const insertMov = {
      id_item: itemId,
      cantidad: qty,
      tipo_movimiento: data.tipo_movimiento,
      origen: data.origen,
      destino: data.destino,
      id_recibe: data.id_recibe || null,
      id_activo_destino: data.id_activo_destino || null,
      estado_devolucion: estadoDevolucion,
      fecha_movimiento: formatDbDate(data.fecha_movimiento) || new Date().toISOString().split('T')[0],
      observaciones: data.observaciones || null
    };

    const [result] = await connection.query('INSERT INTO inventario_movimientos SET ?', [insertMov]);

    if (data.tipo_movimiento === 'Ingreso') {
      const targetColumn = data.destino === 'Oficina' ? 'cantidad_oficina' : 'cantidad_almacen';
      await connection.query(
        `UPDATE inventario_consumibles SET ${targetColumn} = ${targetColumn} + ? WHERE id_item = ?`,
        [qty, itemId]
      );
    } else {
      let colOrigen = '';
      if (data.origen === 'Almacén') colOrigen = 'cantidad_almacen';
      else if (data.origen === 'Oficina') colOrigen = 'cantidad_oficina';
      else if (data.origen === 'Técnico') colOrigen = 'cantidad_tecnicos';
      
      let colDestino = '';
      if (data.destino === 'Almacén') colDestino = 'cantidad_almacen';
      else if (data.destino === 'Oficina') colDestino = 'cantidad_oficina';
      else if (data.destino === 'Técnico') colDestino = 'cantidad_tecnicos';

      await connection.query(
        `UPDATE inventario_consumibles SET ${colOrigen} = ${colOrigen} - ? WHERE id_item = ?`,
        [qty, itemId]
      );
      await connection.query(
        `UPDATE inventario_consumibles SET ${colDestino} = ${colDestino} + ? WHERE id_item = ?`,
        [qty, itemId]
      );
    }

    await connection.commit();
    await registrarAuditoria(req, 'CREAR', 'inventario_movimientos', result.insertId, { tipo_movimiento: data.tipo_movimiento, cantidad: qty });
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar movimiento de inventario:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// Obtener historial de movimientos
app.get('/api/inventario/movimientos', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.*,
        i.nombre AS item_nombre,
        i.tipo AS item_tipo,
        p.nombre_completo AS recibe_nombre,
        a.codigo_activo AS activo_codigo,
        a.modelo AS activo_modelo
      FROM inventario_movimientos m
      JOIN inventario_items i ON m.id_item = i.id_item
      LEFT JOIN personal p ON m.id_recibe = p.id_personal
      LEFT JOIN inventario_activos a ON m.id_activo_destino = a.id_activo
      ORDER BY m.fecha_movimiento DESC, m.id_movimiento DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener movimientos de inventario:', error);
    res.status(500).json({ error: 'Error al obtener movimientos de inventario' });
  }
});

// Actualizar estado de devolución de pieza vieja
app.put('/api/inventario/movimientos/:id/devolucion', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_devolucion, fecha_devolucion } = req.body;
    
    const dateVal = formatDbDate(fecha_devolucion) || new Date().toISOString().split('T')[0];
    
    await pool.query(
      'UPDATE inventario_movimientos SET estado_devolucion = ?, fecha_devolucion = ? WHERE id_movimiento = ?',
      [estado_devolucion, dateVal, id]
    );
    
    await registrarAuditoria(req, 'MODIFICAR', 'inventario_movimientos', id, { estado_devolucion, fecha_devolucion: dateVal });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar estado de devolución:', error);
    res.status(500).json({ error: 'Error al actualizar estado de devolución' });
  }
});

// 5. Registrar mantenimiento anual
app.post('/api/inventario/mantenimientos', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id_activo, fecha_mantenimiento, observaciones, detalles } = req.body;

    const dateReg = new Date().toISOString().split('T')[0];
    const dateMant = formatDbDate(fecha_mantenimiento) || dateReg;

    const [result] = await connection.query(
      'INSERT INTO inventario_mantenimientos (id_activo, fecha_registro, fecha_mantenimiento, observaciones) VALUES (?, ?, ?, ?)',
      [id_activo, dateReg, dateMant, observaciones || null]
    );
    const id_mantenimiento = result.insertId;

    if (detalles && detalles.length > 0) {
      for (const det of detalles) {
        await connection.query(
          'INSERT INTO inventario_mantenimiento_detalles (id_mantenimiento, numero_item, detalle, unidad, cantidad, precio_unitario, total_bs) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id_mantenimiento, det.numero_item, det.detalle, det.unidad || 'Unidad', det.cantidad, det.precio_unitario, det.total_bs]
        );
      }
    }

    await connection.commit();
    await registrarAuditoria(req, 'CREAR', 'inventario_mantenimientos', id_mantenimiento, { id_activo });
    res.json({ success: true, id_mantenimiento });
  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar mantenimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// Obtener mantenimientos de un activo
app.get('/api/inventario/activos/:id/mantenimientos', async (req, res) => {
  try {
    const { id } = req.params;
    const [mants] = await pool.query(
      'SELECT * FROM inventario_mantenimientos WHERE id_activo = ? ORDER BY fecha_mantenimiento DESC',
      [id]
    );

    const mantsWithDetails = [];
    for (const m of mants) {
      const [dets] = await pool.query(
        'SELECT * FROM inventario_mantenimiento_detalles WHERE id_mantenimiento = ? ORDER BY numero_item ASC',
        [m.id_mantenimiento]
      );
      mantsWithDetails.push({ ...m, detalles: dets });
    }

    res.json(mantsWithDetails);
  } catch (error) {
    console.error('Error al obtener mantenimientos del activo:', error);
    res.status(500).json({ error: 'Error al obtener mantenimientos del activo' });
  }
});

// Obtener repuestos de una motosierra específica
app.get('/api/inventario/activos/:id/repuestos', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        m.*,
        i.nombre AS item_nombre,
        p.nombre_completo AS recibe_nombre
      FROM inventario_movimientos m
      JOIN inventario_items i ON m.id_item = i.id_item
      LEFT JOIN personal p ON m.id_recibe = p.id_personal
      WHERE m.id_activo_destino = ?
      ORDER BY m.fecha_movimiento DESC
    `;
    const [rows] = await pool.query(query, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener repuestos del activo:', error);
    res.status(500).json({ error: 'Error al obtener repuestos del activo' });
  }
});

// --- GESTIÓN DE CATÁLOGOS (DINÁMICO) ---
const TABLAS_PERMITIDAS = ['acciones', 'especies', 'tipos_institucion', 'instituciones', 'distritos', 'barrios', 'personal', 'tecnicos'];

const getPkColumn = (tabla) => {
  switch (tabla) {
    case 'personal':
    case 'tecnicos':
      return 'id_personal';
    case 'barrios':
      return 'id_barrio';
    case 'especies':
    case 'especies_arboles':
      return 'id_especie';
    case 'acciones':
    case 'acciones_catalogo':
      return 'id_accion';
    case 'tipos_institucion':
    case 'tipos_solicitantes':
      return 'id_tipo_solicitante';
    case 'instituciones':
      return 'id_institucion';
    case 'distritos':
      return 'id_distrito';
    default:
      return 'id';
  }
};

const mapIncomingFields = (tabla, body) => {
  const data = { ...body };
  
  if (tabla === 'tecnicos' || tabla === 'personal') {
    if (data.nombre !== undefined) {
      data.nombre_completo = data.nombre;
      delete data.nombre;
    }
    if (data.celular !== undefined) {
      data.contacto = data.celular;
      delete data.celular;
    }
    if (data.tipo_contrato !== undefined) {
      data.contrato = data.tipo_contrato;
      delete data.tipo_contrato;
    }
    if (data.username !== undefined) {
      data.usuario = data.username;
      delete data.username;
    }
    if (data.password !== undefined) {
      data.contrasena = data.password;
      delete data.password;
    }

    // Encriptar contraseña si está presente y no está encriptada
    if (data.contrasena && typeof data.contrasena === 'string') {
      if (!data.contrasena.startsWith('$2b$') && !data.contrasena.startsWith('$2a$')) {
        data.contrasena = bcrypt.hashSync(data.contrasena, 10);
      }
    } else if (data.contrasena === '') {
      // Si se envía vacía, evitamos sobreescribir la existente
      delete data.contrasena;
    }

    if (!data.cedula_id) {
      data.cedula_id = data.usuario ? `${data.usuario} Tja.` : `GEN_${Date.now()}`;
    }
  } else if (tabla === 'especies') {
    if (data.nombre !== undefined) {
      data.nombre_comun = data.nombre;
      delete data.nombre;
    }
  } else if (tabla === 'acciones') {
    if (data.nombre !== undefined) {
      data.nombre_accion = data.nombre;
      delete data.nombre;
    }
  } else if (tabla === 'tipos_institucion') {
    if (data.nombre !== undefined) {
      data.nombre_tipo = data.nombre;
      delete data.nombre;
    }
  } else if (tabla === 'instituciones') {
    if (data.nombre !== undefined) {
      data.nombre_institucion = data.nombre;
      delete data.nombre;
    }
    if (data.id_tipo !== undefined) {
      data.id_tipo_solicitante = data.id_tipo;
      delete data.id_tipo;
    }
  } else if (tabla === 'distritos') {
    if (data.nombre !== undefined) {
      data.numero_distrito = data.nombre;
      delete data.nombre;
    }
  } else if (tabla === 'barrios') {
    if (data.nombre !== undefined) {
      data.nombre_barrio = data.nombre;
      delete data.nombre;
    }
  }
  
  return data;
};

app.post('/api/catalogos/:tabla', async (req, res) => {
  const { tabla } = req.params;
  if (!TABLAS_PERMITIDAS.includes(tabla)) return res.status(400).json({ error: 'Tabla no permitida' });
  
  try {
    const actualTable = tabla === 'tecnicos' ? 'personal' : 
                        tabla === 'especies' ? 'especies_arboles' :
                        tabla === 'acciones' ? 'acciones_catalogo' :
                        tabla === 'tipos_institucion' ? 'tipos_solicitantes' : tabla;

    const mappedBody = mapIncomingFields(tabla, req.body);
    const fields = Object.keys(mappedBody).join(', ');
    const placeholders = Object.keys(mappedBody).map(() => '?').join(', ');
    const values = Object.values(mappedBody);
    
    const [result] = await pool.query(`INSERT INTO ${actualTable} (${fields}) VALUES (${placeholders})`, values);
    await registrarAuditoria(req, 'CREAR', actualTable, result.insertId, mappedBody);
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
    const actualTable = tabla === 'tecnicos' ? 'personal' : 
                        tabla === 'especies' ? 'especies_arboles' :
                        tabla === 'acciones' ? 'acciones_catalogo' :
                        tabla === 'tipos_institucion' ? 'tipos_solicitantes' : tabla;

    const mappedBody = mapIncomingFields(tabla, req.body);
    delete mappedBody.id;
    
    const pk = getPkColumn(tabla);
    const sets = Object.keys(mappedBody).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(mappedBody), id];
    
    await pool.query(`UPDATE ${actualTable} SET ${sets} WHERE ${pk} = ?`, values);
    await registrarAuditoria(req, 'MODIFICAR', actualTable, id, mappedBody);
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
    const actualTable = tabla === 'tecnicos' ? 'personal' : 
                        tabla === 'especies' ? 'especies_arboles' :
                        tabla === 'acciones' ? 'acciones_catalogo' :
                        tabla === 'tipos_institucion' ? 'tipos_solicitantes' : tabla;

    const pk = getPkColumn(tabla);

    if (actualTable === 'personal') {
      const [userCheck] = await pool.query(`SELECT role FROM personal WHERE ${pk} = ?`, [id]);
      if (userCheck.length > 0 && userCheck[0].role === 'ROOT') {
        return res.status(403).json({ error: 'Acción bloqueada: No se puede eliminar al usuario ROOT principal del catálogo de personal.' });
      }
    }

    await pool.query(`DELETE FROM ${actualTable} WHERE ${pk} = ?`, [id]);
    await registrarAuditoria(req, 'ELIMINAR', actualTable, id, { id: id });
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
  
  // Ejecutamos mysqldump conectando directamente al host de la base de datos a través de la red
  const cmd = `mysqldump -h ${host} -u ${user} -p${pass} ${db}`;
  
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

// --- AUDITORÍA DE ACTIVIDAD (CAJA NEGRA) ---
app.get('/api/auditoria', async (req, res) => {
  if (req.user?.role !== 'ROOT') {
    return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de ROOT' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM auditoria_actividad ORDER BY fecha_hora DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener registros de auditoría:', error);
    res.status(500).json({ error: 'Error al obtener registros de auditoría' });
  }
});

// --- RUTAS CALENDARIO FESTIVO ---
app.get('/api/calendario', async (req, res) => {
  try {
    const query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM solicitudes_poda s 
              JOIN barrios b ON s.id_barrio = b.id_barrio 
              WHERE b.nombre_barrio = c.nombre_barrio) AS solicitudes_count
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

    // Validar duplicidad de aniversarios de barrio (excluyendo feriados)
    if (nombre_barrio && !nombre_barrio.startsWith('Feriado:')) {
      const [existing] = await pool.query(
        'SELECT id FROM calendario_barrios WHERE LOWER(TRIM(nombre_barrio)) = LOWER(TRIM(?))',
        [nombre_barrio]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: `El barrio "${nombre_barrio}" ya tiene un aniversario registrado en el calendario.` });
      }
    }

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

    // Validar duplicidad de aniversarios de barrio (excluyendo feriados)
    if (nombre_barrio && !nombre_barrio.startsWith('Feriado:')) {
      const [existing] = await pool.query(
        'SELECT id FROM calendario_barrios WHERE LOWER(TRIM(nombre_barrio)) = LOWER(TRIM(?)) AND id != ?',
        [nombre_barrio, req.params.id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: `El barrio "${nombre_barrio}" ya tiene un aniversario registrado en el calendario.` });
      }
    }

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
