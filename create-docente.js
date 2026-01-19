const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'hopper.proxy.rlwy.net',
  port: 31842,
  user: 'postgres',
  password: 'oGGRgtaPmXQOezPUiRDqOjXxwHkHnRsv',
  database: 'railway',
  ssl: { rejectUnauthorized: false }
});

async function createDocenteUser() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // ID del rol DOCENTE
    const rolId = '7c643246-b7ee-4982-aedb-53fc27d19ed2';

    // Hash de contraseña 'docente123'
    const hash = await bcrypt.hash('docente123', 10);
    console.log('🔐 Contraseña hasheada');

    // Insertar usuario
    const userRes = await client.query(
      'INSERT INTO usuario (usuario, contrasena, esta_activo, cambio_contrasena) VALUES ($1, $2, true, false) RETURNING id_usuario;',
      ['docente_nuevo', hash]
    );
    const userId = userRes.rows[0].id_usuario;
    console.log('👤 Usuario creado con ID:', userId);

    // Insertar trabajador
    await client.query(
      'INSERT INTO trabajador (nombre, apellido, tipo_documento, nro_documento, correo, telefono, direccion, esta_activo, id_rol, id_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9);',
      ['Docente', 'Ejemplo', 'DNI', '11111111', 'docente@nidopro.edu.pe', '999999998', 'Dirección Docente', rolId, userId]
    );

    console.log('✅ Docente creado exitosamente!');
    console.log('👤 Usuario: docente_nuevo');
    console.log('🔑 Contraseña: docente123');
    console.log('👨‍🏫 Rol: DOCENTE');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createDocenteUser();