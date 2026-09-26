import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { connectDatabase, isDatabaseConfigured } from "./db";

const root = process.env.PAWMATCH_DATA_DIR ?? path.join(process.cwd(), ".pawmatch-data");
const globals = globalThis as typeof globalThis & { pawmatchWriteQueue?: Promise<unknown> };

export function storageLabel() { return isDatabaseConfigured() ? "MongoDB" : "このサーバーのローカル保存"; }
export async function readStore<T>(key: string, initial: () => T): Promise<T> {
  if (isDatabaseConfigured()) {
    const connection = await connectDatabase();
    const record = await connection.connection.collection("prototype_state").findOne({ _id: key as never });
    return record ? record.value as T : initial();
  }
  try { return JSON.parse(await readFile(path.join(root, key + ".json"), "utf8")) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return initial(); throw error; }
}

// Local mode supports one server process; MongoDB uses revision-based optimistic concurrency.
export async function mutateStore<T, R>(key: string, initial: () => T, mutate: (value: T) => R): Promise<R> {
  const run = async () => {
    if (isDatabaseConfigured()) {
      const connection = await connectDatabase();
      const collection = connection.connection.collection("prototype_state");
      for (let attempt = 0; attempt < 6; attempt++) {
        const record = await collection.findOne({ _id: key as never });
        const value = record ? structuredClone(record.value) as T : initial();
        const result = mutate(value);
        if (record) {
          const updated = await collection.updateOne({ _id: key as never, revision: record.revision }, { $set: { value }, $inc: { revision: 1 } });
          if (updated.modifiedCount) return result;
        } else {
          try { await collection.insertOne({ _id: key as never, revision: 1, value }); return result; }
          catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
        }
      }
      throw new Error("保存が競合しました。もう一度お試しください。");
    }
    const value = await readStore(key, initial);
    const result = mutate(value);
    await mkdir(root, { recursive: true });
    const temporary = path.join(root, key + "." + randomUUID() + ".tmp");
    try {
      await writeFile(temporary, JSON.stringify(value, null, 2), "utf8");
      await rename(temporary, path.join(root, key + ".json"));
    } finally {
      await unlink(temporary).catch(error => { if (error.code !== "ENOENT") throw error; });
    }
    return result;
  };
  const task = (globals.pawmatchWriteQueue ?? Promise.resolve()).then(run, run);
  globals.pawmatchWriteQueue = task.catch(() => undefined);
  return task;
}
