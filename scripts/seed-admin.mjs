import { config } from "dotenv";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nara";

if (!uri) {
  console.error("Falta MONGODB_URI en .env.local");
  process.exit(1);
}

const ROLES = [
  {
    id: "admin",
    slug: "admin",
    name: "Administrador",
    description: "Configura el programa: territorios, equipos, usuarios, rutas, activos e informes.",
    href: "/inicio",
    nk: "admin",
  },
  {
    id: "experto",
    slug: "experto",
    name: "Experto de campo",
    description: "Visitas, captación, listas de trabajo y revisitas.",
    href: "/experto",
    nk: null,
  },
  {
    id: "clinico",
    slug: "clinico",
    name: "Clínico",
    description: "Casos clínicos, alertas y carga de pacientes.",
    href: "/clinico",
    nk: "clin",
  },
  {
    id: "paciente",
    slug: "paciente",
    name: "Paciente",
    description: "App del paciente y plan de cuidado.",
    href: "/paciente",
    nk: null,
  },
  {
    id: "observador",
    slug: "observador",
    name: "Observador",
    description: "Solo lectura agregada; módulos según tipo de organización.",
    href: "/observador",
    nk: null,
  },
  {
    id: "cuidador",
    slug: "cuidador",
    name: "Cuidadora / familiar",
    description: "Acompañamiento familiar y alertas del paciente vinculado.",
    href: "/cuidador",
    nk: null,
  },
];

// SPEC-05 FR-05.1 (S-4): sin clave por defecto en el código.
if (!process.env.SEED_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD.length < 12) {
  console.error("Falta SEED_ADMIN_PASSWORD (12 caracteres o más). No se crea la cuenta admin.");
  process.exit(1);
}

const ADMIN = {
  id: "admin",
  email: process.env.SEED_ADMIN_EMAIL || "admin+prueba@quintia.com",
  password: process.env.SEED_ADMIN_PASSWORD,
  name: "Administrador QUINTIA",
  roleId: "admin",
  role: "Administrador",
  org: "Programa QUINTIA",
  terr: "Todos",
  status: "Activo",
  contact: process.env.SEED_ADMIN_EMAIL || "admin+prueba@quintia.com",
};

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  console.log("DB:", db.databaseName);

  // Colección roles + índices
  const rolesCol = db.collection("roles");
  await rolesCol.createIndex({ id: 1 }, { unique: true, name: "roles_id_unique" });
  await rolesCol.createIndex({ slug: 1 }, { unique: true, name: "roles_slug_unique" });

  for (const role of ROLES) {
    await rolesCol.updateOne(
      { id: role.id },
      {
        $set: { ...role, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    console.log("  rol:", role.id, "→", role.name);
  }

  // Cuentas
  const accounts = db.collection("accounts");
  await accounts.createIndex({ id: 1 }, { unique: true, name: "accounts_id_unique" });
  await accounts.createIndex({ email: 1 }, { unique: true, sparse: true, name: "accounts_email_unique" });
  await accounts.createIndex({ roleId: 1 }, { name: "accounts_roleId" });

  const passwordHash = await bcrypt.hash(ADMIN.password, 10);
  const now = new Date();
  await accounts.updateOne(
    { id: ADMIN.id },
    {
      $set: {
        email: ADMIN.email,
        passwordHash,
        name: ADMIN.name,
        roleId: ADMIN.roleId,
        role: ADMIN.role,
        org: ADMIN.org,
        terr: ADMIN.terr,
        status: ADMIN.status,
        contact: ADMIN.contact,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  await db.collection("login_attempts").createIndex({ key: 1 }, { unique: true, name: "login_attempts_key_unique" });
  console.log("\nAdministrador listo");
  console.log("  colección: accounts");
  console.log("  id:       ", ADMIN.id);
  console.log("  correo:   ", ADMIN.email);
  console.log("  clave:    ", process.env.SEED_ADMIN_PASSWORD ? "(definida en SEED_ADMIN_PASSWORD)" : "(por defecto; defina SEED_ADMIN_PASSWORD)");
  console.log("  roleId:   ", ADMIN.roleId, "(colección roles)");
  console.log("  roles:    ", ROLES.length, "documentos en colección roles");

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
