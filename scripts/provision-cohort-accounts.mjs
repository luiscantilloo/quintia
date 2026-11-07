/**
 * Alinea la cohorte migrada:
 * - Quita perfil (P01…) hasta el cuestionario de campo
 * - Crea/actualiza territorios y un experto por territorio
 * - Crea cuenta Paciente por cada persona (credenciales)
 * - Escribe en Descargas/nara-data/credenciales-cohorte.xlsx (+ .csv / .md)
 *
 * Uso: node scripts/provision-cohort-accounts.mjs
 */
import { config } from "dotenv";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { resolve, dirname, join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { mkdirSync, writeFileSync } from "fs";
import ExcelJS from "exceljs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

const OUT_DIR =
  process.env.NARA_DATA_DIR ||
  join(homedir(), "Downloads", "nara-data");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nara";
const DEFAULT_MODULES = ["mood", "ia", "cursos", "videos", "tech", "hist"];

function slugEmail(code, email) {
  const e = String(email || "").trim().toLowerCase();
  if (e && /@/.test(e) && !e.includes(" ")) return e;
  const local = String(code || "sin-codigo")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${local}@pacientes.nara.local`;
}

function passwordFor(code) {
  return `Nara-${String(code || "TMP").replace(/\s+/g, "")}`;
}

function phoneForExpert(i) {
  const n = String(3000000000 + i).slice(0, 10);
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

async function main() {
  if (!uri) {
    console.error("Falta MONGODB_URI");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date();

  const people = await db.collection("people").find({}).toArray();
  console.log("Personas en people:", people.length);
  if (!people.length) {
    console.error("No hay personas. Corra primero migrate-patients-xlsx.mjs");
    process.exit(1);
  }

  // 1) Quitar perfil de clasificación
  const clearPeople = await db.collection("people").updateMany(
    {},
    { $set: { profile: null, updatedAt: now } },
  );
  const clearPatients = await db.collection("patients").updateMany(
    {},
    { $set: { profile: null, updatedAt: now } },
  );
  console.log("Perfiles limpiados — people:", clearPeople.modifiedCount, "patients:", clearPatients.modifiedCount);

  // Normalizar territorio vacío → "Sin territorio"
  for (const p of people) {
    if (!String(p.terr || "").trim()) {
      p.terr = "Sin territorio";
      await db.collection("people").updateOne({ id: p.id }, { $set: { terr: "Sin territorio", updatedAt: now } });
    }
  }

  // 2) Territorios desde las personas
  const terrNames = [...new Set(people.map((p) => String(p.terr || "").trim()).filter(Boolean))];
  for (const name of terrNames) {
    const inTerr = people.filter((p) => p.terr === name);
    await db.collection("territories").updateOne(
      { name },
      {
        $set: {
          name,
          dep: String(inTerr[0]?.departamento || inTerr[0]?.place || "").split(",").pop()?.trim() || "",
          level: "Municipio",
          goal: Math.max(inTerr.length, 50),
          cap: inTerr.length,
          rural: 0,
          ruralG: 40,
          sixty: 0,
          sixtyG: 20,
          br: 0,
          brA: 0,
          brD: 0,
          brAv: 0,
          experts: 1,
          places: [...new Set(inTerr.map((p) => p.place).filter(Boolean))].slice(0, 40),
          content: ["PHQ-9 + capacidad digital (base)"],
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now, isNew: true },
      },
      { upsert: true },
    );
  }
  console.log("Territorios upsert:", terrNames.length);

  // 3) Un experto por territorio (+ cuenta)
  const expertByTerr = {};
  let ei = 0;
  for (const terr of terrNames) {
    ei += 1;
    const id = `exp-${terr.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}`;
    const name = `Experto ${terr}`;
    const phone = phoneForExpert(ei);
    const email = `${id}@expertos.nara.local`;
    const password = `Nara-Exp-${ei.toString().padStart(3, "0")}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const accountId = `u-${id}`;

    await db.collection("experts").updateOne(
      { id },
      {
        $set: {
          id,
          name,
          phone,
          terr,
          target: 9,
          today: 0,
          week: 0,
          training: "Pendiente",
          active: true,
          isNew: true,
          accountId,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    await db.collection("accounts").updateOne(
      { id: accountId },
      {
        $set: {
          id: accountId,
          name,
          email,
          contact: phone,
          role: "Experto de campo",
          roleId: "experto",
          terr,
          org: "Programa NARA",
          status: "Activo",
          passwordHash,
          created: true,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    expertByTerr[terr] = { id, name, email, password, phone, accountId };
  }
  console.log("Expertos:", Object.keys(expertByTerr).length);

  // 4) Cuentas paciente + enlace + asignación a experto del territorio
  const credRows = [
    ["tipo", "codigo", "nombre", "territorio", "vereda_barrio", "edad", "email", "password", "experto", "telefono_persona", "account_id", "patient_id"],
  ];
  const expertCredRows = [
    ["tipo", "territorio", "nombre", "email", "password", "telefono", "expert_id", "account_id"],
  ];
  for (const e of Object.values(expertByTerr)) {
    expertCredRows.push(["experto", e.name.replace(/^Experto /, ""), e.name, e.email, e.password, e.phone, e.id, e.accountId]);
  }

  let i = 0;
  for (const p of people) {
    i += 1;
    const code = String(p.code || p.id);
    const email = slugEmail(code, p.email);
    const password = passwordFor(code);
    const passwordHash = await bcrypt.hash(password, 10);
    const accountId = `u-pac-${String(p.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)}`;
    const expert = expertByTerr[p.terr] || null;

    await db.collection("accounts").updateOne(
      { id: accountId },
      {
        $set: {
          id: accountId,
          name: p.name || code,
          email,
          contact: p.phone || email,
          role: "Paciente",
          roleId: "paciente",
          terr: p.terr || "",
          org: "Programa NARA",
          status: "Activo",
          patientId: p.id,
          patientModules: DEFAULT_MODULES.slice(),
          passwordHash,
          created: true,
          profileReady: false,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    await db.collection("patients").updateOne(
      { id: p.id },
      {
        $set: {
          id: p.id,
          accountId,
          name: p.name,
          email,
          phone: p.phone || "",
          age: p.age || 0,
          place: p.place || "",
          terr: p.terr || "",
          profile: null,
          expert: expert?.name || "",
          expertId: expert?.id || null,
          modulesEnabled: DEFAULT_MODULES.slice(),
          modulesVisible: DEFAULT_MODULES.slice(),
          signal: "Pendiente de evaluación",
          updatedAt: now,
        },
        $setOnInsert: {
          phq: [],
          phqDates: [],
          clin: null,
          consent: true,
          ctx: { dano: 0, perdida: 0 },
          timeline: [],
          createdAt: now,
        },
      },
      { upsert: true },
    );

    await db.collection("people").updateOne(
      { id: p.id },
      {
        $set: {
          profile: null,
          email,
          expert: expert?.name || "",
          expertId: expert?.id || null,
          accountId,
          status: p.status || "Sin evaluación",
          updatedAt: now,
        },
      },
    );

    credRows.push([
      "paciente",
      code,
      p.name || "",
      p.terr || "",
      p.place || "",
      p.age ?? "",
      email,
      password,
      expert?.name || "",
      p.phone || "",
      accountId,
      p.id,
    ]);

    if (i % 50 === 0) console.log("  … pacientes", i);
  }

  const outDir = OUT_DIR;
  mkdirSync(outDir, { recursive: true });
  const xlsxPath = resolve(outDir, "credenciales-cohorte.xlsx");
  const csvPath = resolve(outDir, "credenciales-cohorte.csv");
  const mdPath = resolve(outDir, "credenciales-cohorte.md");

  const wb = new ExcelJS.Workbook();
  const addSheet = (name, rows) => {
    const ws = wb.addWorksheet(name);
    rows.forEach((r) => ws.addRow(r));
  };
  addSheet("Pacientes", credRows);
  addSheet("Expertos", expertCredRows);
  await wb.xlsx.writeFile(xlsxPath);

  const csv = "\ufeff" + credRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  writeFileSync(csvPath, csv, "utf8");

  const md = [
    "# Credenciales cohorte NARA",
    "",
    "Generado automáticamente. Contraseñas de paciente: `Nara-{CODIGO}`.",
    "",
    "## Expertos (1 por territorio)",
    "",
    "| Territorio | Nombre | Email | Password | Teléfono |",
    "|---|---|---|---|---|",
    ...expertCredRows.slice(1).map((r) => `| ${r[1]} | ${r[2]} | ${r[3]} | \`${r[4]}\` | ${r[5]} |`),
    "",
    `## Pacientes (${credRows.length - 1})`,
    "",
    "Ver hoja completa en `credenciales-cohorte.xlsx` / `.csv`.",
    "",
    "| Código | Nombre | Territorio | Email | Password | Experto |",
    "|---|---|---|---|---|---|",
    ...credRows.slice(1, 21).map((r) => `| ${r[1]} | ${r[2]} | ${r[3]} | ${r[6]} | \`${r[7]}\` | ${r[8]} |`),
    "",
    credRows.length > 21 ? `_… y ${credRows.length - 21} más en el Excel._` : "",
    "",
  ].join("\n");
  writeFileSync(mdPath, md, "utf8");

  console.log("Listo.");
  console.log("  ", xlsxPath);
  console.log("  ", csvPath);
  console.log("  ", mdPath);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
