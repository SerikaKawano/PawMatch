import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type CachedConnection = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = global as typeof globalThis & { mongooseCache?: CachedConnection };
const cache = globalWithMongoose.mongooseCache ?? { conn: null, promise: null };
globalWithMongoose.mongooseCache = cache;

export function isDatabaseConfigured() {
  return Boolean(MONGODB_URI);
}

export async function connectDatabase() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(MONGODB_URI, { dbName: "pawmatch" });
  cache.conn = await cache.promise;
  return cache.conn;
}
