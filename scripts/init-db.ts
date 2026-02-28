import mongoose from "mongoose";
import { Universe, Table, TableRow } from "../lib/models";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/talegrid";

async function ensureCollection(
  model: typeof Universe | typeof Table | typeof TableRow,
) {
  try {
    await model.createCollection();
    console.log(`Created collection: ${model.collection.collectionName}`);
  } catch (error: unknown) {
    const mongoError = error as { code?: number };

    // 48 = NamespaceExists (collection already exists)
    if (mongoError?.code === 48) {
      console.log(
        `Collection already exists: ${model.collection.collectionName}`,
      );
      return;
    }

    throw error;
  }
}

async function initDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    await ensureCollection(Universe);
    await ensureCollection(Table);
    await ensureCollection(TableRow);

    await Promise.all([
      Universe.createIndexes(),
      Table.createIndexes(),
      TableRow.createIndexes(),
    ]);

    console.log("Indexes ensured");
    console.log("Database initialization completed ✅");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void initDB();
