"use client";

import Link from "next/link";
import { normalizeTableName } from "@/lib/table-utils";
import {
  useOptimisticTables,
  type TableListItem,
} from "../hooks/useOptimisticTables";
import CreateTableModal from "./createTableModal";

export default function TablesList({
  universe,
  initialTables,
  availableTables,
  addTable,
}: {
  universe: string;
  initialTables: TableListItem[];
  availableTables: Array<{
    id: string;
    name: string;
    columns: Array<{ name: string; type: string }>;
  }>;
  addTable: (formData: FormData) => Promise<void>;
}) {
  const [tables, addOptimisticTable] = useOptimisticTables(initialTables);

  async function handleCreateTable(formData: FormData) {
    const tableName = normalizeTableName(formData.get("tableName"));
    if (!tableName) return;

    addOptimisticTable({ name: tableName });
    await addTable(formData);
  }

  return (
    <>
      <ul className="self-left">
        {tables.map((table) => {
          return (
            <li key={table.id} className="mb-5">
              <Link href={`/universe/${universe}/${table.name}`}>
                {table.name}
              </Link>
            </li>
          );
        })}
      </ul>

      <CreateTableModal
        onCreate={handleCreateTable}
        availableTables={availableTables}
      />
    </>
  );
}
