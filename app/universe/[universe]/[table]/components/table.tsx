import TableRow from "./tableRow";

export function Table({
  rows,
  columns,
  updateCell,
}: {
  rows: {
    id: string;
    attributes: {
      [key: string]: {
        type: string;
        value: any;
      };
    };
  }[];
  columns: {
    key: string;
    name: string;
  }[];
  updateCell: (rowId: string, cellId: string, value: string) => void;
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
            id={row.id}
            attributes={row.attributes}
            updateCell={updateCell}
          />
        ))}
      </tbody>
    </table>
  );
}
