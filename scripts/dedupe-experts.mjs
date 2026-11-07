/**
 * Depura la colección experts: un experto por territorio (normalizado),
 * prioriza nombres reales frente a «Experto {ciudad}».
 *
 * Uso: node scripts/dedupe-experts.mjs
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

function score(e) {
  let s = 0;
  const n = String(e.name || "");
  if (!/^experto\b/i.test(n)) s += 100;
  if (e.accountId && !String(e.accountId).startsWith("u-exp-")) s += 50;
  if (e.active !== false) s += 10;
  if (e.phone && !/^300 000/.test(String(e.phone))) s += 20;
  if (e.id && !String(e.id).startsWith("exp-")) s += 30;
  // Prefer accented / longer terr labels as canonical
  s += String(e.terr || "").length;
  return s;
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
  console.log("experts before:", all.length);

  const byTerr = new Map();
  for (const e of all) {
    const k = norm(e.terr) || "__noid__" + e.id;
    if (!byTerr.has(k)) byTerr.set(k, []);
    byTerr.get(k).push(e);
  }

  const keepIds = new Set();
  const remove = [];
  for (const [, group] of byTerr) {
    group.sort((a, b) => score(b) - score(a) || String(a.id).localeCompare(String(b.id)));
    keepIds.add(group[0].id);
    for (let i = 1; i < group.length; i++) remove.push(group[i]);
  }

  const remMap = new Map(remove.map((e) => [e.id, e]));
  const toRemove = [...remMap.values()].filter((e) => !keepIds.has(e.id));
  console.log("keep:", keepIds.size, "remove:", toRemove.length);
  for (const e of toRemove) console.log("  -", e.name, "@", e.terr, "(" + e.id + ")");

  let peopleMoved = 0;
  for (const e of toRemove) {
    const k = norm(e.terr);
    const kept = all.find((x) => keepIds.has(x.id) && norm(x.terr) === k);
    if (!kept) continue;
    const r = await people.updateMany(
      { $or: [{ expertId: e.id }, { expertId: e.accountId }, { expert: e.name }] },
      {
        $set: {
          expertId: kept.accountId || kept.id,
          expert: kept.name,
          updatedAt: new Date(),
        },
      },
    );
    peopleMoved += r.modifiedCount || 0;
  }

  const remIds = toRemove.map((e) => e.id);
  const remAccounts = toRemove.map((e) => e.accountId).filter(Boolean);
  const delExp = await experts.deleteMany({ id: { $in: remIds } });
  const delAcc = remAccounts.length
    ? await accounts.deleteMany({ id: { $in: remAccounts }, roleId: "experto" })
    : { deletedCount: 0 };

  for (const t of await territories.find({}).toArray()) {
    const n = await experts.countDocuments({ terr: t.name, active: { $ne: false } });
    await territories.updateOne({ _id: t._id }, { $set: { experts: n } });
  }

  console.log("deleted experts:", delExp.deletedCount);
  console.log("deleted accounts:", delAcc.deletedCount);
  console.log("people reassigned:", peopleMoved);
  console.log("experts after:", await experts.countDocuments());
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
