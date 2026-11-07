import { config } from "dotenv";
import { MongoClient } from "mongodb";
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

/** @type {import('../src/lib/db/schema.ts').CollectionDef[]} — duplicado mínimo para ESM sin TS */
const COLLECTIONS = [
  { name: "roles", indexes: [{ key: { id: 1 }, options: { unique: true, name: "roles_id_unique" } }, { key: { slug: 1 }, options: { unique: true, name: "roles_slug_unique" } }] },
  { name: "accounts", indexes: [{ key: { id: 1 }, options: { unique: true, name: "accounts_id_unique" } }, { key: { role: 1, status: 1 }, options: { name: "accounts_role_status" } }, { key: { roleId: 1 }, options: { name: "accounts_roleId" } }, { key: { email: 1 }, options: { unique: true, sparse: true, name: "accounts_email_unique" } }] },
  { name: "territories", indexes: [{ key: { name: 1 }, options: { unique: true, name: "territories_name_unique" } }, { key: { dep: 1 }, options: { name: "territories_dep" } }] },
  { name: "experts", indexes: [{ key: { id: 1 }, options: { unique: true, name: "experts_id_unique" } }, { key: { terr: 1 }, options: { name: "experts_terr" } }, { key: { accountId: 1 }, options: { sparse: true, name: "experts_account" } }] },
  { name: "people", indexes: [{ key: { id: 1 }, options: { unique: true, name: "people_id_unique" } }, { key: { code: 1 }, options: { unique: true, sparse: true, name: "people_code_unique" } }, { key: { terr: 1 }, options: { name: "people_terr" } }, { key: { expertId: 1 }, options: { sparse: true, name: "people_expert" } }, { key: { profile: 1 }, options: { name: "people_profile" } }] },
  { name: "patients", indexes: [{ key: { id: 1 }, options: { unique: true, name: "patients_id_unique" } }, { key: { personId: 1 }, options: { sparse: true, name: "patients_person" } }, { key: { accountId: 1 }, options: { sparse: true, name: "patients_account" } }] },
  { name: "assets", indexes: [{ key: { id: 1 }, options: { unique: true, name: "assets_id_unique" } }, { key: { type: 1, status: 1 }, options: { name: "assets_type_status" } }, { key: { assignedTo: 1 }, options: { sparse: true, name: "assets_assigned" } }] },
  { name: "alerts", indexes: [{ key: { id: 1 }, options: { unique: true, name: "alerts_id_unique" } }, { key: { status: 1, sev: 1 }, options: { name: "alerts_status_sev" } }, { key: { expert: 1 }, options: { sparse: true, name: "alerts_expert" } }, { key: { at: -1 }, options: { name: "alerts_at" } }] },
  { name: "flags", indexes: [{ key: { id: 1 }, options: { unique: true, name: "flags_id_unique" } }, { key: { expert: 1, status: 1 }, options: { name: "flags_expert_status" } }, { key: { at: -1 }, options: { name: "flags_at" } }] },
  { name: "visits", indexes: [{ key: { id: 1 }, options: { unique: true, name: "visits_id_unique" } }, { key: { personId: 1, at: -1 }, options: { name: "visits_person_at" } }, { key: { expertId: 1, at: -1 }, options: { name: "visits_expert_at" } }] },
  { name: "worklists", indexes: [{ key: { expertId: 1, date: 1 }, options: { name: "worklists_expert_date" } }, { key: { personId: 1 }, options: { sparse: true, name: "worklists_person" } }] },
  { name: "revisits", indexes: [{ key: { expertId: 1, when: 1 }, options: { name: "revisits_expert_when" } }, { key: { personId: 1 }, options: { sparse: true, name: "revisits_person" } }] },
  { name: "group_sessions", indexes: [{ key: { expertId: 1, when: 1 }, options: { name: "group_sessions_expert_when" } }, { key: { terr: 1 }, options: { sparse: true, name: "group_sessions_terr" } }] },
  { name: "referrals", indexes: [{ key: { id: 1 }, options: { unique: true, name: "referrals_id_unique" } }, { key: { personId: 1 }, options: { name: "referrals_person" } }, { key: { institutionId: 1 }, options: { sparse: true, name: "referrals_inst" } }] },
  { name: "consents", indexes: [{ key: { personId: 1 }, options: { unique: true, name: "consents_person_unique" } }, { key: { at: -1 }, options: { name: "consents_at" } }] },
  { name: "notes", indexes: [{ key: { personId: 1, at: -1 }, options: { name: "notes_person_at" } }, { key: { authorId: 1 }, options: { sparse: true, name: "notes_author" } }] },
  { name: "path_requests", indexes: [{ key: { id: 1 }, options: { unique: true, name: "path_requests_id_unique" } }, { key: { status: 1, at: -1 }, options: { name: "path_requests_status_at" } }] },
  { name: "path_overrides", indexes: [{ key: { code: 1 }, options: { unique: true, name: "path_overrides_code_unique" } }] },
  { name: "caseload", indexes: [{ key: { id: 1 }, options: { unique: true, name: "caseload_id_unique" } }, { key: { clinicianId: 1 }, options: { sparse: true, name: "caseload_clinician" } }] },
  { name: "notifications", indexes: [{ key: { inbox: 1, at: -1 }, options: { name: "notifications_inbox_at" } }, { key: { read: 1 }, options: { name: "notifications_read" } }] },
  { name: "reports", indexes: [{ key: { id: 1 }, options: { unique: true, name: "reports_id_unique" } }, { key: { kind: 1, at: -1 }, options: { name: "reports_kind_at" } }] },
  { name: "custom_reports", indexes: [{ key: { id: 1 }, options: { unique: true, name: "custom_reports_id_unique" } }] },
  { name: "schedules", indexes: [{ key: { id: 1 }, options: { unique: true, name: "schedules_id_unique" } }, { key: { nextAt: 1 }, options: { sparse: true, name: "schedules_next" } }] },
  { name: "recursos", indexes: [{ key: { personId: 1 }, options: { unique: true, sparse: true, name: "recursos_person_unique" } }, { key: { course: 1 }, options: { sparse: true, name: "recursos_course" } }] },
  { name: "program_settings", indexes: [{ key: { key: 1 }, options: { unique: true, name: "program_settings_key_unique" } }] },
  { name: "activity_log", indexes: [{ key: { uid: 1, at: -1 }, options: { name: "activity_uid_at" } }, { key: { at: -1 }, options: { name: "activity_at" } }] },
  { name: "access_log", indexes: [{ key: { code: 1, at: -1 }, options: { name: "access_code_at" } }, { key: { at: -1 }, options: { name: "access_at" } }] },
  { name: "agent_log", indexes: [{ key: { role: 1, at: -1 }, options: { name: "agent_role_at" } }, { key: { at: -1 }, options: { name: "agent_at" } }] },
  { name: "ai_log", indexes: [{ key: { pid: 1, at: -1 }, options: { name: "ai_pid_at" } }, { key: { at: -1 }, options: { name: "ai_at" } }] },
  { name: "login_attempts", indexes: [{ key: { key: 1 }, options: { unique: true, name: "login_attempts_key_unique" } }] },
  { name: "worklist_items", indexes: [{ key: { expertId: 1, date: 1 }, options: { name: "worklist_items_expert_date" } }] },
  { name: "teo_conversations", indexes: [{ key: { personId: 1, at: -1 }, options: { name: "teo_conversations_person_at" } }] },
  { name: "crisis_events", indexes: [{ key: { at: -1 }, options: { name: "crisis_events_at" } }] },
  { name: "clin_solicitudes", indexes: [{ key: { id: 1 }, options: { unique: true, sparse: true, name: "clin_solicitudes_id" } }] },
  { name: "clin_citas", indexes: [{ key: { id: 1 }, options: { unique: true, sparse: true, name: "clin_citas_id" } }] },
  { name: "voice_sessions", indexes: [{ key: { at: -1 }, options: { name: "voice_sessions_at" } }] },
  { name: "whatsapp_messages", indexes: [{ key: { at: -1 }, options: { name: "whatsapp_messages_at" } }] },
  { name: "conversacion", indexes: [{ key: { personId: 1 }, options: { sparse: true, name: "conversacion_person" } }] },
  { name: "call_jobs", indexes: [{ key: { at: -1 }, options: { name: "call_jobs_at" } }] },
  { name: "evaluations", indexes: [{ key: { personId: 1 }, options: { sparse: true, name: "evaluations_person" } }] },
  { name: "protection_cases", indexes: [{ key: { id: 1 }, options: { unique: true, sparse: true, name: "protection_cases_id" } }] },
  { name: "inactivity_watch", indexes: [{ key: { personId: 1 }, options: { sparse: true, name: "inactivity_watch_person" } }] },
  { name: "caregivers", indexes: [{ key: { accountId: 1 }, options: { sparse: true, name: "caregivers_account" } }] },
];

const defaultSettings = {
  key: "main",
  v: 5,
  rules: {
    risk: [
      { k: "Mínimo", min: 0, max: 4, c: "#4E9A6B" },
      { k: "Leve", min: 5, max: 9, c: "#A3B13C" },
      { k: "Moderado", min: 10, max: 14, c: "#E0A526" },
      { k: "Moderado-severo", min: 15, max: 19, c: "#D9692B" },
      { k: "Severo", min: 20, max: 27, c: "#9C2F25" },
    ],
    dig: {
      cuts: [
        { k: "Baja", min: 0, max: 4 },
        { k: "Media", min: 5, max: 8 },
        { k: "Alta", min: 9, max: 11 },
      ],
    },
    auto: { expert: "vereda", clin: "carga", review: "Cada 4 semanas" },
    pending: null,
    versions: [{ v: 1, by: "Sistema", at: Date.now(), what: "Esquema inicial en MongoDB (colecciones vacías)." }],
  },
  weekBase: {},
  rejected: {},
  pendingSync: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function main() {
  const client = new MongoClient(uri);
  console.log("Conectando a", dbName, "…");
  await client.connect();
  const db = client.db(dbName);
  await db.command({ ping: 1 });
  console.log("Ping OK");

  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
  let indexCount = 0;

  for (const col of COLLECTIONS) {
    if (!existing.has(col.name)) {
      await db.createCollection(col.name);
      console.log("  + colección", col.name);
    } else {
      console.log("  · existe", col.name);
    }
    const collection = db.collection(col.name);
    for (const idx of col.indexes) {
      await collection.createIndex(idx.key, idx.options || {});
      indexCount += 1;
    }
  }

  const settings = db.collection("program_settings");
  const mainDoc = await settings.findOne({ key: "main" });
  if (!mainDoc) {
    await settings.insertOne(defaultSettings);
    console.log("  + program_settings.main");
  } else {
    console.log("  · program_settings.main ya existe");
  }

  console.log("\nListo:", COLLECTIONS.length, "colecciones,", indexCount, "índices.");
  await client.close();
}

main().catch((err) => {
  console.error("Error init DB:", err.message || err);
  process.exit(1);
});
