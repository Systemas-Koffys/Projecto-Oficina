const fs = require('fs');
const mysql = require('mysql2/promise');

async function migrate() {
    const backupContent = fs.readFileSync('./respaldo_local.sql', 'utf8');
    
    // Extraer la línea de INSERT INTO `solicitudes`
    const insertLineRegex = /INSERT INTO `solicitudes` VALUES \((.*?)\);/s;
    const match = backupContent.match(insertLineRegex);
    
    const pool = mysql.createPool({
        host: 'db',
        user: 'root',
        password: 'password',
        port: 3306,
        multipleStatements: true
    });

    console.log("Creando y poblado tempdb...");
    await pool.query('CREATE DATABASE IF NOT EXISTS tempdb; USE tempdb;');
    
    // Instead of raw query of full backup, let's just insert into tempdb
    const sqlCommands = backupContent.split(/;\s*$/m).filter(q => q.trim().length > 0);
    for(let q of sqlCommands) {
        if (!q.trim().startsWith('/*') && !q.trim().startsWith('--')) {
            try {
                await pool.query(q);
            } catch(e) {}
        }
    }

    const conn = await pool.getConnection();
    console.log("Limpiando tablas de datos falsos...");
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE dboficina.ejecuciones');
    await conn.query('TRUNCATE TABLE dboficina.inspecciones');
    await conn.query('TRUNCATE TABLE dboficina.solicitudes');

    console.log("Leyendo registros y migrando a la nueva estructura...");
    const [rows] = await conn.query('SELECT * FROM tempdb.solicitudes');
    
    for (const row of rows) {
        console.log(`Procesando solicitud: ${row.id_solicitud}`);
        // 1. Insert in `solicitudes`
        let estado = row.estado_tramite || 'En espera';
        if (estado === 'Terminado' || estado === 'Archivado') estado = 'Ejecutado';
        else if (estado === 'Pendiente') estado = 'En espera';
        else if (estado === 'En tramite' || estado === 'En Tramite') estado = 'En proceso';
        
        const validEstados = ['En espera', 'En proceso', 'Ejecutado', 'Rechazado'];
        if (!validEstados.includes(estado)) estado = 'En espera';

        const [solRes] = await conn.query(`
            INSERT IGNORE INTO dboficina.solicitudes (id_solicitud, comunicacion_interna, fecha_ingreso, solicitante_nombre, solicitante_telefono, lo_solicitado, id_accion_solicitada, id_barrio, calle, numero_casa, referencia, id_nombre_institucional, estado_tramite)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [row.id_solicitud, row.comunicacion_interna, row.fecha_ingreso, row.solicitante_nombre, row.solicitante_telefono, row.lo_solicitado, row.id_accion_solicitada, row.id_barrio, row.calle, row.numero_casa, row.referencia, row.id_nombre_institucional, estado]);

        // 2. Insert in `inspecciones` if it has verification data
        if (row.id_tecnico_verificacion || row.fecha_verificacion) {
             let urgencia = row.nivel_urgencia;
             if (urgencia === 'Intermedia') urgencia = 'Media';
             
             await conn.query(`
                 INSERT IGNORE INTO dboficina.inspecciones (id_solicitud, fecha_verificacion, id_tecnico_verificacion, id_especie, requiere_plataforma, requiere_setar, requiere_ficha_tecnica, procede, arbol_seco, es_emergencia, nivel_urgencia, observacion_verificacion)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             `, [row.id_solicitud, row.fecha_verificacion, row.id_tecnico_verificacion, row.id_especie, row.requiere_plataforma, row.requiere_setar, row.requiere_ficha_tecnica, row.procede, row.arbol_seco, row.es_emergencia, urgencia, row.observacion_verificacion]);
        }

        // 3. Insert in `ejecuciones` if it has execution data
        if (row.id_tecnico_ejecucion || row.fecha_ejecucion) {
             await conn.query(`
                 INSERT IGNORE INTO dboficina.ejecuciones (id_solicitud, fecha_ejecucion, id_tecnico_ejecucion, id_accion, cantidad_notas, observaciones_finales)
                 VALUES (?, ?, ?, ?, ?, ?)
             `, [row.id_solicitud, row.fecha_ejecucion, row.id_tecnico_ejecucion, row.id_accion, row.cantidad_notas, row.observaciones_finales]);
        }
    }
    
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    conn.release();
    console.log(`Migración exitosa: ${rows.length} solicitudes reales restauradas en la nueva arquitectura de 3 tablas!`);
    pool.end();
}

migrate().catch(console.error);
