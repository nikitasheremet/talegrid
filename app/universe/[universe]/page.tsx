import { revalidatePath } from "next/cache";
import { getTablesByUniverseName } from "@/lib/queries";
import { createTable } from "@/lib/queries";
import {
  normalizeTableName,
  parseTableColumnsFromFormData,
} from "@/lib/table-utils";
import TablesList from "./components/tablesList";

export default async function UniverseView({
  params,
}: {
  params: Promise<{ universe: string }>;
}) {
  const { universe } = await params;
  const tables = await getTablesByUniverseName(universe);

  async function addTable(formData: FormData) {
    "use server";

    const tableName = normalizeTableName(formData.get("tableName"));
    const columns = parseTableColumnsFromFormData(formData);
    if (!tableName) return;

    await createTable(universe, tableName, columns);
    revalidatePath(`/universe/${universe}`, "page");
  }

  return (
    <>
      <div className="flex flex-col items-center p-5 gap-5">
        <h1 className="text-xl">
          Welcome to <span className="font-bold">{universe}</span>
        </h1>
        <TablesList
          universe={universe}
          initialTables={tables.map((table) => ({
            id: table._id.toString(),
            name: table.name,
          }))}
          addTable={addTable}
        />
      </div>
    </>
  );
}
