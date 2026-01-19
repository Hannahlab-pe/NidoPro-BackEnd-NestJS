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

async function createAdminUser() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Obtener ID del rol ADMINISTRADOR
    const rolRes = await client.query("SELECT id_rol FROM rol WHERE nombre = 'ADMINISTRADOR' LIMIT 1;");
    if (rolRes.rows.length === 0) {
      console.log('❌ No se encontró el rol ADMINISTRADOR');
      return;
    }
    const rolId = rolRes.rows[0].id_rol;
    console.log('📋 Rol ADMINISTRADOR encontrado:', rolId);

    // Hash de contraseña 'admin123'
    const hash = await bcrypt.hash('admin123', 10);
    console.log('🔐 Contraseña hasheada');

    // Insertar usuario
    const userRes = await client.query(
      'INSERT INTO usuario (usuario, contrasena, esta_activo, cambio_contrasena) VALUES ($1, $2, true, false) RETURNING id_usuario;',
      ['admin_nuevo', hash]
    );
    const userId = userRes.rows[0].id_usuario;
    console.log('👤 Usuario creado con ID:', userId);

    // Insertar trabajador
    await client.query(
      'INSERT INTO trabajador (nombre, apellido, tipo_documento, nro_documento, correo, telefono, direccion, esta_activo, id_rol, id_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9);',
      ['Admin', 'Nuevo', 'DNI', '99999999', 'admin@nidopro.edu.pe', '999999999', 'Dirección Admin', rolId, userId]
    );

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('👤 Usuario: admin_nuevo');
    console.log('🔑 Contraseña: admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createAdminUser();