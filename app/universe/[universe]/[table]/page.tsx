import { Table } from "./components/table";

export default async function TableView({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const tableColumns = [
    { key: "name", name: "Name" },
    { key: "description", name: "Description" },
  ];
  const tableRows = [
    {
      id: "123",
      attributes: {
        name: { type: "text", value: "Ibrahim Gauntz" },
        description: { type: "longtext", value: "Commisar in Imperial Guard" },
      },
    },
    {
      id: "345",
      attributes: {
        name: { type: "text", value: "Space Marine" },
        description: { type: "longtext", value: "Soldier of Imperium" },
      },
    },
  ];

  async function updateCell(
    rowId: string,
    rowAttribute: string,
    value: string
  ) {
    "use server";
    const indexOfRowToUpdate = tableRows.findIndex((row) => row.id === rowId);
    // @ts-ignore -- Need to update types ones a schema is properly defined
    tableRows[indexOfRowToUpdate].attributes[rowAttribute].value = value;
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      <h1 className="text-xl">{table}</h1>
      <Table columns={tableColumns} rows={tableRows} updateCell={updateCell} />
    </div>
  );
}
