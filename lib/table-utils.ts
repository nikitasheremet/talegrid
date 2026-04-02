import type { IColumn } from "@/lib/models";

export const DEFAULT_TABLE_COLUMNS: IColumn[] = [
  { name: "Name", type: "text" },
];
export const TABLE_COLUMN_TYPES = [
  "text",
  "longtext",
  "link",
  "number",
  "multiselect",
] as const;
export const LINK_COLUMN_TYPE = "link";
export const NUMBER_COLUMN_TYPE = "number";
export const MULTISELECT_COLUMN_TYPE = "multiselect";
export const SELF_LINK_TARGET_TABLE = "__self__";
export const DEFAULT_LINK_DISPLAY_FIELD = "Name";
export const MINIMUM_REMAINING_COLUMNS = 1;
export const DELETE_COLUMN_FORM_FIELD = "selectedColumnName";

export type TableColumnType = (typeof TABLE_COLUMN_TYPES)[number];

const STRICT_NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

function normalizeMultiselectRawOptions(options: string[]): string[] {
  const normalizedOptionsByKey = new Map<string, string>();

  for (const option of options) {
    const normalizedOption = option.trim();
    if (!normalizedOption) continue;

    const normalizedKey = normalizedOption.toLowerCase();
    if (!normalizedOptionsByKey.has(normalizedKey)) {
      normalizedOptionsByKey.set(normalizedKey, normalizedOption);
    }
  }

  return Array.from(normalizedOptionsByKey.values());
}

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

export function normalizeMultiselectOptionValues(options: string[]): string[] {
  return normalizeMultiselectRawOptions(options);
}

export function parseMultiselectOptionsInput(value: string): string[] {
  return normalizeMultiselectRawOptions(value.split(/\r?\n/g));
}

export function parseMultiselectOptionsFormValue(
  value: FormDataEntryValue | null | undefined,
): string[] | undefined {
  if (typeof value !== "string") return undefined;

  const normalizedValue = value.trim();
  if (!normalizedValue) return undefined;

  try {
    const parsedJson = JSON.parse(normalizedValue);
    if (!Array.isArray(parsedJson)) {
      return undefined;
    }

    const stringOptions = parsedJson.filter(
      (option): option is string => typeof option === "string",
    );
    const normalizedOptions = normalizeMultiselectRawOptions(stringOptions);
    return normalizedOptions.length > 0 ? normalizedOptions : undefined;
  } catch {
    const parsedOptions = parseMultiselectOptionsInput(normalizedValue);
    return parsedOptions.length > 0 ? parsedOptions : undefined;
  }
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

function getMultiselectOptions(
  columnType: TableColumnType,
  optionsValue: FormDataEntryValue | undefined,
): string[] | undefined {
  if (columnType !== MULTISELECT_COLUMN_TYPE) return undefined;
  return parseMultiselectOptionsFormValue(optionsValue);
}

export function parseTableColumnsFromFormData(formData: FormData): IColumn[] {
  const columnNames = formData.getAll("columnName");
  const columnTypes = formData.getAll("columnType");
  const columnTargetTableIds = formData.getAll("columnTargetTableId");
  const columnDisplayFields = formData.getAll("columnDisplayField");
  const columnOptions = formData.getAll("columnOptions");

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
    const options = getMultiselectOptions(normalizedType, columnOptions[index]);

    if (normalizedType === LINK_COLUMN_TYPE && !targetTableId) {
      continue;
    }

    if (normalizedType === MULTISELECT_COLUMN_TYPE && !options) {
      continue;
    }

    columns.push({
      name,
      type: normalizedType,
      ...(targetTableId ? { targetTableId } : {}),
      ...(displayField ? { displayField } : {}),
      ...(options ? { options } : {}),
    });
  }

  return columns.length > 0 ? columns : DEFAULT_TABLE_COLUMNS;
}
