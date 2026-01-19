const { Client } = require('pg');

const client = new Client({
  host: 'hopper.proxy.rlwy.net',
  port: 31842,
  user: 'postgres',
  password: 'oGGRgtaPmXQOezPUiRDqOjXxwHkHnRsv',
  database: 'railway',
  ssl: { rejectUnauthorized: false }
});

async function cleanDuplicateRoles() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Contar roles antes de limpiar
    const countBefore = await client.query('SELECT COUNT(*) as total FROM rol;');
    console.log(`📊 Total de roles antes: ${countBefore.rows[0].total}`);

    // Eliminar duplicados, manteniendo solo el primero por nombre
    await client.query(`
      WITH duplicates AS (
        SELECT id_rol,
               ROW_NUMBER() OVER (PARTITION BY nombre ORDER BY id_rol) as rn
        FROM rol
      )
      DELETE FROM rol WHERE id_rol IN (
        SELECT id_rol FROM duplicates WHERE rn > 1
      );
    `);

    // Contar roles después
    const countAfter = await client.query('SELECT COUNT(*) as total FROM rol;');
    console.log(`📊 Total de roles después: ${countAfter.rows[0].total}`);

    // Mostrar roles restantes
    const roles = await client.query('SELECT id_rol, nombre, descripcion FROM rol ORDER BY nombre;');
    console.log('\n📋 Roles esenciales restantes:');
    console.table(roles.rows);

    console.log('✅ Limpieza completada!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

cleanDuplicateRoles();