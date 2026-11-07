import type { Db } from "mongodb";
import { NARA_COLLECTIONS, defaultProgramSettings } from "./schema";

export type InitResult = {
  db: string;
  collections: string[];
  indexes: number;
  settings: "created" | "exists";
};

export async function initNaraSchema(db: Db): Promise<InitResult> {
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
  let indexes = 0;
  const collections: string[] = [];

  for (const col of NARA_COLLECTIONS) {
    if (!existing.has(col.name)) {
      await db.createCollection(col.name);
    }
    collections.push(col.name);
    const collection = db.collection(col.name);
    for (const idx of col.indexes) {
      await collection.createIndex(idx.key, idx.options || {});
      indexes += 1;
    }
  }

  const settings = db.collection("program_settings");
  const main = await settings.findOne({ key: "main" });
  let settingsStatus: "created" | "exists" = "exists";
  if (!main) {
    await settings.insertOne(defaultProgramSettings());
    settingsStatus = "created";
  }

  return {
    db: db.databaseName,
    collections,
    indexes,
    settings: settingsStatus,
  };
}
