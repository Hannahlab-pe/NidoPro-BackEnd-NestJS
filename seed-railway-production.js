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

async function insertInitialData() {
  try {
    await client.connect();
    console.log('✅ Conectado a Railway PostgreSQL\n');
    
    // === PASO 1: Insertar los 10 roles ===
    console.log('📋 Insertando roles...');
    
    const roles = [
      ['DIRECTORA', 'Administrador o Directora del sistema - Máximo nivel de acceso'],
      ['SECRETARIA', 'Personal de secretaría - Gestión administrativa'],
      ['DOCENTE', 'Docente o Profesor - Gestión de aulas y estudiantes'],
      ['COORDINADOR', 'Coordinador académico - Supervisión pedagógica'],
      ['ADMINISTRADOR', 'Administrador del sistema - Acceso técnico completo'],
      ['AUXILIAR', 'Personal auxiliar - Apoyo en aulas'],
      ['PSICOLOGO', 'Psicólogo de la institución - Apoyo psicopedagógico'],
      ['ESPECIALISTA', 'Especialista educativo - Áreas específicas'],
      ['APODERADO', 'Padre de familia o Apoderado - Acceso limitado a info de sus hijos'],
      ['ESTUDIANTE', 'Estudiante o Alumno - Acceso básico']
    ];
    
    let rolesCreados = 0;
    for (const [nombre, descripcion] of roles) {
      try {
        await client.query(
          `INSERT INTO rol (nombre, descripcion, esta_activo) VALUES ($1, $2, true)`,
          [nombre, descripcion]
        );
        rolesCreados++;
      } catch (err) {
        if (err.code !== '23505') throw err; // Ignorar duplicados
      }
    }
    
    console.log(`✅ ${rolesCreados} roles insertados\n`);
    
    // === PASO 2: Obtener IDs de roles para DIRECTORA y SECRETARIA ===
    const rolesQuery = await client.query(`
      SELECT id_rol, nombre FROM rol WHERE nombre IN ('DIRECTORA', 'SECRETARIA')
    `);
    
    const directoraRol = rolesQuery.rows.find(r => r.nombre === 'DIRECTORA');
    const secretariaRol = rolesQuery.rows.find(r => r.nombre === 'SECRETARIA');
    
    if (!directoraRol || !secretariaRol) {
      throw new Error('No se encontraron los roles DIRECTORA o SECRETARIA');
    }
    
    console.log(`📌 ID Rol DIRECTORA: ${directoraRol.id_rol}`);
    console.log(`📌 ID Rol SECRETARIA: ${secretariaRol.id_rol}\n`);
    
    // === PASO 3: Crear trabajador para la directora ===
    console.log('👤 Creando trabajador para DIRECTORA...');
    const directoraPassword = await bcrypt.hash('Admin2026!', 10);
    
    let idTrabajadorDirectora;
    try {
      const trabajadorDirectora = await client.query(`
        INSERT INTO trabajador (
          nombre, apellido, nro_documento, tipo_documento, correo, telefono, direccion, 
          esta_activo
        ) VALUES (
          'María', 'Rodríguez', '12345678', 'DNI', 'directora@nidopro.com', '987654321',
          'Av. Principal 123', true
        )
        RETURNING id_trabajador;
      `);
      idTrabajadorDirectora = trabajadorDirectora.rows[0].id_trabajador;
      console.log(`✅ Trabajador DIRECTORA creado: ${idTrabajadorDirectora}`);
    } catch (err) {
      if (err.code === '23505') {
        const existente = await client.query(`SELECT id_trabajador FROM trabajador WHERE nro_documento = '12345678'`);
        idTrabajadorDirectora = existente.rows[0].id_trabajador;
        console.log(`✅ Trabajador DIRECTORA ya existe: ${idTrabajadorDirectora}`);
      } else {
        throw err;
      }
    }
    
    // Crear usuario para directora
    try {
      await client.query(`
        INSERT INTO usuario (
          usuario, contrasena, id_rol, id_trabajador, esta_activo, 
          cambio_contrasena, creado
        ) VALUES (
          'directora', $1, $2, $3, true, false, CURRENT_DATE
        )
      `, [directoraPassword, directoraRol.id_rol, idTrabajadorDirectora]);
      console.log('✅ Usuario DIRECTORA creado');
    } catch (err) {
      if (err.code === '23505') {
        console.log('✅ Usuario DIRECTORA ya existe');
      } else {
        throw err;
      }
    }
    
    console.log('✅ Usuario DIRECTORA creado');
    console.log('   👉 Username: directora');
    console.log('   👉 Password: Admin2026!\n');
    
    // === PASO 4: Crear trabajador para la secretaria ===
    console.log('\n👤 Creando trabajador para SECRETARIA...');
    const secretariaPassword = await bcrypt.hash('Secre2026!', 10);
    
    let idTrabajadorSecretaria;
    try {
      const trabajadorSecretaria = await client.query(`
        INSERT INTO trabajador (
          nombre, apellido, nro_documento, tipo_documento, correo, telefono, direccion,
          esta_activo
        ) VALUES (
          'Ana', 'García', '87654321', 'DNI', 'secretaria@nidopro.com', '987654322',
          'Jr. Los Pinos 456', true
        )
        RETURNING id_trabajador;
      `);
      idTrabajadorSecretaria = trabajadorSecretaria.rows[0].id_trabajador;
      console.log(`✅ Trabajador SECRETARIA creado: ${idTrabajadorSecretaria}`);
    } catch (err) {
      if (err.code === '23505') {
        const existente = await client.query(`SELECT id_trabajador FROM trabajador WHERE nro_documento = '87654321'`);
        idTrabajadorSecretaria = existente.rows[0].id_trabajador;
        console.log(`✅ Trabajador SECRETARIA ya existe: ${idTrabajadorSecretaria}`);
      } else {
        throw err;
      }
    }
    
    // Crear usuario para secretaria
    try {
      await client.query(`
        INSERT INTO usuario (
          usuario, contrasena, id_rol, id_trabajador, esta_activo,
          cambio_contrasena, creado
        ) VALUES (
          'secretaria', $1, $2, $3, true, false, CURRENT_DATE
        )
      `, [secretariaPassword, secretariaRol.id_rol, idTrabajadorSecretaria]);
      console.log('✅ Usuario SECRETARIA creado');
    } catch (err) {
      if (err.code === '23505') {
        console.log('✅ Usuario SECRETARIA ya existe');
      } else {
        throw err;
      }
    }
    
    console.log('✅ Usuario SECRETARIA creado');
    console.log('   👉 Username: secretaria');
    console.log('   👉 Password: Secre2026!\n');
    
    // === RESUMEN FINAL ===
    console.log('═══════════════════════════════════════════');
    console.log('✅ DATOS INICIALES CREADOS EXITOSAMENTE');
    console.log('═══════════════════════════════════════════');
    console.log('\n📊 ROLES CREADOS (10):');
    const allRoles = await client.query('SELECT nombre FROM rol ORDER BY nombre');
    allRoles.rows.forEach((r, i) => console.log(`   ${i + 1}. ${r.nombre}`));
    
    console.log('\n👥 USUARIOS CREADOS (2):');
    console.log('   1. Username: directora  | Password: Admin2026!  | Rol: DIRECTORA');
    console.log('   2. Username: secretaria | Password: Secre2026! | Rol: SECRETARIA');
    console.log('\n═══════════════════════════════════════════');
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '23505') {
      console.error('   💡 Los datos ya existen en la base de datos');
    }
    process.exit(1);
  }
}

insertInitialData();
