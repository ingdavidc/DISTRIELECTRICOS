require('dotenv').config({ path: '.env' });
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function main() {
  // Derivar connection string igual que lib/prisma.ts
  let connectionString = process.env.DATABASE_URL || '';
  if (process.env.DIRECT_URL) {
    connectionString = process.env.DIRECT_URL.replace(':5432', ':6543');
    if (!connectionString.includes('pgbouncer=true')) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
  }

  if (!connectionString) {
    console.error('❌ No se encontró DATABASE_URL ni DIRECT_URL en .env');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  const hashedPassword = await bcrypt.hash('123456', 12);
  const email = 'aliado.prueba13874164@distrielectricos.com';
  const identification = '13874164';
  const name = 'Aliado de Prueba';
  const phone = '3000000000';

  // Verificar si ya existe
  const existing = await client.query(
    `SELECT id, email FROM "User" WHERE identification = $1 OR email = $2`,
    [identification, email]
  );

  if (existing.rows.length > 0) {
    // Actualizar
    await client.query(
      `UPDATE "User" SET password = $1, role = 'EXPERT', email = $2 WHERE identification = $3`,
      [hashedPassword, email, identification]
    );
    console.log('✅ Usuario actualizado:');
  } else {
    // Crear
    await client.query(
      `INSERT INTO "User" (id, identification, name, email, password, role, phone, modules, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'EXPERT', $5, ARRAY[]::text[], now(), now())`,
      [identification, name, email, hashedPassword, phone]
    );
    console.log('✅ Usuario creado:');
  }

  console.log('   Email:', email);
  console.log('   Contraseña: 123456');
  console.log('   Documento:', identification);
  console.log('   Rol: EXPERT (Aliado)');

  await client.end();
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
