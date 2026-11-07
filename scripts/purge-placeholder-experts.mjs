/**
 * Elimina expertos sintéticos «Experto {territorio}» y sus cuentas.
 * Reasigna personas al experto real del mismo territorio si existe;
 * si no, deja expert/expertId vacíos.
 *
 * Uso: node scripts/purge-placeholder-experts.mjs
 */
import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isPlaceholder(name) {
  return /^experto\b/i.test(String(name || "").trim());
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Falta MONGODB_URI");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "nara");
  const experts = db.collection("experts");
  const accounts = db.collection("accounts");
  const people = db.collection("people");
  const territories = db.collection("territories");

  const all = await experts.find({}).toArray();
  const keep = all.filter((e) => !isPlaceholder(e.name));
  const purge = all.filter((e) => isPlaceholder(e.name));
  console.log("experts total:", all.length, "keep:", keep.length, "purge:", purge.length);

  const keepByTerr = new Map();
  for (const e of keep) {
    const k = norm(e.terr);
    if (k && !keepByTerr.has(k)) keepByTerr.set(k, e);
  }

  let peopleReassigned = 0;
  let peopleCleared = 0;
  for (const e of purge) {
    const real = keepByTerr.get(norm(e.terr));
    if (real) {
      const r = await people.updateMany(
        {
          $or: [
            { expertId: e.id },
            { expertId: e.accountId },
            { expert: e.name },
          ],
        },
        {
          $set: {
            expertId: real.id,
            expert: real.name,
            updatedAt: new Date(),
          },
        },
      );
      peopleReassigned += r.modifiedCount || 0;
    } else {
      const r = await people.updateMany(
        {
          $or: [
            { expertId: e.id },
            { expertId: e.accountId },
            { expert: e.name },
          ],
        },
        {
          $set: {
            expertId: null,
            expert: "",
            updatedAt: new Date(),
          },
        },
      );
      peopleCleared += r.modifiedCount || 0;
    }
  }

  const remIds = purge.map((e) => e.id).filter(Boolean);
  const remAccounts = [
    ...new Set(purge.map((e) => e.accountId).filter(Boolean)),
  ];

  const delExp = remIds.length
    ? await experts.deleteMany({ id: { $in: remIds } })
    : { deletedCount: 0 };
  const delAcc = remAccounts.length
    ? await accounts.deleteMany({
        id: { $in: remAccounts },
        roleId: "experto",
      })
    : { deletedCount: 0 };

  for (const t of await territories.find({}).toArray()) {
    const n = await experts.countDocuments({
      terr: t.name,
      active: { $ne: false },
    });
    await territories.updateOne(
      { _id: t._id },
      { $set: { experts: n, updatedAt: new Date() } },
    );
  }

  // Índice único: un experto activo por territorio.
  try {
    await experts.dropIndex("experts_terr_unique");
  } catch {
    /* no existía */
  }
  await experts.createIndex(
    { terr: 1 },
    {
      unique: true,
      name: "experts_terr_unique",
      partialFilterExpression: {
        terr: { $exists: true, $type: "string" },
        active: true,
      },
    },
  );

  console.log("deleted experts:", delExp.deletedCount);
  console.log("deleted accounts:", delAcc.deletedCount);
  console.log("people reassigned:", peopleReassigned);
  console.log("people cleared:", peopleCleared);
  console.log("experts after:", await experts.countDocuments());
  for (const e of await experts.find({}).toArray()) {
    console.log("  ·", e.name, "@", e.terr);
  }
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
