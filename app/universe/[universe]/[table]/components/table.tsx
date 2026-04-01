"use client";

import { useState } from "react";
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
        value: string | string[] | number | null;
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
  updateCell: (
    rowId: string,
    cellId: string,
    value: string | string[] | number | null,
  ) => Promise<{ error?: string }>;
  linkOptionsByColumn: Record<string, Array<{ id: string; label: string }>>;
}) {
  const [saveError, setSaveError] = useState("");

  async function handleUpdateCell(
    rowId: string,
    cellId: string,
    value: string | string[] | number | null,
  ): Promise<{ error?: string }> {
    const result = await updateCell(rowId, cellId, value);
    if (result.error) {
      setSaveError(result.error);
      return result;
    }

    if (saveError) {
      setSaveError("");
    }

    return {};
  }

  return (
    <>
      {saveError ? (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
        </div>
      ) : null}

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
              updateCell={handleUpdateCell}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}
