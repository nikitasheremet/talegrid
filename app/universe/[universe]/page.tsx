import { revalidatePath } from "next/cache";
import { getTablesByUniverseName } from "@/lib/queries";
import { createTable } from "@/lib/queries";
import {
  normalizeTableName,
  parseTableColumnsFromFormData,
} from "@/lib/table-utils";
import Breadcrumbs from "@/app/components/breadcrumbs";
import TablesList from "./components/tablesList";

function decodeRouteSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export default async function UniverseView({
  params,
}: {
  params: Promise<{ universe: string }>;
}) {
  const { universe: universeParam } = await params;
  const universe = decodeRouteSegment(universeParam);
  const universePath = `/universe/${encodeURIComponent(universe)}`;
  const tables = await getTablesByUniverseName(universe);

  async function addTable(formData: FormData) {
    "use server";

    const tableName = normalizeTableName(formData.get("tableName"));
    const columns = parseTableColumnsFromFormData(formData);
    if (!tableName) return;

    await createTable(universe, tableName, columns);
    revalidatePath(universePath, "page");
  }

  return (
    <>
      <div className="flex flex-col items-center p-5 gap-5">
        <div className="w-full max-w-6xl">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: universe, href: universePath },
            ]}
          />
        </div>
        <h1 className="text-xl">
          Welcome to <span className="font-bold">{universe}</span>
        </h1>
        <TablesList
          universe={universe}
          initialTables={tables.map((table) => ({
            id: table._id.toString(),
            name: table.name,
          }))}
          availableTables={tables.map((table) => ({
            id: table._id.toString(),
            name: table.name,
            columns: table.columns.map((column) => ({
              name: column.name,
              type: column.type,
            })),
          }))}
          addTable={addTable}
        />
      </div>
    </>
  );
}
