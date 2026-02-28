import { connectDB } from "./db";
import { Universe, Table, TableRow } from "./models";
import type { IUniverse, ITable, ITableRow, IAttributeValue } from "./models";
import { Types } from "mongoose";

async function getUniverseDocumentByName(name: string) {
  await connectDB();
  return Universe.findOne({ name }).exec();
}

// Fetch all universes
export async function getAllUniverses(): Promise<IUniverse[]> {
  await connectDB();
  return Universe.find().lean().exec();
}

// Fetch a single universe by name
export async function getUniverseByName(
  name: string,
): Promise<IUniverse | null> {
  const universe = await getUniverseDocumentByName(name);
  return universe ? universe.toObject() : null;
}

// Fetch all tables for a universe
export async function getTablesByUniverseName(
  universeName: string,
): Promise<(ITable & { universeId: IUniverse })[]> {
  const universe = await getUniverseDocumentByName(universeName);
  if (!universe) return [];

  return Table.find({ universeId: universe._id })
    .populate("universeId")
    .lean()
    .exec();
}

// Fetch a single table by name and universe name
export async function getTableByNameAndUniverse(
  universeName: string,
  tableName: string,
): Promise<(ITable & { universeId: IUniverse }) | null> {
  const universe = await getUniverseDocumentByName(universeName);
  if (!universe) return null;

  return Table.findOne({ name: tableName, universeId: universe._id })
    .populate("universeId")
    .lean()
    .exec();
}

// Fetch all rows for a table
export async function getRowsByTableId(
  tableId: string | Types.ObjectId,
): Promise<ITableRow[]> {
  await connectDB();
  return TableRow.find({ tableId }).lean().exec();
}

// Create a new universe
export async function createUniverse(name: string): Promise<IUniverse> {
  await connectDB();
  const universe = new Universe({ name });
  return universe.save();
}

// Create a new table
export async function createTable(
  universeName: string,
  tableName: string,
  columns: Array<{ name: string; type: string }>,
): Promise<ITable | null> {
  const universe = await getUniverseDocumentByName(universeName);
  if (!universe) return null;

  const normalizedTableName = tableName.trim();
  if (!normalizedTableName) return null;

  const existingTable = await Table.findOne({
    name: normalizedTableName,
    universeId: universe._id,
  })
    .lean()
    .exec();

  if (existingTable) {
    return existingTable;
  }

  const table = new Table({
    name: normalizedTableName,
    universeId: universe._id,
    columns,
  });
  return table.save();
}

// Create a new table row
export async function createTableRow(
  tableId: string | Types.ObjectId,
  attributes: Record<string, IAttributeValue>,
): Promise<ITableRow> {
  await connectDB();
  const row = new TableRow({
    tableId,
    attributes,
  });
  return row.save();
}

// Update a table row
export async function updateTableRow(
  rowId: string | Types.ObjectId,
  attributes: Record<string, IAttributeValue>,
): Promise<ITableRow | null> {
  await connectDB();
  return TableRow.findByIdAndUpdate(rowId, { attributes }, { new: true })
    .lean()
    .exec();
}

// Delete a table row
export async function deleteTableRow(
  rowId: string | Types.ObjectId,
): Promise<ITableRow | null> {
  await connectDB();
  return TableRow.findByIdAndDelete(rowId).lean().exec();
}
