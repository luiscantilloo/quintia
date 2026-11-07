import { MongoClient, type Db } from "mongodb";

const dbName = process.env.MONGODB_DB || "nara";

declare global {
  // eslint-disable-next-line no-var
  var __naraMongoClient: MongoClient | undefined;
}

function getClient(): MongoClient {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Falta MONGODB_URI en el entorno (.env.local)");
  }
  if (!global.__naraMongoClient) {
    global.__naraMongoClient = new MongoClient(uri);
  }
  return global.__naraMongoClient;
}

export async function getDb(): Promise<Db> {
  const client = getClient();
  await client.connect();
  return client.db(dbName);
}

export async function pingDb(): Promise<{ ok: boolean; db: string }> {
  const db = await getDb();
  await db.command({ ping: 1 });
  return { ok: true, db: db.databaseName };
}
