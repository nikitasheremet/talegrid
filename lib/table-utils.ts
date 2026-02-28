import type { IColumn } from "@/lib/models";

export const DEFAULT_TABLE_COLUMNS: IColumn[] = [
  { name: "Name", type: "text" },
];
export const TABLE_COLUMN_TYPES = ["text", "longtext"] as const;

export type TableColumnType = (typeof TABLE_COLUMN_TYPES)[number];

export function normalizeTableName(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeColumnName(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isTableColumnType(value: string): value is TableColumnType {
  return TABLE_COLUMN_TYPES.includes(value as TableColumnType);
}

export function parseTableColumnsFromFormData(formData: FormData): IColumn[] {
  const columnNames = formData.getAll("columnName");
  const columnTypes = formData.getAll("columnType");

  const columns: IColumn[] = [];
  for (let index = 0; index < columnNames.length; index += 1) {
    const name = normalizeColumnName(columnNames[index]);
    const typeValue = columnTypes[index];
    const normalizedType =
      typeof typeValue === "string" ? typeValue.trim() : "";

    if (!name || !isTableColumnType(normalizedType)) {
      continue;
    }

    columns.push({
      name,
      type: normalizedType,
    });
  }

  return columns.length > 0 ? columns : DEFAULT_TABLE_COLUMNS;
}
