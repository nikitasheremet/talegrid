import TableRow from "./tableRow";

export function Table({
  rows,
  columns,
  updateCell,
  linkOptionsByColumn,
}: {
  rows: {
    id: string;
    attributes: {
      [key: string]: {
        type: string;
        value: string | string[];
      };
    };
  }[];
  columns: {
    key: string;
    name: string;
    type: string;
    targetTableId?: string;
    displayField?: string;
  }[];
  updateCell: (rowId: string, cellId: string, value: string | string[]) => void;
  linkOptionsByColumn: Record<string, Array<{ id: string; label: string }>>;
}) {
  return (
    <table className="table-fixed shadow-xl bg-slate-100">
      <thead>
        <tr className="border-b">
          {columns.map((column) => {
            return (
              <th className="p-2 w-30" key={column.key}>
                {column.name}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            id={row.id}
            attributes={row.attributes}
            columns={columns}
            linkOptionsByColumn={linkOptionsByColumn}
            updateCell={updateCell}
          />
        ))}
      </tbody>
    </table>
  );
}
