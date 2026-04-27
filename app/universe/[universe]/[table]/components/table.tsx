"use client";

import { useState } from "react";
import RowDetailsModal from "@/app/universe/[universe]/[table]/components/rowDetailsModal";
import EditColumnModal from "./editColumnModal";
import TableRow from "./tableRow";

export function Table({
  rows,
  columns,
  updateCell,
  onEditColumn,
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
    options?: string[];
  }[];
  updateCell: (
    rowId: string,
    cellId: string,
    value: string | string[] | number | null,
  ) => Promise<{ error?: string }>;
  onEditColumn: (formData: FormData) => Promise<void>;
  linkOptionsByColumn: Record<string, Array<{ id: string; label: string }>>;
}) {
  const [saveError, setSaveError] = useState("");
  const [editingColumnName, setEditingColumnName] = useState("");
  const [expandedRowId, setExpandedRowId] = useState("");
  const [tableRows, setTableRows] = useState(rows);
  const editingColumn = columns.find(
    (column) => column.name === editingColumnName,
  );
  const expandedRow = tableRows.find((row) => row.id === expandedRowId);
  const isRowModalOpen = Boolean(expandedRow);

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

    setTableRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const currentAttribute = row.attributes[cellId];
        const fallbackColumnType =
          columns.find((column) => column.name === cellId)?.type ?? "text";

        return {
          ...row,
          attributes: {
            ...row.attributes,
            [cellId]: {
              type: currentAttribute?.type ?? fallbackColumnType,
              value,
            },
          },
        };
      }),
    );

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

      <div
        className={
          isRowModalOpen
            ? "w-full pointer-events-none opacity-70 transition-opacity"
            : "w-full transition-opacity"
        }
      >
        <table className="w-full table-fixed bg-slate-100 shadow-xl">
          <thead>
            <tr className="border-b">
              {columns.map((column) => {
                return (
                  <th className="group p-2 w-30" key={column.key}>
                    <div className="flex items-center gap-2">
                      <span>{column.name}</span>
                      <button
                        type="button"
                        className="opacity-0 text-sm transition-opacity hover:text-slate-600 group-hover:opacity-100 group-focus-within:opacity-100"
                        onClick={() => setEditingColumnName(column.name)}
                        aria-label={`Edit ${column.name} column`}
                        title="Edit column"
                      >
                        ✎
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <TableRow
                key={row.id}
                id={row.id}
                attributes={row.attributes}
                columns={columns}
                linkOptionsByColumn={linkOptionsByColumn}
                updateCell={handleUpdateCell}
                onExpandRow={setExpandedRowId}
              />
            ))}
          </tbody>
        </table>
      </div>

      {editingColumn ? (
        <EditColumnModal
          onEditColumn={onEditColumn}
          currentColumnName={editingColumn.name}
          currentColumnType={editingColumn.type}
          currentColumnOptions={editingColumn.options}
          existingColumnNames={columns.map((column) => column.name)}
          isOpen={Boolean(editingColumn)}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingColumnName("");
            }
          }}
        />
      ) : null}

      {expandedRow ? (
        <RowDetailsModal
          isOpen={Boolean(expandedRow)}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setExpandedRowId("");
            }
          }}
          row={expandedRow}
          columns={columns}
          linkOptionsByColumn={linkOptionsByColumn}
          updateCell={handleUpdateCell}
        />
      ) : null}
    </>
  );
}
