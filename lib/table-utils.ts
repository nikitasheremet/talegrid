import type { IColumn } from "@/lib/models";

export const DEFAULT_TABLE_COLUMNS: IColumn[] = [
  { name: "Name", type: "text" },
];
export const TABLE_COLUMN_TYPES = [
  "text",
  "longtext",
  "link",
  "number",
] as const;
export const LINK_COLUMN_TYPE = "link";
export const NUMBER_COLUMN_TYPE = "number";
export const SELF_LINK_TARGET_TABLE = "__self__";
export const DEFAULT_LINK_DISPLAY_FIELD = "Name";
export const MINIMUM_REMAINING_COLUMNS = 1;
export const DELETE_COLUMN_FORM_FIELD = "selectedColumnName";

export type TableColumnType = (typeof TABLE_COLUMN_TYPES)[number];

const STRICT_NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

export function normalizeTableName(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeUniverseName(
  value: FormDataEntryValue | null,
): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeColumnName(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function parseStrictNumberValue(
  value: unknown,
): { ok: true; value: number | null } | { ok: false } {
  if (value === null || typeof value === "undefined") {
    return { ok: true, value: null };
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { ok: false };
    return { ok: true, value };
  }

  if (typeof value !== "string") {
    return { ok: false };
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return { ok: true, value: null };
  }

  if (!STRICT_NUMBER_PATTERN.test(normalizedValue)) {
    return { ok: false };
  }

  const parsedValue = Number(normalizedValue);
  if (!Number.isFinite(parsedValue)) {
    return { ok: false };
  }

  return { ok: true, value: parsedValue };
}

export function parseSelectedColumnNamesFromFormData(
  formData: FormData,
  fieldName = DELETE_COLUMN_FORM_FIELD,
): string[] {
  const selectedNames = formData.getAll(fieldName);
  const uniqueColumnNames = new Map<string, string>();

  for (const value of selectedNames) {
    const normalizedName = normalizeColumnName(value);
    if (!normalizedName) continue;

    const normalizedKey = normalizedName.toLowerCase();
    if (!uniqueColumnNames.has(normalizedKey)) {
      uniqueColumnNames.set(normalizedKey, normalizedName);
    }
  }

  return Array.from(uniqueColumnNames.values());
}

function isTableColumnType(value: string): value is TableColumnType {
  return TABLE_COLUMN_TYPES.includes(value as TableColumnType);
}

function getTargetTableId(
  columnType: TableColumnType,
  targetTableValue: FormDataEntryValue | undefined,
): string | undefined {
  if (columnType !== LINK_COLUMN_TYPE) return undefined;
  if (typeof targetTableValue !== "string") return undefined;

  const normalizedTargetTableId = targetTableValue.trim();
  return normalizedTargetTableId.length > 0
    ? normalizedTargetTableId
    : undefined;
}

function getDisplayField(
  columnType: TableColumnType,
  displayFieldValue: FormDataEntryValue | undefined,
): string | undefined {
  if (columnType !== LINK_COLUMN_TYPE) return undefined;
  if (typeof displayFieldValue !== "string") {
    return DEFAULT_LINK_DISPLAY_FIELD;
  }

  const normalizedDisplayField = normalizeColumnName(displayFieldValue);
  return normalizedDisplayField || DEFAULT_LINK_DISPLAY_FIELD;
}

export function parseTableColumnsFromFormData(formData: FormData): IColumn[] {
  const columnNames = formData.getAll("columnName");
  const columnTypes = formData.getAll("columnType");
  const columnTargetTableIds = formData.getAll("columnTargetTableId");
  const columnDisplayFields = formData.getAll("columnDisplayField");

  const columns: IColumn[] = [];
  for (let index = 0; index < columnNames.length; index += 1) {
    const name = normalizeColumnName(columnNames[index]);
    const typeValue = columnTypes[index];
    const normalizedType =
      typeof typeValue === "string" ? typeValue.trim() : "";

    if (!name || !isTableColumnType(normalizedType)) {
      continue;
    }

    const targetTableId = getTargetTableId(
      normalizedType,
      columnTargetTableIds[index],
    );
    const displayField = getDisplayField(
      normalizedType,
      columnDisplayFields[index],
    );

    if (normalizedType === LINK_COLUMN_TYPE && !targetTableId) {
      continue;
    }

    columns.push({
      name,
      type: normalizedType,
      ...(targetTableId ? { targetTableId } : {}),
      ...(displayField ? { displayField } : {}),
    });
  }

  return columns.length > 0 ? columns : DEFAULT_TABLE_COLUMNS;
}
