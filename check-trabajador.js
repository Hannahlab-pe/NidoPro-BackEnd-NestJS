const { Client } = require('pg');

const client = new Client({
  host: 'hopper.proxy.rlwy.net',
  port: 31842,
  user: 'postgres',
  password: 'oGGRgtaPmXQOezPUiRDqOjXxwHkHnRsv',
  database: 'railway',
  ssl: { rejectUnauthorized: false }
});

async function checkTrabajador() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    const res = await client.query(`
      SELECT t.nombre, t.apellido, r.nombre as rol, u.usuario
      FROM trabajador t
      JOIN rol r ON t.id_rol = r.id_rol
      JOIN usuario u ON t.id_usuario = u.id_usuario
      WHERE t.nombre = 'ALBERTO' AND t.apellido = 'TORRES';
    `);

    if (res.rows.length > 0) {
      console.log('Trabajador encontrado:');
      console.table(res.rows);
    } else {
      console.log('❌ No se encontró el trabajador ALBERTO TORRES');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTrabajador();