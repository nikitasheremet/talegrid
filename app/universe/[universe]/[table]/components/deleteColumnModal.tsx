"use client";

import { useState } from "react";
import {
  DELETE_COLUMN_FORM_FIELD,
  MINIMUM_REMAINING_COLUMNS,
} from "@/lib/table-utils";

const DELETE_BUTTON_LABEL = "Delete Selected Columns";
const DELETE_LOADING_LABEL = "Deleting...";

interface ColumnOption {
  name: string;
  type: string;
}

export default function DeleteColumnModal({
  onDeleteColumns,
  columns,
  triggerLabel = "Delete Column",
  triggerClassName = "rounded border px-3 py-1",
  showTrigger = true,
  isOpen,
  onOpenChange,
}: {
  onDeleteColumns: (formData: FormData) => Promise<void>;
  columns: ColumnOption[];
  triggerLabel?: string;
  triggerClassName?: string;
  showTrigger?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selectedColumnNames, setSelectedColumnNames] = useState<string[]>([]);
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

  function closeModal() {
    setModalOpen(false);
    setSelectedColumnNames([]);
    setError("");
    setIsSubmitting(false);
  }

  function toggleColumnSelection(columnName: string) {
    setSelectedColumnNames((current) => {
      if (current.includes(columnName)) {
        return current.filter((name) => name !== columnName);
      }

      return [...current, columnName];
    });

    if (error) {
      setError("");
    }
  }

  function validateSelection() {
    if (selectedColumnNames.length === 0) {
      return "Please select at least one column to delete.";
    }

    const remainingColumnsCount = columns.length - selectedColumnNames.length;
    if (remainingColumnsCount < MINIMUM_REMAINING_COLUMNS) {
      return "You must keep at least one column in the table.";
    }

    return "";
  }

  async function handleSubmit(formData: FormData) {
    if (isSubmitting) return;

    const validationError = validateSelection();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onDeleteColumns(formData);
      closeModal();
    } catch {
      setError("Could not delete columns. Please try again.");
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
            <h2 className="mb-2 text-lg font-semibold">Delete Columns</h2>
            <p className="mb-4 text-sm text-slate-600">
              Select one or more columns to remove. This will permanently delete
              those column values from all rows.
            </p>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <div className="max-h-72 overflow-auto rounded border p-2">
                <ul className="flex flex-col gap-2">
                  {columns.map((column) => {
                    const inputId = `delete-column-${column.name}`;
                    const isChecked = selectedColumnNames.includes(column.name);

                    return (
                      <li key={column.name}>
                        <label
                          htmlFor={inputId}
                          className="flex cursor-pointer items-center justify-between gap-2 rounded px-1 py-1 hover:bg-slate-50"
                        >
                          <span className="text-sm">{column.name}</span>
                          <input
                            id={inputId}
                            type="checkbox"
                            name={DELETE_COLUMN_FORM_FIELD}
                            value={column.name}
                            checked={isChecked}
                            onChange={() => toggleColumnSelection(column.name)}
                            disabled={isSubmitting}
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

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
                  {isSubmitting ? DELETE_LOADING_LABEL : DELETE_BUTTON_LABEL}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
