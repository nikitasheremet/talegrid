import { connectDB } from "./db";
import { Universe, Table, TableRow } from "./models";
import type { IUniverse, ITable, ITableRow, IAttributeValue } from "./models";
import { Types } from "mongoose";
import {
  DEFAULT_LINK_DISPLAY_FIELD,
  LINK_COLUMN_TYPE,
  MINIMUM_REMAINING_COLUMNS,
  SELF_LINK_TARGET_TABLE,
} from "./table-utils";

const EMPTY_LINK_VALUES: string[] = [];
const ATTRIBUTE_PATH_PREFIX = "attributes.";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeId(value: string | Types.ObjectId): string {
  return value instanceof Types.ObjectId ? value.toString() : value;
}

function isObjectIdString(value: string): boolean {
  return Types.ObjectId.isValid(value);
}

function createDefaultAttribute(type: string): IAttributeValue {
  if (type === LINK_COLUMN_TYPE) {
    return {
      type,
      value: [...EMPTY_LINK_VALUES],
    };
  }

  return {
    type,
    value: "",
  };
}

function getNormalizedLinkValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function getUniqueNormalizedColumnNames(columnNames: string[]): string[] {
  const normalizedByKey = new Map<string, string>();

  for (const columnName of columnNames) {
    const normalizedColumnName = columnName.trim();
    if (!normalizedColumnName) continue;

    const normalizedKey = normalizedColumnName.toLowerCase();
    if (!normalizedByKey.has(normalizedKey)) {
      normalizedByKey.set(normalizedKey, normalizedColumnName);
    }
  }

  return Array.from(normalizedByKey.values());
}

function createAttributeUnsetPayload(columnNames: string[]): Record<string, 1> {
  const unsetPayload: Record<string, 1> = {};

  for (const columnName of columnNames) {
    unsetPayload[`${ATTRIBUTE_PATH_PREFIX}${columnName}`] = 1;
  }

  return unsetPayload;
}

async function normalizeColumnsForPersistence(
  universeId: Types.ObjectId,
  columns: Array<{
    name: string;
    type: string;
    targetTableId?: string | Types.ObjectId;
    displayField?: string;
  }>,
  selfTableId?: Types.ObjectId,
  selfTableFieldNames: string[] = [],
): Promise<
  Array<{
    name: string;
    type: string;
    targetTableId?: Types.ObjectId;
    displayField?: string;
  }>
> {
  const normalizedColumns: Array<{
    name: string;
    type: string;
    targetTableId?: Types.ObjectId;
    displayField?: string;
  }> = [];

  for (const column of columns) {
    const normalizedName = column.name.trim();
    const normalizedType = column.type.trim();

    if (!normalizedName || !normalizedType) continue;

    if (normalizedType !== LINK_COLUMN_TYPE) {
      normalizedColumns.push({ name: normalizedName, type: normalizedType });
      continue;
    }

    const targetTableValue =
      typeof column.targetTableId === "string"
        ? column.targetTableId.trim()
        : column.targetTableId?.toString();
    if (!targetTableValue) {
      continue;
    }

    const targetTableId =
      targetTableValue === SELF_LINK_TARGET_TABLE
        ? selfTableId?.toString()
        : targetTableValue;

    if (!targetTableId || !isObjectIdString(targetTableId)) {
      continue;
    }

    const normalizedDisplayField =
      column.displayField?.trim() || DEFAULT_LINK_DISPLAY_FIELD;

    const isSelfTarget =
      typeof selfTableId !== "undefined" &&
      targetTableId === selfTableId.toString();

    if (isSelfTarget) {
      const selfFields = new Set([
        DEFAULT_LINK_DISPLAY_FIELD,
        ...selfTableFieldNames,
        ...columns.map((entry) => entry.name.trim()).filter(Boolean),
      ]);
      const fallbackDisplayField = selfFields.has(DEFAULT_LINK_DISPLAY_FIELD)
        ? DEFAULT_LINK_DISPLAY_FIELD
        : (Array.from(selfFields)[0] ?? DEFAULT_LINK_DISPLAY_FIELD);

      normalizedColumns.push({
        name: normalizedName,
        type: normalizedType,
        targetTableId: new Types.ObjectId(targetTableId),
        displayField: selfFields.has(normalizedDisplayField)
          ? normalizedDisplayField
          : fallbackDisplayField,
      });
      continue;
    }

    const targetTable = await Table.findOne({
      _id: targetTableId,
      universeId,
    })
      .lean()
      .exec();

    if (!targetTable) continue;

    const targetFieldNames = new Set(
      targetTable.columns.map((entry: { name: string }) => entry.name),
    );
    const fallbackDisplayField = targetFieldNames.has(
      DEFAULT_LINK_DISPLAY_FIELD,
    )
      ? DEFAULT_LINK_DISPLAY_FIELD
      : (targetTable.columns[0]?.name ?? DEFAULT_LINK_DISPLAY_FIELD);

    normalizedColumns.push({
      name: normalizedName,
      type: normalizedType,
      targetTableId: new Types.ObjectId(targetTableId),
      displayField: targetFieldNames.has(normalizedDisplayField)
        ? normalizedDisplayField
        : fallbackDisplayField,
    });
  }

  return normalizedColumns;
}

async function validateLinkCellValues(
  table: ITable,
  attributes: Record<string, IAttributeValue>,
): Promise<Record<string, IAttributeValue>> {
  const normalizedAttributes = { ...attributes };
  const linkColumns = table.columns.filter(
    (column) =>
      column.type === LINK_COLUMN_TYPE &&
      typeof column.targetTableId !== "undefined",
  );

  for (const linkColumn of linkColumns) {
    const targetTableId =
      typeof linkColumn.targetTableId === "string"
        ? linkColumn.targetTableId
        : linkColumn.targetTableId?.toString();

    const cell = normalizedAttributes[linkColumn.name] ?? {
      type: LINK_COLUMN_TYPE,
      value: EMPTY_LINK_VALUES,
    };

    const requestedIds = getNormalizedLinkValues(cell.value);
    if (!targetTableId || requestedIds.length === 0) {
      normalizedAttributes[linkColumn.name] = {
        type: LINK_COLUMN_TYPE,
        value: [...EMPTY_LINK_VALUES],
      };
      continue;
    }

    const validRows = await TableRow.find({
      _id: { $in: requestedIds },
      tableId: targetTableId,
    })
      .select("_id")
      .lean()
      .exec();

    const validRowIds = new Set(validRows.map((row) => row._id.toString()));
    const filteredRowIds = requestedIds.filter((id) => validRowIds.has(id));

    normalizedAttributes[linkColumn.name] = {
      type: LINK_COLUMN_TYPE,
      value: filteredRowIds,
    };
  }

  return normalizedAttributes;
}

async function nullifyDeletedRowReferences(
  tableId: string | Types.ObjectId,
  deletedRowId: string | Types.ObjectId,
) {
  const normalizedTableId = normalizeId(tableId);
  const normalizedDeletedRowId = normalizeId(deletedRowId);
  const sourceTable = await Table.findById(normalizedTableId).lean().exec();
  if (!sourceTable) return;

  const linkedTables = await Table.find({
    universeId: sourceTable.universeId,
    columns: {
      $elemMatch: {
        type: LINK_COLUMN_TYPE,
        targetTableId: new Types.ObjectId(normalizedTableId),
      },
    },
  })
    .lean()
    .exec();

  for (const linkedTable of linkedTables) {
    const linkColumnNames = linkedTable.columns
      .filter(
        (column: {
          name: string;
          type: string;
          targetTableId?: string | Types.ObjectId;
        }) => {
          const targetTableId =
            typeof column.targetTableId === "string"
              ? column.targetTableId
              : column.targetTableId?.toString();

          return (
            column.type === LINK_COLUMN_TYPE &&
            targetTableId === normalizedTableId
          );
        },
      )
      .map(
        (column: {
          name: string;
          type: string;
          targetTableId?: string | Types.ObjectId;
        }) => column.name,
      );

    if (linkColumnNames.length === 0) continue;

    const linkedRows = await TableRow.find({ tableId: linkedTable._id }).exec();

    for (const linkedRow of linkedRows) {
      const attributes = { ...(linkedRow.attributes ?? {}) };
      let didChange = false;

      for (const columnName of linkColumnNames) {
        const currentCell = attributes[columnName];
        if (!currentCell) continue;

        const currentIds = getNormalizedLinkValues(currentCell.value);
        const nextIds = currentIds.filter(
          (id) => id !== normalizedDeletedRowId,
        );
        if (nextIds.length === currentIds.length) continue;

        attributes[columnName] = {
          type: LINK_COLUMN_TYPE,
          value: nextIds,
        };
        didChange = true;
      }

      if (!didChange) continue;

      await TableRow.findByIdAndUpdate(
        linkedRow._id,
        { attributes },
        { new: false },
      ).exec();
    }
  }
}

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

export async function createUniverseIfNotExists(
  name: string,
): Promise<{ created: boolean }> {
  await connectDB();

  const normalizedName = name.trim();
  if (!normalizedName) {
    return { created: false };
  }

  const existingUniverse = await Universe.findOne({
    name: {
      $regex: `^${escapeRegex(normalizedName)}$`,
      $options: "i",
    },
  })
    .select("_id")
    .lean()
    .exec();

  if (existingUniverse) {
    return { created: false };
  }

  await createUniverse(normalizedName);
  return { created: true };
}

// Create a new table
export async function createTable(
  universeName: string,
  tableName: string,
  columns: Array<{
    name: string;
    type: string;
    targetTableId?: string | Types.ObjectId;
    displayField?: string;
  }>,
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

  const newTableId = new Types.ObjectId();
  const normalizedColumns = await normalizeColumnsForPersistence(
    universe._id,
    columns,
    newTableId,
    [DEFAULT_LINK_DISPLAY_FIELD],
  );

  const table = new Table({
    _id: newTableId,
    name: normalizedTableName,
    universeId: universe._id,
    columns: normalizedColumns,
  });
  return table.save();
}

export async function addColumnToTable(
  tableId: string | Types.ObjectId,
  column: {
    name: string;
    type: string;
    targetTableId?: string | Types.ObjectId;
    displayField?: string;
  },
): Promise<ITable | null> {
  await connectDB();

  const table = await Table.findById(tableId).exec();
  if (!table) return null;

  const normalizedColumns = await normalizeColumnsForPersistence(
    table.universeId,
    [column],
    table._id,
    table.columns.map((tableColumn: { name: string }) => tableColumn.name),
  );

  const [normalizedColumn] = normalizedColumns;
  if (!normalizedColumn) return table.toObject();

  const alreadyExists = table.columns.some(
    (tableColumn: { name: string }) =>
      tableColumn.name.toLowerCase() === normalizedColumn.name.toLowerCase(),
  );

  if (alreadyExists) {
    return table.toObject();
  }

  table.columns.push(normalizedColumn);
  const updatedTable = await table.save();

  const rowAttributeValue = createDefaultAttribute(normalizedColumn.type);
  const rows = await TableRow.find({ tableId: table._id }).exec();

  for (const row of rows) {
    const attributes = { ...(row.attributes ?? {}) };
    if (attributes[normalizedColumn.name]) {
      continue;
    }

    attributes[normalizedColumn.name] = rowAttributeValue;
    await TableRow.findByIdAndUpdate(
      row._id,
      { attributes },
      { new: false },
    ).exec();
  }

  return updatedTable.toObject();
}

export async function deleteColumnsFromTable(
  tableId: string | Types.ObjectId,
  columnNames: string[],
): Promise<ITable | null> {
  await connectDB();

  const table = await Table.findById(tableId).exec();
  if (!table) return null;

  const normalizedColumnNames = getUniqueNormalizedColumnNames(columnNames);
  if (normalizedColumnNames.length === 0) {
    return table.toObject();
  }

  const selectedColumnNameSet = new Set(
    normalizedColumnNames.map((columnName) => columnName.toLowerCase()),
  );

  const columnsToDelete = table.columns
    .filter((column: { name: string }) =>
      selectedColumnNameSet.has(column.name.toLowerCase()),
    )
    .map((column: { name: string }) => column.name);

  if (columnsToDelete.length === 0) {
    return table.toObject();
  }

  const remainingColumns = table.columns.filter(
    (column: { name: string }) =>
      !selectedColumnNameSet.has(column.name.toLowerCase()),
  );

  if (remainingColumns.length < MINIMUM_REMAINING_COLUMNS) {
    throw new Error("A table must keep at least one column.");
  }

  table.columns = remainingColumns;
  const updatedTable = await table.save();

  const unsetPayload = createAttributeUnsetPayload(columnsToDelete);
  if (Object.keys(unsetPayload).length > 0) {
    await TableRow.updateMany(
      { tableId: table._id },
      { $unset: unsetPayload },
    ).exec();
  }

  // Intentionally non-blocking for external link displayField references.
  // If another table points to a removed display field, link labels may fallback to row id.
  return updatedTable.toObject();
}

// Create a new table row
export async function createTableRow(
  tableId: string | Types.ObjectId,
  attributes: Record<string, IAttributeValue>,
): Promise<ITableRow> {
  await connectDB();

  const table = await Table.findById(tableId).lean().exec();
  if (!table) {
    throw new Error("Table not found");
  }

  const validatedAttributes = await validateLinkCellValues(table, attributes);

  const row = new TableRow({
    tableId,
    attributes: validatedAttributes,
  });
  return row.save();
}

// Update a table row
export async function updateTableRow(
  rowId: string | Types.ObjectId,
  attributes: Record<string, IAttributeValue>,
): Promise<ITableRow | null> {
  await connectDB();

  const existingRow = await TableRow.findById(rowId).lean().exec();
  if (!existingRow) return null;

  const table = await Table.findById(existingRow.tableId).lean().exec();
  if (!table) return null;

  const validatedAttributes = await validateLinkCellValues(table, attributes);

  return TableRow.findByIdAndUpdate(
    rowId,
    { attributes: validatedAttributes },
    { new: true },
  )
    .lean()
    .exec();
}

// Delete a table row
export async function deleteTableRow(
  rowId: string | Types.ObjectId,
): Promise<ITableRow | null> {
  await connectDB();

  const row = await TableRow.findById(rowId).lean().exec();
  if (!row) return null;

  await nullifyDeletedRowReferences(row.tableId, rowId);
  return TableRow.findByIdAndDelete(rowId).lean().exec();
}
