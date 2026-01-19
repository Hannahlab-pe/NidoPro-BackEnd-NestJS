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

    // Paso 1: Para cada nombre de rol, elegir el id_rol mínimo
    const canonicalRoles = await client.query(`
      SELECT DISTINCT ON (nombre) id_rol as canonical_id, nombre
      FROM rol
      ORDER BY nombre, id_rol;
    `);

    console.log('📋 Roles canónicos seleccionados:');
    console.table(canonicalRoles.rows);

    // Paso 2: Actualizar trabajadores para usar el id_rol canónico
    for (const role of canonicalRoles.rows) {
      await client.query(`
        UPDATE trabajador
        SET id_rol = $1
        WHERE id_rol IN (
          SELECT id_rol FROM rol WHERE nombre = $2
        );
      `, [role.canonical_id, role.nombre]);
    }

    // Paso 3: Actualizar estudiantes (aunque no haya)
    for (const role of canonicalRoles.rows) {
      await client.query(`
        UPDATE estudiante
        SET id_rol = $1
        WHERE id_rol IN (
          SELECT id_rol FROM rol WHERE nombre = $2
        );
      `, [role.canonical_id, role.nombre]);
    }

    console.log('🔄 FK actualizadas');

    // Paso 4: Eliminar duplicados
    await client.query(`
      DELETE FROM rol
      WHERE id_rol NOT IN (
        SELECT DISTINCT ON (nombre) id_rol
        FROM rol
        ORDER BY nombre, id_rol
      );
    `);

    // Verificar resultado
    const finalRoles = await client.query('SELECT id_rol, nombre, descripcion FROM rol ORDER BY nombre;');
    console.log(`\n✅ Limpieza completada! Roles restantes: ${finalRoles.rows.length}`);
    console.table(finalRoles.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

cleanDuplicateRoles();