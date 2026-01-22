import mongoose from "mongoose";
import { Universe, Table, TableRow } from "../lib/models";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/talegrid";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Universe.deleteMany({});
    await Table.deleteMany({});
    await TableRow.deleteMany({});
    console.log("Cleared existing data");

    // Create universes
    const wh40k = await Universe.create({
      name: "WH40K",
    });

    const wheelOfTime = await Universe.create({
      name: "Wheel of Time",
    });

    console.log("Created universes");

    // Create tables for WH40K
    const charactersTable = await Table.create({
      name: "Characters",
      universeId: wh40k._id,
      columns: [
        { name: "name", type: "text" },
        { name: "description", type: "longtext" },
      ],
    });

    const booksTable = await Table.create({
      name: "Books",
      universeId: wh40k._id,
      columns: [
        { name: "title", type: "text" },
        { name: "author", type: "text" },
      ],
    });

    // Create tables for Wheel of Time
    const wotCharactersTable = await Table.create({
      name: "Characters",
      universeId: wheelOfTime._id,
      columns: [
        { name: "name", type: "text" },
        { name: "description", type: "longtext" },
      ],
    });

    console.log("Created tables");

    // Create rows for WH40K Characters
    await TableRow.create([
      {
        tableId: charactersTable._id,
        attributes: {
          name: { type: "text", value: "Ibrahim Gauntz" },
          description: {
            type: "longtext",
            value: "Commisar in Imperial Guard",
          },
        },
      },
      {
        tableId: charactersTable._id,
        attributes: {
          name: { type: "text", value: "Space Marine" },
          description: { type: "longtext", value: "Soldier of Imperium" },
        },
      },
    ]);

    // Create rows for WH40K Books
    await TableRow.create([
      {
        tableId: booksTable._id,
        attributes: {
          title: { type: "text", value: "Horus Rising" },
          author: { type: "text", value: "Graham McNeill" },
        },
      },
    ]);

    // Create rows for Wheel of Time Characters
    await TableRow.create([
      {
        tableId: wotCharactersTable._id,
        attributes: {
          name: { type: "text", value: "Rand al'Thor" },
          description: { type: "longtext", value: "The Dragon Reborn" },
        },
      },
    ]);

    console.log("Created table rows");
    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
