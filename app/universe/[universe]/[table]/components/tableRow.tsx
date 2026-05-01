import { useMemo } from "react";
import {
  LINK_COLUMN_TYPE,
  MULTISELECT_COLUMN_TYPE,
  NUMBER_COLUMN_TYPE,
} from "@/lib/table-utils";
import TableCell, { type TableCellValue } from "./tableCell";

export default function TableRow({
  id,
  attributes,
  columns,
  linkOptionsByColumn,
  updateCell,
  onExpandRow,
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
    options?: string[];
  }>;
  linkOptionsByColumn: Record<string, Array<{ id: string; label: string }>>;
  updateCell: (
    rowId: string,
    cellId: string,
    value: string | string[] | number | null,
  ) => Promise<{ error?: string }>;
  onExpandRow: (rowId: string) => void;
}) {
  const rowValues: TableCellValue[] = useMemo(() => {
    return columns.map((column) => {
      const attribute = attributes[column.name];

      return {
        id: column.name,
        type: column.type,
        value:
          attribute?.value ??
          (column.type === LINK_COLUMN_TYPE
            ? []
            : column.type === MULTISELECT_COLUMN_TYPE
              ? []
              : column.type === NUMBER_COLUMN_TYPE
                ? null
                : ""),
      };
    });
  }, [attributes, columns]);

  return (
    <tr className="group transition-colors hover:bg-slate-200/40">
      {rowValues.map((value, index) => (
        <TableCell
          key={`${value.id}-${id}`}
          rowId={id}
          cellValue={value}
          linkOptions={linkOptionsByColumn[value.id] ?? []}
          multiselectOptions={
            columns.find((column) => column.name === value.id)?.options ?? []
          }
          updateCell={updateCell}
          className={index === 0 ? "relative pl-14" : undefined}
          overlayAction={
            index === 0 ? (
              <button
                type="button"
                className="pointer-events-auto rounded border bg-white px-2 py-1 text-xs opacity-100 shadow transition-opacity md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100"
                onClick={() => onExpandRow(id)}
                aria-label="Expand row details"
                title="Expand row"
              >
                Expand
              </button>
            ) : undefined
          }
        />
      ))}
    </tr>
  );
}
