"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_LINK_DISPLAY_FIELD,
  TABLE_COLUMN_TYPES,
  type TableColumnType,
} from "@/lib/table-utils";

interface TableOption {
  id: string;
  name: string;
  columns: Array<{ name: string; type: string }>;
}

export default function AddColumnModal({
  onAddColumn,
  availableTables,
  triggerLabel = "Add Column",
  triggerClassName = "rounded border px-3 py-1",
  showTrigger = true,
  isOpen,
  onOpenChange,
}: {
  onAddColumn: (formData: FormData) => Promise<void>;
  availableTables: TableOption[];
  triggerLabel?: string;
  triggerClassName?: string;
  showTrigger?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState<TableColumnType>("text");
  const [targetTableId, setTargetTableId] = useState("");
  const [displayField, setDisplayField] = useState(DEFAULT_LINK_DISPLAY_FIELD);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isControlled = typeof isOpen === "boolean";
  const isModalOpen = isControlled ? isOpen : internalIsOpen;

  function setModalOpen(nextValue: boolean) {
    if (!isControlled) {
      setInternalIsOpen(nextValue);
    }

    onOpenChange?.(nextValue);
  }

  const targetTableFields = useMemo(() => {
    if (!targetTableId) return [] as string[];

    const targetTable = availableTables.find(
      (table) => table.id === targetTableId,
    );
    if (!targetTable) return [];

    return targetTable.columns.map((column) => column.name);
  }, [availableTables, targetTableId]);

  function closeModal() {
    setModalOpen(false);
    setColumnName("");
    setColumnType("text");
    setTargetTableId("");
    setDisplayField(DEFAULT_LINK_DISPLAY_FIELD);
    setError("");
    setIsSubmitting(false);
  }

  async function handleSubmit(formData: FormData) {
    if (isSubmitting) return;

    const normalizedColumnName = columnName.trim();
    if (!normalizedColumnName) {
      setError("Column name is required.");
      return;
    }

    if (columnType === "link" && !targetTableId) {
      setError("Please select a target table for a link column.");
      return;
    }

    if (columnType === "link" && !displayField) {
      setError("Please select a display field for the linked rows.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onAddColumn(formData);
      closeModal();
    } catch {
      setError("Could not add column. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          className={triggerClassName}
          onClick={() => setModalOpen(true)}
        >
          {triggerLabel}
        </button>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">Add Column</h2>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="add-column-name"
                  className="text-sm font-medium"
                >
                  Column Name
                </label>
                <input
                  id="add-column-name"
                  name="columnName"
                  value={columnName}
                  onChange={(event) => {
                    setColumnName(event.target.value);
                    if (error) setError("");
                  }}
                  className="border rounded px-2 py-1"
                  placeholder="Books"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="add-column-type"
                  className="text-sm font-medium"
                >
                  Type
                </label>
                <select
                  id="add-column-type"
                  name="columnType"
                  value={columnType}
                  onChange={(event) => {
                    setColumnType(event.target.value as TableColumnType);
                    if (event.target.value !== "link") {
                      setTargetTableId("");
                      setDisplayField(DEFAULT_LINK_DISPLAY_FIELD);
                    }
                    if (error) setError("");
                  }}
                  className="border rounded px-2 py-1"
                >
                  {TABLE_COLUMN_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {columnType === "link" ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="add-column-target-table"
                      className="text-sm font-medium"
                    >
                      Link To Table
                    </label>
                    <select
                      id="add-column-target-table"
                      name="columnTargetTableId"
                      value={targetTableId}
                      onChange={(event) => {
                        const nextTargetTableId = event.target.value;
                        setTargetTableId(nextTargetTableId);

                        const targetTable = availableTables.find(
                          (table) => table.id === nextTargetTableId,
                        );
                        const fields =
                          targetTable?.columns.map((column) => column.name) ??
                          [];
                        if (!fields.includes(displayField)) {
                          setDisplayField(
                            fields.includes(DEFAULT_LINK_DISPLAY_FIELD)
                              ? DEFAULT_LINK_DISPLAY_FIELD
                              : (fields[0] ?? DEFAULT_LINK_DISPLAY_FIELD),
                          );
                        }

                        if (error) setError("");
                      }}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">Select table</option>
                      {availableTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="add-column-display-field"
                      className="text-sm font-medium"
                    >
                      Display Field
                    </label>
                    <select
                      id="add-column-display-field"
                      name="columnDisplayField"
                      value={displayField}
                      onChange={(event) => setDisplayField(event.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {targetTableFields.length === 0 ? (
                        <option value={DEFAULT_LINK_DISPLAY_FIELD}>
                          {DEFAULT_LINK_DISPLAY_FIELD}
                        </option>
                      ) : (
                        targetTableFields.map((fieldName) => (
                          <option key={fieldName} value={fieldName}>
                            {fieldName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <input type="hidden" name="columnTargetTableId" value="" />
                  <input
                    type="hidden"
                    name="columnDisplayField"
                    value={DEFAULT_LINK_DISPLAY_FIELD}
                  />
                </>
              )}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded border px-3 py-1"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded border px-3 py-1 disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Column"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
