import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'dboficina',
        port: process.env.DB_PORT || 3306
    });

    console.log("Conectado a la base de datos para encriptar contraseñas...");
    const [users] = await conn.query('SELECT id_personal, contrasena FROM personal WHERE contrasena IS NOT NULL');
    
    for (let u of users) {
        if (u.contrasena && !u.contrasena.startsWith('$2b$') && !u.contrasena.startsWith('$2a$')) {
            console.log(`Encriptando contraseña para ID personal: ${u.id_personal}...`);
            const hashed = await bcrypt.hash(u.contrasena, 10);
            await conn.query('UPDATE personal SET contrasena = ? WHERE id_personal = ?', [hashed, u.id_personal]);
        }
    }
    
    await conn.end();
    console.log("Contraseñas de personal encriptadas correctamente.");
}

main().catch(console.error);
