import { revalidatePath } from "next/cache";
import Button from "./components/button";
import { Table } from "./components/table";
import {
  getTableByNameAndUniverse,
  getRowsByTableId,
  updateTableRow,
  createTableRow,
} from "@/lib/queries";
import type { IAttributeValue } from "@/lib/models";

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

  const rows = await getRowsByTableId(tableData._id.toString());
  const tableColumns = tableData.columns.map((col) => ({
    key: col.name,
    name: col.name,
  }));

  async function updateCell(
    rowId: string,
    rowAttribute: string,
    value: string,
  ) {
    "use server";
    const row = rows.find((r) => r._id.toString() === rowId);
    if (!row) return;

    const updatedAttributes = { ...row.attributes };
    if (updatedAttributes[rowAttribute]) {
      updatedAttributes[rowAttribute].value = value;
    }

    await updateTableRow(rowId, updatedAttributes);
    revalidatePath(`/universe/${universe}/${tableName}`, "page");
  }

  async function addNewEmptyRow() {
    "use server";

    if (!tableData) return;

    const newAttributes: Record<string, IAttributeValue> = {};
    tableData.columns.forEach((col) => {
      newAttributes[col.name] = { type: col.type, value: "" };
    });

    await createTableRow(tableData._id.toString(), newAttributes);
    revalidatePath(`/universe/${universe}/${tableName}`, "page");
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      <h1 className="text-xl">{tableName}</h1>
      <Table
        columns={tableColumns}
        rows={rows.map((row) => ({
          id: row._id.toString(),
          attributes: row.attributes,
        }))}
        updateCell={updateCell}
        addNewEmptyRow={addNewEmptyRow}
      />
      <Button click={addNewEmptyRow} buttonText="Add New Row" />
    </div>
  );
}
