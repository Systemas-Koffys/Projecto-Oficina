const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("Conectado a la base de datos para siembra...");

    const barrios = [1, 2, 3, 4, 5, 6, 7, 8]; // IDs de barrios existentes
    const acciones = [1, 2, 3, 4, 5]; // IDs de acciones
    const tecnicos = [1, 2, 3, 4]; // IDs de técnicos
    const estados = ['Ejecutado', 'En espera', 'En proceso'];
    const urgencias = ['Baja', 'Media', 'Alta'];
    
    const solicitantes = ['Maria Delgado', 'Jose Luis Choque', 'Ana Maria Vaca', 'Carlos Mendez', 'Lucia Sirpa', 'Roberto Zenteno', 'Elena Flores', 'Pedro Armella'];
    const descripciones = [
        'Rama obstruyendo cables', 'Árbol seco con riesgo de caída', 'Poda de formación necesaria', 
        'Despeje de luminarias', 'Tala por construcción', 'Raíces levantando acera', 
        'Ramas bajas estorban el paso', 'Solicitud de inspección preventiva'
    ];

    console.log("Generando 100 solicitudes...");

    for (let i = 0; i < 100; i++) {
        const id_barrio = barrios[Math.floor(Math.random() * barrios.length)];
        const id_accion = acciones[Math.floor(Math.random() * acciones.length)];
        const id_tec = tecnicos[Math.floor(Math.random() * tecnicos.length)];
        const estado = estados[Math.floor(Math.random() * estados.length)];
        const urgencia = (Math.random() > 0.8) ? 'Alta' : urgencias[Math.floor(Math.random() * urgencias.length)];
        const es_emergencia = (urgencia === 'Alta' && Math.random() > 0.5) ? 1 : 0;
        
        // Fecha aleatoria últimos 120 días
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 120));
        const fecha_ingreso = fecha.toISOString().split('T')[0];
        
        // Fecha ejecución si está terminado
        let fecha_ejecucion = null;
        if (estado === 'Ejecutado') {
            const fechaE = new Date(fecha);
            fechaE.setDate(fechaE.getDate() + Math.floor(Math.random() * 15));
            fecha_ejecucion = fechaE.toISOString().split('T')[0];
        }

        // Coordenadas Tarija (Centro -21.535, -64.732) con variación
        const lat = -21.535 + (Math.random() - 0.5) * 0.05;
        const lng = -64.732 + (Math.random() - 0.5) * 0.05;

        const sql = `INSERT INTO solicitudes 
            (comunicacion_interna, fecha_ingreso, solicitante_nombre, solicitante_telefono, calle, id_barrio, id_accion_solicitada, nivel_urgencia, es_emergencia, estado_tramite, id_tecnico_ejecucion, fecha_ejecucion, lat, lng, solicitante_descripcion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const values = [
            `CI-${200 + i}`,
            fecha_ingreso,
            solicitantes[Math.floor(Math.random() * solicitantes.length)],
            '7' + Math.floor(1000000 + Math.random() * 9000000),
            'Calle ' + (Math.floor(Math.random() * 100) + 1),
            id_barrio,
            id_accion,
            urgencia,
            es_emergencia,
            estado,
            estado === 'Ejecutado' ? id_tec : null,
            fecha_ejecucion,
            lat,
            lng,
            descripciones[Math.floor(Math.random() * descripciones.length)]
        ];

        await connection.execute(sql, values);
    }

    console.log("¡Siembra completada con éxito!");
    await connection.end();
}

seed().catch(err => console.error(err));
