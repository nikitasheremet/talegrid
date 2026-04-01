import { useMemo } from "react";
import { LINK_COLUMN_TYPE, NUMBER_COLUMN_TYPE } from "@/lib/table-utils";
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
      value: string | string[] | number | null;
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
  updateCell: (
    rowId: string,
    cellId: string,
    value: string | string[] | number | null,
  ) => Promise<{ error?: string }>;
}) {
  const rowValues = useMemo(() => {
    return columns.map((column) => {
      const attribute = attributes[column.name];

      return {
        id: column.name,
        type: column.type,
        value:
          attribute?.value ??
          (column.type === LINK_COLUMN_TYPE
            ? []
            : column.type === NUMBER_COLUMN_TYPE
              ? null
              : ""),
      };
    });
  }, [attributes, columns]);

  const cellKeySuffix = useMemo(() => id, [id]);

  function getCellValueKey(value: string | string[] | number | null) {
    if (value === null) return "null";
    if (typeof value === "number") return `${value}`;
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
