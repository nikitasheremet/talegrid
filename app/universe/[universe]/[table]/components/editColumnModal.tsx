"use client";

import { useMemo, useState } from "react";
import {
  MULTISELECT_COLUMN_TYPE,
  parseMultiselectOptionsInput,
} from "@/lib/table-utils";

export default function EditColumnModal({
  onEditColumn,
  currentColumnName,
  currentColumnType,
  currentColumnOptions,
  existingColumnNames,
  showTrigger = false,
  triggerLabel = "Edit Column",
  triggerClassName = "rounded border px-3 py-1",
  isOpen,
  onOpenChange,
}: {
  onEditColumn: (formData: FormData) => Promise<void>;
  currentColumnName: string;
  currentColumnType: string;
  currentColumnOptions?: string[];
  existingColumnNames: string[];
  showTrigger?: boolean;
  triggerLabel?: string;
  triggerClassName?: string;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [columnName, setColumnName] = useState(currentColumnName);
  const [columnOptionsText, setColumnOptionsText] = useState(
    (currentColumnOptions ?? []).join("\n"),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isControlled = typeof isOpen === "boolean";
  const isModalOpen = isControlled ? isOpen : internalIsOpen;
  const isMultiselectColumn = currentColumnType === MULTISELECT_COLUMN_TYPE;

  const blockedNames = useMemo(() => {
    return new Set(
      existingColumnNames
        .filter(
          (name) => name.toLowerCase() !== currentColumnName.toLowerCase(),
        )
        .map((name) => name.toLowerCase()),
    );
  }, [currentColumnName, existingColumnNames]);

  function setModalOpen(nextValue: boolean) {
    if (!isControlled) {
      setInternalIsOpen(nextValue);
    }

    onOpenChange?.(nextValue);
  }

  function openModal() {
    setColumnName(currentColumnName);
    setColumnOptionsText((currentColumnOptions ?? []).join("\n"));
    setError("");
    setIsSubmitting(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setColumnName(currentColumnName);
    setColumnOptionsText((currentColumnOptions ?? []).join("\n"));
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

    if (blockedNames.has(normalizedColumnName.toLowerCase())) {
      setError("A column with this name already exists.");
      return;
    }

    if (isMultiselectColumn) {
      const parsedOptions = parseMultiselectOptionsInput(columnOptionsText);
      if (parsedOptions.length === 0) {
        setError("Please add at least one allowed value.");
        return;
      }

      formData.set("columnOptions", JSON.stringify(parsedOptions));
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onEditColumn(formData);
      closeModal();
    } catch {
      setError("Could not update column. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {showTrigger ? (
        <button type="button" className={triggerClassName} onClick={openModal}>
          {triggerLabel}
        </button>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">Edit Column</h2>

            <form action={handleSubmit} className="flex flex-col gap-3">
              <input
                type="hidden"
                name="oldColumnName"
                value={currentColumnName}
              />
              <input
                type="hidden"
                name="columnType"
                value={currentColumnType}
              />

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="edit-column-name"
                  className="text-sm font-medium"
                >
                  Column Name
                </label>
                <input
                  id="edit-column-name"
                  name="newColumnName"
                  value={columnName}
                  onChange={(event) => {
                    setColumnName(event.target.value);
                    if (error) setError("");
                  }}
                  className="border rounded px-2 py-1"
                  required
                />
              </div>

              {isMultiselectColumn ? (
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="edit-column-options"
                    className="text-sm font-medium"
                  >
                    Allowed Values (one per line)
                  </label>
                  <textarea
                    id="edit-column-options"
                    name="columnOptionsText"
                    value={columnOptionsText}
                    onChange={(event) => {
                      setColumnOptionsText(event.target.value);
                      if (error) setError("");
                    }}
                    className="border rounded px-2 py-1 min-h-28"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              ) : null}

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
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
