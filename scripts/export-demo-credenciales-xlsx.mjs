/**
 * Excel de credenciales demo NARA (tabla por rol) → Downloads/nara-data.
 */
import { config } from "dotenv";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { resolve, dirname, join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nara";
const outDir = join(homedir(), "Downloads", "nara-data");
const outFile = join(outDir, "credenciales-demo-nara.xlsx");

function requireEnv(name) {
  const v = String(process.env[name] || "").trim();
  if (!v) {
    console.error(`Falta ${name} en .env.local (sin valor por defecto).`);
    process.exit(1);
  }
  return v;
}

const DEMO_PATIENT = {
  id: "pac-gloria-patino",
  email: "gloria.patino@nara.com",
  password: requireEnv("SEED_DEMO_PATIENT_PASSWORD"),
  name: "Gloria Patiño",
  terr: "Salento",
  patientId: "p-gloria-patino",
};

const OBS_PASSWORDS = {
  salento: requireEnv("SEED_OBS_SALENTO_PASSWORD"),
  financiador: requireEnv("SEED_OBS_FINANCIADOR_PASSWORD"),
  investigacion: requireEnv("SEED_OBS_INVESTIGACION_PASSWORD"),
};

const EXPERT_DEMO_PASSWORD = requireEnv("SEED_DEMO_EXPERT_PASSWORD");
const CLINICO_DEMO_PASSWORD = requireEnv("SEED_DEMO_CLINICO_PASSWORD");

/** @type {Array<{ title: string; accent: string; rows: Array<[string, string]> }>} */
const SECTIONS = [
  {
    title: "Administrador",
    accent: "1B4D3E",
    rows: [
      ["Correo", "admin@nara.com"],
      ["Contraseña", "(la de SEED_ADMIN_PASSWORD; no se escribe aquí)"],
      ["Nombre", "Administrador NARA"],
      ["Rol", "Administrador"],
    ],
  },
  {
    title: "Experto de campo",
    accent: "2F6F4E",
    rows: [
      ["Correo", "camila.restrepo@nara.com"],
      ["Contraseña", EXPERT_DEMO_PASSWORD],
      ["Nombre", "Camila Restrepo Mejía"],
      ["Rol", "Experto de campo"],
      ["Territorio", "Salento"],
    ],
  },
  {
    title: "Clínico",
    accent: "3D6B8A",
    rows: [
      ["Correo", "lucia.marin@nara.com"],
      ["Contraseña", CLINICO_DEMO_PASSWORD],
      ["Nombre", "Dra. Lucía Marín"],
      ["Rol", "Clínico"],
      ["Territorio", "Quindío"],
    ],
  },
  {
    title: "Observador · Institución de salud",
    accent: "6B4E71",
    rows: [
      ["Correo", "observador@nara.com"],
      ["Contraseña", OBS_PASSWORDS.salento],
      ["Nombre", "Hospital local de Salento"],
      ["Rol", "Observador"],
      ["Tipo", "Institución de salud"],
      ["Organización", "Hospital local de Salento"],
    ],
  },
  {
    title: "Observador · Financiador",
    accent: "8A5A2F",
    rows: [
      ["Correo", "financiador@nara.com"],
      ["Contraseña", OBS_PASSWORDS.financiador],
      ["Nombre", "Fundación NARA"],
      ["Rol", "Observador"],
      ["Tipo", "Financiador"],
      ["Organización", "Fundación NARA"],
    ],
  },
  {
    title: "Observador · Investigación",
    accent: "4A6FA5",
    rows: [
      ["Correo", "investigacion@nara.com"],
      ["Contraseña", OBS_PASSWORDS.investigacion],
      ["Nombre", "Centro de Investigación NARA"],
      ["Rol", "Observador"],
      ["Tipo", "Investigación"],
      ["Organización", "Centro de Investigación NARA"],
    ],
  },
  {
    title: "Paciente",
    accent: "B85C38",
    rows: [
      ["Correo", DEMO_PATIENT.email],
      ["Contraseña", DEMO_PATIENT.password],
      ["Nombre", DEMO_PATIENT.name],
      ["Rol", "Paciente"],
      ["Territorio", DEMO_PATIENT.terr],
    ],
  },
];

async function ensurePatient(db) {
  const now = new Date();
  const passwordHash = await bcrypt.hash(DEMO_PATIENT.password, 10);
  await db.collection("accounts").updateOne(
    { id: DEMO_PATIENT.id },
    {
      $set: {
        id: DEMO_PATIENT.id,
        email: DEMO_PATIENT.email,
        contact: DEMO_PATIENT.email,
        name: DEMO_PATIENT.name,
        role: "Paciente",
        roleId: "paciente",
        terr: DEMO_PATIENT.terr,
        org: "Programa NARA",
        status: "Activo",
        patientId: DEMO_PATIENT.patientId,
        passwordHash,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now, created: true },
    },
    { upsert: true },
  );
  await db.collection("patients").updateOne(
    { id: DEMO_PATIENT.patientId },
    {
      $set: {
        id: DEMO_PATIENT.patientId,
        accountId: DEMO_PATIENT.id,
        name: DEMO_PATIENT.name,
        email: DEMO_PATIENT.email,
        terr: DEMO_PATIENT.terr,
        place: DEMO_PATIENT.terr,
        updatedAt: now,
      },
      $setOnInsert: {
        age: 58,
        profile: null,
        phq: [],
        phqDates: [],
        expert: "",
        clin: null,
        next: "Primera llamada dentro de 7 días",
        nextShort: "Primera llamada",
        consent: true,
        signal: "Pendiente de evaluación",
        ctx: { dano: 0, perdida: 0 },
        timeline: [],
        modulesEnabled: ["checkin", "recursos", "teo"],
        modulesVisible: ["checkin", "recursos", "teo"],
        createdAt: now,
      },
    },
    { upsert: true },
  );
  console.log("Paciente demo OK:", DEMO_PATIENT.email);
}

async function writeExcel() {
  mkdirSync(outDir, { recursive: true });
  const wb = new ExcelJS.Workbook();
  wb.creator = "NARA";
  wb.created = new Date();

  const ws = wb.addWorksheet("Credenciales", {
    properties: { defaultRowHeight: 22 },
    views: [{ showGridLines: false }],
  });
  ws.columns = [
    { key: "campo", width: 18 },
    { key: "valor", width: 42 },
  ];

  // Portada
  ws.mergeCells("A1:B1");
  const title = ws.getCell("A1");
  title.value = "NARA · Credenciales demo";
  title.font = { name: "Calibri", size: 20, bold: true, color: { argb: "FF1B4D3E" } };
  title.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 32;

  ws.mergeCells("A2:B2");
  const sub = ws.getCell("A2");
  sub.value = "Accesos de prueba · no usar en producción real";
  sub.font = { name: "Calibri", size: 11, italic: true, color: { argb: "FF6B7280" } };
  ws.getRow(2).height = 20;

  let row = 4;
  for (const section of SECTIONS) {
    ws.mergeCells(row, 1, row, 2);
    const h = ws.getCell(row, 1);
    h.value = section.title;
    h.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
    h.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${section.accent}` },
    };
    h.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(row).height = 26;
    row++;

    // header Campo | Valor
    const hdr = ws.getRow(row);
    hdr.values = ["Campo", "Valor"];
    hdr.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF374151" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F4F6" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
      cell.alignment = { vertical: "middle" };
    });
    hdr.height = 20;
    row++;

    for (const [campo, valor] of section.rows) {
      const r = ws.getRow(row);
      r.values = [campo, valor];
      r.getCell(1).font = { name: "Calibri", size: 11, color: { argb: "FF6B7280" } };
      r.getCell(2).font = {
        name: "Calibri",
        size: 11,
        bold: campo === "Contraseña" || campo === "Correo",
        color: { argb: "FF111827" },
      };
      r.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFF3F4F6" } },
          bottom: { style: "thin", color: { argb: "FFF3F4F6" } },
          left: { style: "thin", color: { argb: "FFF3F4F6" } },
          right: { style: "thin", color: { argb: "FFF3F4F6" } },
        };
        cell.alignment = { vertical: "middle" };
      });
      if (campo === "Contraseña") {
        r.getCell(2).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFECFDF5" },
        };
      }
      r.height = 22;
      row++;
    }
    row++; // espacio entre secciones
  }

  ws.mergeCells(row, 1, row, 2);
  const foot = ws.getCell(row, 1);
  foot.value = `Generado ${new Date().toLocaleString("es-CO")}`;
  foot.font = { name: "Calibri", size: 9, color: { argb: "FF9CA3AF" } };

  await wb.xlsx.writeFile(outFile);
  console.log("Excel:", outFile);
}

async function main() {
  if (!uri) {
    console.error("Falta MONGODB_URI");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  try {
    await ensurePatient(client.db(dbName));
  } finally {
    await client.close();
  }
  await writeExcel();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
