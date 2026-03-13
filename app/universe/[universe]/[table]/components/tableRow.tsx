import { useMemo } from "react";
import TableCell from "./tableCell";

export default function TableRow({
  id,
  attributes,
  columns,
  linkOptionsByColumn,
  updateCell,
}: {
  id: string;
  attributes: {
    [key: string]: {
      type: string;
      value: string | string[];
    };
  };
  columns: Array<{
    key: string;
    name: string;
    type: string;
    targetTableId?: string;
    displayField?: string;
  }>;
  linkOptionsByColumn: Record<string, Array<{ id: string; label: string }>>;
  updateCell: (rowId: string, cellId: string, value: string | string[]) => void;
}) {
  const rowValues = useMemo(() => {
    return columns.map((column) => {
      const attribute = attributes[column.name];

      return {
        id: column.name,
        type: column.type,
        value: attribute?.value ?? (column.type === "link" ? [] : ""),
      };
    });
  }, [attributes, columns]);

  const cellKeySuffix = useMemo(() => id, [id]);

  function getCellValueKey(value: string | string[]) {
    return Array.isArray(value) ? value.join("|") : value;
  }

  return (
    <tr>
      {rowValues.map((value) => (
        <TableCell
          key={`${value.id}-${cellKeySuffix}-${getCellValueKey(value.value)}`}
          rowId={id}
          cellValue={value}
          linkOptions={linkOptionsByColumn[value.id] ?? []}
          updateCell={updateCell}
        />
      ))}
    </tr>
  );
}
