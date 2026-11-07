/**
 * Migra pacientes desde el Excel de Salud Mental → MongoDB (patients + people).
 *
 * Uso:
 *   node scripts/migrate-patients-xlsx.mjs
 *   node scripts/migrate-patients-xlsx.mjs "C:\ruta\archivo.xlsx"
 *   node scripts/migrate-patients-xlsx.mjs --sample-15
 *     → solo 15 filas representativas (P01–P15), no todo el histórico.
 */
import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { resolve, dirname, join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import ExcelJS from "exceljs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nara";

const NARA_DATA =
  process.env.NARA_DATA_DIR || join(homedir(), "Downloads", "nara-data");

const DEFAULT_MODULES = ["mood", "ia", "cursos", "videos", "tech", "hist"];

function slugId(legacyId) {
  return `sm-${String(legacyId).trim()}`;
}

function titleCaseMun(s) {
  const t = String(s || "").trim();
  if (!t) return "";
  return t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

async function parseRows(filePath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("El Excel no tiene hojas.");
  const aoa = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const vals = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      vals[colNumber - 1] =
        cell.value != null && typeof cell.value === "object" && "text" in cell.value
          ? cell.value.text
          : cell.value instanceof Date
            ? cell.value
            : cell.value;
    });
    aoa.push(vals);
  });
  const hi = aoa.findIndex((r) => r && String(r[0]).trim() === "ID");
  if (hi < 0) throw new Error("No se encontró la fila de encabezados (ID).");
  const headers = aoa[hi].map((h) => String(h || "").trim());
  return aoa
    .slice(hi + 1)
    .filter((r) => r && r[0] != null && String(r[0]).trim() !== "")
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? null])));
}

function mapRow(row) {
  const legacyId = String(row.ID).trim();
  const id = slugId(legacyId);
  const name = String(row["Nombre Completo"] || "").trim() || `Paciente ${legacyId}`;
  const email = String(row.EMAIL || "")
    .trim()
    .toLowerCase();
  const phone = String(row.Telefono || "")
    .replace(/\D/g, "")
    .replace(/^(\d{10})$/, "$1");
  const age = Number(row.Edad) || 0;
  const dep = String(row.Departamento || "").trim();
  const mun = titleCaseMun(row["Municipio Residencia"]);
  const place = [mun, dep].filter(Boolean).join(", ");
  const terr = mun || dep || "Sin territorio";
  const registeredAt = row["Fecha de Registro"] ? new Date(row["Fecha de Registro"]) : null;

  return {
    id,
    legacyId,
    name,
    email,
    phone: phone || "",
    age,
    place,
    terr,
    departamento: dep,
    municipio: mun,
    sexo: String(row.Sexo || "").trim(),
    genero: String(row["Identidad de Genero"] || "").trim(),
    estadoCivil: String(row["Estado Civil"] || "").trim(),
    estrato: String(row.Estrato || "").trim(),
    registeredAt: registeredAt && !Number.isNaN(registeredAt.getTime()) ? registeredAt : null,
    autodiagnostico: row["Registrado Para Autodiagnostico"] ?? null,
  };
}

async function main() {
  if (!uri) {
    console.error("Falta MONGODB_URI en .env.local");
    process.exit(1);
  }

  const argPath = process.argv.slice(2).find((a) => a && !a.startsWith("--"));
  const candidates = [
    argPath,
    resolve(NARA_DATA, "Base De Datos Web Salud Mental - 24 Junio 2022.xlsx"),
    join(homedir(), "Downloads", "Base De Datos Web Salud Mental - 24 Junio 2022.xlsx"),
  ].filter(Boolean);

  const filePath = candidates.find((p) => existsSync(p));
  if (!filePath) {
    console.error("No se encontró el Excel. Pase la ruta como argumento.");
    process.exit(1);
  }

  const sample15 = process.argv.includes("--sample-15");
  console.log("Excel:", filePath);
  let rows = await parseRows(filePath);
  console.log("Filas:", rows.length);
  if (sample15) {
    rows = rows.slice(0, 15);
    console.log("Modo --sample-15: solo", rows.length, "perfiles representativos P01–P15");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const patients = db.collection("patients");
  const people = db.collection("people");
  const now = new Date();

  let upserted = 0;
  let skipped = 0;
  let profileIdx = 0;

  for (const raw of rows) {
    const m = mapRow(raw);
    if (!m.name) {
      skipped++;
      continue;
    }

    const profile = sample15
      ? "P" + String(Math.min(profileIdx + 1, 15)).padStart(2, "0")
      : "P01";
    profileIdx += 1;

    const patientDoc = {
      id: m.id,
      legacyId: m.legacyId,
      name: m.name,
      email: m.email,
      age: m.age,
      place: m.place,
      terr: m.terr,
      departamento: m.departamento,
      municipio: m.municipio,
      phone: m.phone,
      sexo: m.sexo,
      genero: m.genero,
      estadoCivil: m.estadoCivil,
      estrato: m.estrato,
      profile,
      phq: [],
      phqDates: [],
      expert: "",
      clin: null,
      next: "Primera llamada dentro de 7 días",
      nextShort: "Primera llamada",
      consent: true,
      signal: sample15 ? "Datos de prueba · 15 perfiles" : "Migrado",
      summary: null,
      adherence: null,
      sleep: null,
      braceletStatus: "",
      audios: 0,
      timeline: m.registeredAt
        ? [{ at: m.registeredAt.getTime(), text: "Registro en plataforma Salud Mental (2022)" }]
        : [],
      ctx: { dano: 0, perdida: 0 },
      modulesEnabled: DEFAULT_MODULES.slice(),
      modulesVisible: DEFAULT_MODULES.slice(),
      source: sample15 ? "xlsx-sample-15-profiles" : "xlsx-salud-mental-2022-06-24",
      registeredAt: m.registeredAt,
      autodiagnostico: m.autodiagnostico,
      updatedAt: now,
    };

    await patients.updateOne(
      { id: m.id },
      { $set: patientDoc, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );

    const pre = (m.municipio || m.departamento || "NAR").slice(0, 3).toUpperCase() || "NAR";
    const code = `${pre}-SM${m.legacyId}`;

    await people.updateOne(
      { id: m.id },
      {
        $set: {
          id: m.id,
          code,
          name: m.name,
          age: m.age,
          place: m.place,
          rural: false,
          terr: m.terr,
          profile,
          week: 0,
          weeks: 13,
          expert: "",
          expertId: null,
          status: "Sin evaluación",
          clin: null,
          phone: m.phone,
          email: m.email,
          source: sample15 ? "xlsx-sample-15-profiles" : "xlsx-salud-mental-2022-06-24",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    upserted++;
    if (upserted % 50 === 0) console.log("  …", upserted);
  }

  const total = await patients.countDocuments({ source: "xlsx-salud-mental-2022-06-24" });
  const sample = await patients
    .find({ source: "xlsx-salud-mental-2022-06-24" })
    .project({ id: 1, name: 1, place: 1, age: 1, email: 1, modulesEnabled: 1 })
    .limit(5)
    .toArray();

  console.log("\nListo");
  console.log("  upserted:", upserted, "skipped:", skipped);
  console.log("  patients con source migración:", total);
  console.log("  muestra:");
  for (const s of sample) {
    console.log("   -", s.id, "|", s.name, "|", s.place || "—", "| edad", s.age || "—");
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
