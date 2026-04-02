import { revalidatePath } from "next/cache";
import Button from "./components/button";
import { Table } from "./components/table";
import TableSettingsMenu from "./components/tableSettingsMenu";
import {
  getTableByNameAndUniverse,
  getRowsByTableId,
  updateTableRow,
  createTableRow,
  addColumnToTable,
  deleteColumnsFromTable,
  updateColumnInTable,
  getTablesByUniverseName,
} from "@/lib/queries";
import type { IAttributeValue } from "@/lib/models";
import {
  DELETE_COLUMN_FORM_FIELD,
  DEFAULT_LINK_DISPLAY_FIELD,
  LINK_COLUMN_TYPE,
  MINIMUM_REMAINING_COLUMNS,
  MULTISELECT_COLUMN_TYPE,
  NUMBER_COLUMN_TYPE,
  normalizeColumnName,
  parseMultiselectOptionsFormValue,
  parseSelectedColumnNamesFromFormData,
  TABLE_COLUMN_TYPES,
} from "@/lib/table-utils";

function getRowLabel(
  attributes: Record<string, { type: string; value: unknown }> | undefined,
  rowId: string,
  displayField = DEFAULT_LINK_DISPLAY_FIELD,
) {
  const preferredAttribute = attributes?.[displayField];
  const preferredValue =
    typeof preferredAttribute?.value === "string"
      ? preferredAttribute.value.trim()
      : typeof preferredAttribute?.value === "number"
        ? `${preferredAttribute.value}`
        : "";

  if (preferredValue) return preferredValue;

  const nameAttribute = attributes?.[DEFAULT_LINK_DISPLAY_FIELD];
  const nameValue =
    typeof nameAttribute?.value === "string"
      ? nameAttribute.value.trim()
      : typeof nameAttribute?.value === "number"
        ? `${nameAttribute.value}`
        : "";

  if (nameValue) return nameValue;
  return rowId;
}

export default async function TableView({
  params,
}: {
  params: Promise<{ table: string; universe: string }>;
}) {
  const { table: tableName, universe } = await params;

  const tableData = await getTableByNameAndUniverse(universe, tableName);
  if (!tableData) {
    return <div>Table not found</div>;
  }
  const tableId = tableData._id.toString();
  const columns = tableData.columns;

  const rows = await getRowsByTableId(tableId);
  const universeTables = await getTablesByUniverseName(universe);

  const tableColumns = columns.map((col) => ({
    key: col.name,
    name: col.name,
    type: col.type,
    targetTableId:
      typeof col.targetTableId === "string"
        ? col.targetTableId
        : col.targetTableId?.toString(),
    displayField: col.displayField,
    options: col.options,
  }));

  const linkColumns = columns.filter(
    (column) => column.type === LINK_COLUMN_TYPE && column.targetTableId,
  );

  const linkOptionsEntries = await Promise.all(
    linkColumns.map(async (column) => {
      const targetTableId =
        typeof column.targetTableId === "string"
          ? column.targetTableId
          : column.targetTableId?.toString();

      if (!targetTableId) return [column.name, []] as const;

      const targetRows = await getRowsByTableId(targetTableId);
      const displayField =
        typeof column.displayField === "string" && column.displayField.trim()
          ? column.displayField.trim()
          : DEFAULT_LINK_DISPLAY_FIELD;
      return [
        column.name,
        targetRows.map((row) => ({
          id: row._id.toString(),
          label: getRowLabel(
            row.attributes as Record<string, { type: string; value: unknown }>,
            row._id.toString(),
            displayField,
          ),
        })),
      ] as const;
    }),
  );

  const linkOptionsByColumn = Object.fromEntries(linkOptionsEntries);

  async function updateCell(
    rowId: string,
    rowAttribute: string,
    value: string | string[] | number | null,
  ): Promise<{ error?: string }> {
    "use server";

    const row = rows.find((r) => r._id.toString() === rowId);
    if (!row) return { error: "Row not found." };

    const updatedAttributes = { ...row.attributes };
    if (updatedAttributes[rowAttribute]) {
      updatedAttributes[rowAttribute].value = value;
    }

    try {
      await updateTableRow(rowId, updatedAttributes);
      revalidatePath(`/universe/${universe}/${tableName}`, "page");
      return {};
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Invalid number value")
      ) {
        return {
          error:
            "Could not save: please enter a valid number using plain digits and an optional decimal point.",
        };
      }

      if (
        error instanceof Error &&
        error.message.startsWith("Invalid multiselect value")
      ) {
        return {
          error:
            "Could not save: one or more selected values are no longer allowed for this column.",
        };
      }

      return { error: "Could not save this cell. Please try again." };
    }
  }

  async function addColumn(formData: FormData) {
    "use server";

    const columnName = normalizeColumnName(formData.get("columnName"));
    const typeValue = formData.get("columnType");
    const targetTableValue = formData.get("columnTargetTableId");
    const displayFieldValue = formData.get("columnDisplayField");
    const columnOptionsValue = formData.get("columnOptions");

    const columnType = typeof typeValue === "string" ? typeValue.trim() : "";
    if (!columnName || !TABLE_COLUMN_TYPES.includes(columnType as never)) {
      return;
    }

    const targetTableId =
      typeof targetTableValue === "string" && targetTableValue.trim().length > 0
        ? targetTableValue.trim()
        : undefined;
    const displayField =
      typeof displayFieldValue === "string" &&
      displayFieldValue.trim().length > 0
        ? normalizeColumnName(displayFieldValue)
        : DEFAULT_LINK_DISPLAY_FIELD;
    const options = parseMultiselectOptionsFormValue(columnOptionsValue);

    if (columnType === LINK_COLUMN_TYPE && !targetTableId) {
      return;
    }

    if (columnType === MULTISELECT_COLUMN_TYPE && !options) {
      return;
    }

    await addColumnToTable(tableId, {
      name: columnName,
      type: columnType,
      targetTableId,
      displayField,
      options,
    });

    revalidatePath(`/universe/${universe}/${tableName}`, "page");
  }

  async function addNewEmptyRow() {
    "use server";

    const newAttributes: Record<string, IAttributeValue> = {};
    columns.forEach((col) => {
      newAttributes[col.name] = {
        type: col.type,
        value:
          col.type === LINK_COLUMN_TYPE
            ? []
            : col.type === MULTISELECT_COLUMN_TYPE
              ? []
              : col.type === NUMBER_COLUMN_TYPE
                ? null
                : "",
      };
    });

    await createTableRow(tableId, newAttributes);
    revalidatePath(`/universe/${universe}/${tableName}`, "page");
  }

  async function deleteColumns(formData: FormData) {
    "use server";

    const selectedColumnNames = parseSelectedColumnNamesFromFormData(
      formData,
      DELETE_COLUMN_FORM_FIELD,
    );

    if (selectedColumnNames.length === 0) {
      throw new Error("Please select at least one column to delete.");
    }

    const selectedColumnNameSet = new Set(
      selectedColumnNames.map((columnName) => columnName.toLowerCase()),
    );
    const remainingColumnsCount = columns.filter(
      (column) => !selectedColumnNameSet.has(column.name.toLowerCase()),
    ).length;

    if (remainingColumnsCount < MINIMUM_REMAINING_COLUMNS) {
      throw new Error("You must keep at least one column in the table.");
    }

    await deleteColumnsFromTable(tableId, selectedColumnNames);
    revalidatePath(`/universe/${universe}/${tableName}`, "page");
  }

  async function editColumn(formData: FormData) {
    "use server";

    const oldColumnName = normalizeColumnName(formData.get("oldColumnName"));
    const newColumnName = normalizeColumnName(formData.get("newColumnName"));
    const currentColumn = columns.find(
      (column) => column.name.toLowerCase() === oldColumnName.toLowerCase(),
    );

    if (!oldColumnName || !newColumnName || !currentColumn) {
      throw new Error("Column name is required.");
    }

    const columnOptions =
      currentColumn.type === MULTISELECT_COLUMN_TYPE
        ? parseMultiselectOptionsFormValue(formData.get("columnOptions"))
        : undefined;

    if (currentColumn.type === MULTISELECT_COLUMN_TYPE && !columnOptions) {
      throw new Error("Please add at least one allowed value.");
    }

    await updateColumnInTable(tableId, {
      oldColumnName,
      newColumnName,
      options: columnOptions,
    });
    revalidatePath(`/universe/${universe}/${tableName}`, "page");
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">{tableName}</h1>
        <TableSettingsMenu
          onAddColumn={addColumn}
          onDeleteColumns={deleteColumns}
          availableTables={universeTables.map((table) => ({
            id: table._id.toString(),
            name: table.name,
            columns: table.columns.map((column) => ({
              name: column.name,
              type: column.type,
            })),
          }))}
          columns={tableColumns.map((column) => ({
            name: column.name,
            type: column.type,
          }))}
        />
      </div>
      <Table
        columns={tableColumns}
        rows={rows.map((row) => ({
          id: row._id.toString(),
          attributes: row.attributes,
        }))}
        updateCell={updateCell}
        onEditColumn={editColumn}
        linkOptionsByColumn={linkOptionsByColumn}
      />
      <Button click={addNewEmptyRow} buttonText="Add New Row" />
    </div>
  );
}
