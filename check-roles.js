const { Client } = require('pg');

const client = new Client({
  host: 'hopper.proxy.rlwy.net',
  port: 31842,
  user: 'postgres',
  password: 'oGGRgtaPmXQOezPUiRDqOjXxwHkHnRsv',
  database: 'railway',
  ssl: { rejectUnauthorized: false }
});

async function checkRoleUsage() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Ver roles usados por trabajadores
    const usedByTrabajadores = await client.query(`
      SELECT DISTINCT r.nombre, COUNT(t.id_trabajador) as cantidad_trabajadores
      FROM rol r
      JOIN trabajador t ON t.id_rol = r.id_rol
      GROUP BY r.nombre
      ORDER BY r.nombre;
    `);

    // Ver roles usados por estudiantes
    const usedByEstudiantes = await client.query(`
      SELECT DISTINCT r.nombre, COUNT(e.id_estudiante) as cantidad_estudiantes
      FROM rol r
      JOIN estudiante e ON e.id_rol = r.id_rol
      GROUP BY r.nombre
      ORDER BY r.nombre;
    `);

    console.log('📋 Roles usados por trabajadores:');
    console.table(usedByTrabajadores.rows);

    console.log('📋 Roles usados por estudiantes:');
    console.table(usedByEstudiantes.rows);

    // Ver todos los roles con conteo de duplicados
    const allRoles = await client.query(`
      SELECT nombre, COUNT(*) as cantidad_duplicados
      FROM rol
      GROUP BY nombre
      ORDER BY nombre;
    `);

    console.log('📊 Conteo de roles (incluyendo duplicados):');
    console.table(allRoles.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkRoleUsage();