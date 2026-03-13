"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import {
  DEFAULT_LINK_DISPLAY_FIELD,
  SELF_LINK_TARGET_TABLE,
  TABLE_COLUMN_TYPES,
  normalizeColumnName,
  normalizeTableName,
  type TableColumnType,
} from "@/lib/table-utils";

interface PendingColumn {
  id: string;
  name: string;
  type: TableColumnType;
  targetTableId?: string;
  displayField?: string;
}

function createPendingColumnId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}`;
}

export default function CreateTableModal({
  onCreate,
  availableTables,
}: {
  onCreate: (formData: FormData) => Promise<void>;
  availableTables: Array<{
    id: string;
    name: string;
    columns: Array<{ name: string; type: string }>;
  }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [pendingColumns, setPendingColumns] = useState<PendingColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<TableColumnType>("text");
  const [newColumnTargetTableId, setNewColumnTargetTableId] = useState("");
  const [newColumnDisplayField, setNewColumnDisplayField] = useState(
    DEFAULT_LINK_DISPLAY_FIELD,
  );
  const [columnError, setColumnError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const tableNameById = new Map(
    availableTables.map((table) => [table.id, table.name]),
  );

  function openModal() {
    setIsOpen(true);
    setSubmitError("");
  }

  function resetModalState() {
    setTableName("");
    setPendingColumns([]);
    setNewColumnName("");
    setNewColumnType("text");
    setNewColumnTargetTableId("");
    setNewColumnDisplayField(DEFAULT_LINK_DISPLAY_FIELD);
    setColumnError("");
    setSubmitError("");
    setIsSubmitting(false);
    formRef.current?.reset();
  }

  function closeModal() {
    setIsOpen(false);
    resetModalState();
  }

  function addColumn() {
    const normalizedName = normalizeColumnName(newColumnName);
    if (!normalizedName) {
      setColumnError("Column name is required.");
      return;
    }

    const alreadyExists = pendingColumns.some(
      (column) => column.name.toLowerCase() === normalizedName.toLowerCase(),
    );

    if (alreadyExists) {
      setColumnError("That column already exists in this table.");
      return;
    }

    if (newColumnType === "link" && !newColumnTargetTableId) {
      setColumnError("Please choose a target table for link columns.");
      return;
    }

    if (newColumnType === "link" && !newColumnDisplayField) {
      setColumnError("Please choose a display field for link columns.");
      return;
    }

    setPendingColumns((currentColumns) => [
      ...currentColumns,
      {
        id: createPendingColumnId(),
        name: normalizedName,
        type: newColumnType,
        ...(newColumnType === "link"
          ? {
              targetTableId: newColumnTargetTableId,
              displayField: newColumnDisplayField,
            }
          : {}),
      },
    ]);

    setNewColumnName("");
    setNewColumnType("text");
    setNewColumnTargetTableId("");
    setNewColumnDisplayField(DEFAULT_LINK_DISPLAY_FIELD);
    setColumnError("");
  }

  function getTargetFieldOptions(targetTableId: string) {
    if (!targetTableId) {
      return [DEFAULT_LINK_DISPLAY_FIELD];
    }

    if (targetTableId === SELF_LINK_TARGET_TABLE) {
      const selfFieldNames = [
        DEFAULT_LINK_DISPLAY_FIELD,
        ...pendingColumns.map((column) => column.name),
      ];

      return Array.from(new Set(selfFieldNames));
    }

    const targetTable = availableTables.find(
      (table) => table.id === targetTableId,
    );
    const targetFieldNames = targetTable?.columns.map(
      (column) => column.name,
    ) ?? [DEFAULT_LINK_DISPLAY_FIELD];

    return targetFieldNames.length > 0
      ? targetFieldNames
      : [DEFAULT_LINK_DISPLAY_FIELD];
  }

  function removeColumn(columnId: string) {
    setPendingColumns((currentColumns) =>
      currentColumns.filter((column) => column.id !== columnId),
    );
  }

  function handleColumnNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addColumn();
  }

  async function handleCreate(formData: FormData) {
    const normalizedName = normalizeTableName(formData.get("tableName"));
    if (!normalizedName || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await onCreate(formData);
      closeModal();
    } catch {
      setSubmitError("Could not create table. Please try again.");
      setIsSubmitting(false);
    }
  }

  const isCreateDisabled = !normalizeTableName(tableName) || isSubmitting;

  return (
    <>
      <button
        type="button"
        className="border rounded px-3 py-1"
        onClick={openModal}
      >
        Add Table
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-4 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">Create New Table</h2>

            <form
              ref={formRef}
              action={handleCreate}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="tableName" className="text-sm font-medium">
                  Table Name
                </label>
                <input
                  id="tableName"
                  name="tableName"
                  placeholder="Characters"
                  className="border rounded px-2 py-1"
                  value={tableName}
                  onChange={(event) => setTableName(event.target.value)}
                  required
                />
              </div>

              <div className="rounded border p-3">
                <p className="mb-2 text-sm font-medium">Columns</p>

                <div className="mb-3 flex flex-wrap items-end gap-2">
                  <div className="flex min-w-52 flex-1 flex-col gap-1">
                    <label htmlFor="columnName" className="text-sm">
                      Column Name
                    </label>
                    <input
                      id="columnName"
                      value={newColumnName}
                      onChange={(event) => {
                        setNewColumnName(event.target.value);
                        if (columnError) setColumnError("");
                      }}
                      onKeyDown={handleColumnNameKeyDown}
                      placeholder="Description"
                      className="border rounded px-2 py-1"
                    />
                  </div>

                  <div className="flex w-40 flex-col gap-1">
                    <label htmlFor="columnType" className="text-sm">
                      Type
                    </label>
                    <select
                      id="columnType"
                      value={newColumnType}
                      onChange={(event) => {
                        const nextType = event.target.value as TableColumnType;
                        setNewColumnType(nextType);

                        if (nextType !== "link") {
                          setNewColumnTargetTableId("");
                          setNewColumnDisplayField(DEFAULT_LINK_DISPLAY_FIELD);
                        }
                      }}
                      className="border rounded px-2 py-1"
                    >
                      {TABLE_COLUMN_TYPES.map((columnType) => (
                        <option key={columnType} value={columnType}>
                          {columnType}
                        </option>
                      ))}
                    </select>
                  </div>

                  {newColumnType === "link" ? (
                    <div className="flex min-w-52 flex-1 flex-col gap-1">
                      <label htmlFor="columnTargetTable" className="text-sm">
                        Link To Table
                      </label>
                      <select
                        id="columnTargetTable"
                        value={newColumnTargetTableId}
                        onChange={(event) => {
                          const nextTargetTableId = event.target.value;
                          setNewColumnTargetTableId(nextTargetTableId);

                          const nextOptions =
                            getTargetFieldOptions(nextTargetTableId);
                          if (!nextOptions.includes(newColumnDisplayField)) {
                            setNewColumnDisplayField(
                              nextOptions.includes(DEFAULT_LINK_DISPLAY_FIELD)
                                ? DEFAULT_LINK_DISPLAY_FIELD
                                : nextOptions[0],
                            );
                          }
                        }}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Select table</option>
                        {availableTables.map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.name}
                          </option>
                        ))}
                        <option value={SELF_LINK_TARGET_TABLE}>
                          This table
                        </option>
                      </select>
                    </div>
                  ) : null}

                  {newColumnType === "link" ? (
                    <div className="flex min-w-52 flex-1 flex-col gap-1">
                      <label htmlFor="columnDisplayField" className="text-sm">
                        Display Field
                      </label>
                      <select
                        id="columnDisplayField"
                        value={newColumnDisplayField}
                        onChange={(event) =>
                          setNewColumnDisplayField(event.target.value)
                        }
                        className="border rounded px-2 py-1"
                      >
                        {getTargetFieldOptions(newColumnTargetTableId).map(
                          (fieldName) => (
                            <option key={fieldName} value={fieldName}>
                              {fieldName}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={addColumn}
                    className="h-9 rounded border px-3 text-lg leading-none"
                    aria-label="Add column"
                    title="Add column"
                    disabled={isSubmitting}
                  >
                    +
                  </button>
                </div>

                {columnError ? (
                  <p className="mb-2 text-sm text-red-600">{columnError}</p>
                ) : null}

                {pendingColumns.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No columns added yet. A default <strong>Name (text)</strong>{" "}
                    column will be created.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {pendingColumns.map((column) => (
                      <li
                        key={column.id}
                        className="flex items-center justify-between rounded border px-2 py-1"
                      >
                        <span>
                          {column.name}{" "}
                          <span className="text-gray-500">({column.type})</span>
                          {column.type === "link" && column.targetTableId ? (
                            <span className="text-gray-500">
                              {" "}
                              →{" "}
                              {tableNameById.get(column.targetTableId) ??
                                "This table"}
                              {column.displayField
                                ? ` [${column.displayField}]`
                                : ""}
                            </span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          className="rounded border px-2 py-0.5 text-sm"
                          onClick={() => removeColumn(column.id)}
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                        <input
                          type="hidden"
                          name="columnName"
                          value={column.name}
                        />
                        <input
                          type="hidden"
                          name="columnType"
                          value={column.type}
                        />
                        <input
                          type="hidden"
                          name="columnTargetTableId"
                          value={column.targetTableId ?? ""}
                        />
                        <input
                          type="hidden"
                          name="columnDisplayField"
                          value={column.displayField ?? ""}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {submitError ? (
                <p className="text-sm text-red-600">{submitError}</p>
              ) : null}

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
                  disabled={isCreateDisabled}
                >
                  {isSubmitting ? "Creating..." : "Create Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
