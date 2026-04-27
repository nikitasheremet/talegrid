"use client";

import { useMemo } from "react";
import {
  LINK_COLUMN_TYPE,
  MULTISELECT_COLUMN_TYPE,
  NUMBER_COLUMN_TYPE,
} from "@/lib/table-utils";
import { CellEditor, type TableCellValue } from "./tableCell";

export default function RowDetailsModal({
  isOpen,
  onOpenChange,
  row,
  columns,
  linkOptionsByColumn,
  updateCell,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  row: {
    id: string;
    attributes: {
      [key: string]: {
        type: string;
        value: string | string[] | number | null;
      };
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
}) {
  const rowValues: TableCellValue[] = useMemo(() => {
    return columns.map((column) => {
      const attribute = row.attributes[column.name];

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
  }, [columns, row.attributes]);

  const rowTitle = useMemo(() => {
    const firstValue = rowValues[0]?.value;

    if (typeof firstValue === "string" && firstValue.trim().length > 0) {
      return firstValue.trim();
    }

    if (typeof firstValue === "number") {
      return `${firstValue}`;
    }

    return row.id;
  }, [row.id, rowValues]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="h-[95vh] w-[95vw] md:h-[90vh] md:w-[70vw] rounded-lg bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{rowTitle}</h2>
          <button
            type="button"
            className="rounded border px-3 py-1"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-4">
            {rowValues.map((value) => {
              const inputId = `row-${row.id}-${value.id}`;

              return (
                <div
                  key={`${row.id}-${value.id}`}
                  className="flex flex-col gap-1"
                >
                  <label htmlFor={inputId} className="text-sm font-medium">
                    {value.id}
                  </label>
                  <CellEditor
                    mode="field"
                    rowId={row.id}
                    cellValue={value}
                    linkOptions={linkOptionsByColumn[value.id] ?? []}
                    multiselectOptions={
                      columns.find((column) => column.name === value.id)
                        ?.options ?? []
                    }
                    updateCell={updateCell}
                    inputId={inputId}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
