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

const OBS_TEMPLATES = {
  Financiador: ["avance", "recursos", "resultados"],
  Investigación: ["resultados", "datos"],
  "Institución de salud": ["casos"],
};

function requireEnv(name) {
  const v = String(process.env[name] || "").trim();
  if (!v) {
    console.error(`Falta ${name} en .env.local (sin valor por defecto).`);
    process.exit(1);
  }
  return v;
}

const users = [
  {
    id: "obs-salento",
    email: "observador@nara.com",
    password: requireEnv("SEED_OBS_SALENTO_PASSWORD"),
    name: "Hospital local de Salento",
    org: "Hospital local de Salento",
    orgType: "Institución de salud",
    terr: "Salento",
  },
  {
    id: "obs-financiador",
    email: "financiador@nara.com",
    password: requireEnv("SEED_OBS_FINANCIADOR_PASSWORD"),
    name: "Fundación NARA",
    org: "Fundación NARA",
    orgType: "Financiador",
    terr: "Todos",
  },
  {
    id: "obs-investigacion",
    email: "investigacion@nara.com",
    password: requireEnv("SEED_OBS_INVESTIGACION_PASSWORD"),
    name: "Centro de Investigación NARA",
    org: "Centro de Investigación NARA",
    orgType: "Investigación",
    terr: "Todos",
  },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("accounts");
  const now = new Date();

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const modules = OBS_TEMPLATES[u.orgType];
    await col.updateOne(
      { id: u.id },
      {
        $set: {
          id: u.id,
          email: u.email,
          contact: u.email,
          name: u.name,
          org: u.org,
          orgType: u.orgType,
          modules,
          role: "Observador",
          roleId: "observador",
          terr: u.terr,
          status: "Activo",
          passwordHash,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now, created: true },
      },
      { upsert: true },
    );
    console.log("OK", u.email, "→", u.orgType);
  }

  await client.close();

  console.log("\n--- Cuentas observador (contraseñas solo en env, no se imprimen) ---\n");
  for (const u of users) {
    console.log(`OK\t${u.email}\t${u.orgType}\t(password desde env)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
