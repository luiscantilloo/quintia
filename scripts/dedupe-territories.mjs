/**
 * Elimina documentos duplicados en territories (mismo name).
 * Uso: node scripts/dedupe-territories.mjs
 */
import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "nara");
const cols = db.collection("territories");
const all = await cols.find({}).toArray();
const byName = new Map();
const remove = [];
for (const t of all) {
  const n = String(t.name || "").trim();
  if (!n) {
    remove.push(t._id);
    continue;
  }
  if (byName.has(n)) {
    remove.push(t._id);
  } else {
    byName.set(n, t._id);
  }
}
if (remove.length) {
  const r = await cols.deleteMany({ _id: { $in: remove } });
  console.log("Eliminados duplicados:", r.deletedCount, "· territorios únicos:", byName.size);
} else {
  console.log("Sin duplicados. Territorios:", byName.size || all.length);
}
await client.close();
