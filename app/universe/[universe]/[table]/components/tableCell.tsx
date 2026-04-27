"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LINK_COLUMN_TYPE,
  MULTISELECT_COLUMN_TYPE,
  NUMBER_COLUMN_TYPE,
} from "@/lib/table-utils";

const DEBOUNCE_TIMEOUT_MS = 1000;
const LINK_LABEL_PREVIEW_LIMIT = 3;

function toInputValue(value: string | string[] | number | null) {
  if (typeof value === "number") {
    return `${value}`;
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function toSelectedIds(value: string | string[] | number | null) {
  return Array.isArray(value) ? value : [];
}

export interface TableCellValue {
  value: string | string[] | number | null;
  id: string;
  type: string;
}

interface BaseEditorProps {
  rowId: string;
  cellValue: TableCellValue;
  linkOptions: Array<{ id: string; label: string }>;
  multiselectOptions: string[];
  updateCell: (
    rowId: string,
    attributeName: string,
    value: string | string[] | number | null,
  ) => Promise<{ error?: string }>;
  mode?: "table" | "field";
  inputId?: string;
}

interface TableCellProps extends BaseEditorProps {
  className?: string;
  overlayAction?: React.ReactNode;
}

export function CellEditor({
  rowId,
  cellValue,
  linkOptions,
  multiselectOptions,
  updateCell,
  mode = "table",
  inputId,
}: BaseEditorProps) {
  const isFieldMode = mode === "field";

  const persistedTextValue = toInputValue(cellValue.value);
  const persistedSelectedIds = toSelectedIds(cellValue.value);

  const [draftValue, setDraftValue] = useState<string | null>(null);
  const [draftSelectedIds, setDraftSelectedIds] = useState<string[] | null>(
    null,
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMultiselectOpen, setIsMultiselectOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const multiselectContainerRef = useRef<HTMLDivElement | null>(null);

  const activeSelectedIds = draftSelectedIds ?? persistedSelectedIds;
  const renderedInputValue = draftValue ?? persistedTextValue;

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMultiselectOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        multiselectContainerRef.current &&
        !multiselectContainerRef.current.contains(target)
      ) {
        setIsMultiselectOpen(false);
        setDraftSelectedIds(null);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [isMultiselectOpen]);

  function updateValue(
    currentRowId: string,
    cellId: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const nextValue = event.target.value;
    debounceTimerRef.current = setTimeout(() => {
      void updateCell(currentRowId, cellId, nextValue).then((result) => {
        if (!result.error) {
          setDraftValue((currentValue) =>
            currentValue === nextValue ? null : currentValue,
          );
        }
      });
    }, DEBOUNCE_TIMEOUT_MS);

    setDraftValue(nextValue);
  }

  function toggleSelected(id: string) {
    setDraftSelectedIds((currentDraftSelection) => {
      const sourceSelection = currentDraftSelection ?? persistedSelectedIds;

      if (sourceSelection.includes(id)) {
        return sourceSelection.filter((currentId) => currentId !== id);
      }

      return [...sourceSelection, id];
    });
  }

  async function saveSelectedLinks() {
    const nextSelection = draftSelectedIds ?? persistedSelectedIds;
    const result = await updateCell(rowId, cellValue.id, nextSelection);
    if (result.error) {
      return;
    }

    setDraftSelectedIds(null);
    setIsPickerOpen(false);
    setSearch("");
  }

  async function saveSelectedOptions() {
    const nextSelection = draftSelectedIds ?? persistedSelectedIds;
    const orderedSelections = multiselectOptions.filter((option) =>
      nextSelection.includes(option),
    );

    const result = await updateCell(rowId, cellValue.id, orderedSelections);
    if (result.error) {
      return;
    }

    setDraftSelectedIds(null);
    setIsMultiselectOpen(false);
    setSearch("");
  }

  const filteredOptions = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    if (!normalizedQuery) return linkOptions;

    return linkOptions.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [linkOptions, search]);

  const labelsById = new Map(
    linkOptions.map((option) => [option.id, option.label]),
  );
  const selectedLabels = activeSelectedIds.map(
    (id) => labelsById.get(id) ?? id,
  );

  const filteredMultiselectOptions = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    if (!normalizedQuery) return multiselectOptions;

    return multiselectOptions.filter((option) =>
      option.toLowerCase().includes(normalizedQuery),
    );
  }, [multiselectOptions, search]);

  const selectedMultiselectValues = multiselectOptions.filter((option) =>
    activeSelectedIds.includes(option),
  );

  if (cellValue.type === MULTISELECT_COLUMN_TYPE) {
    return (
      <div
        ref={multiselectContainerRef}
        className={isFieldMode ? "relative" : "relative inline-block"}
      >
        <button
          type="button"
          className={
            isFieldMode
              ? "w-full rounded border px-2 py-1 text-left"
              : "min-w-32 rounded border px-2 py-1 text-left"
          }
          onClick={() => {
            if (isMultiselectOpen) {
              setIsMultiselectOpen(false);
              setDraftSelectedIds(null);
              setSearch("");
              return;
            }

            setDraftSelectedIds([...persistedSelectedIds]);
            setIsMultiselectOpen(true);
          }}
        >
          {selectedMultiselectValues.length === 0
            ? "Select options"
            : selectedMultiselectValues.join(", ")}
        </button>

        {isMultiselectOpen ? (
          <div
            className={
              isFieldMode
                ? "absolute left-0 right-0 top-full z-20 mt-1 rounded border bg-white p-2 shadow-lg"
                : "absolute left-0 top-full z-20 mt-1 w-64 rounded border bg-white p-2 shadow-lg"
            }
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search options"
              className="mb-2 w-full rounded border px-2 py-1"
            />

            <div className="mb-2 max-h-44 overflow-auto rounded border p-2">
              {filteredMultiselectOptions.length === 0 ? (
                <p className="text-sm text-gray-500">No options found.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {filteredMultiselectOptions.map((option) => (
                    <li key={option}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={activeSelectedIds.includes(option)}
                          onChange={() => toggleSelected(option)}
                        />
                        <span>{option}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between gap-2">
              <button
                type="button"
                className="rounded border px-2 py-1 text-sm"
                onClick={() => setDraftSelectedIds([])}
              >
                Clear
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-sm"
                  onClick={() => {
                    setIsMultiselectOpen(false);
                    setDraftSelectedIds(null);
                    setSearch("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-sm"
                  onClick={saveSelectedOptions}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (cellValue.type !== LINK_COLUMN_TYPE) {
    if (cellValue.type === "longtext" && isFieldMode) {
      return (
        <textarea
          id={inputId}
          value={renderedInputValue}
          onChange={(event) => updateValue(rowId, cellValue.id, event)}
          rows={isFieldMode ? 8 : 4}
          className={
            isFieldMode
              ? "w-full rounded border px-2 py-1"
              : "min-w-48 rounded border px-2 py-1"
          }
          suppressHydrationWarning={true}
        ></textarea>
      );
    }

    return (
      <input
        id={inputId}
        type={cellValue.type === NUMBER_COLUMN_TYPE ? "number" : "text"}
        step={cellValue.type === NUMBER_COLUMN_TYPE ? "any" : undefined}
        value={renderedInputValue}
        onChange={(event) => updateValue(rowId, cellValue.id, event)}
        className={
          isFieldMode
            ? "w-full rounded border px-2 py-1"
            : cellValue.type === "longtext"
              ? "w-full min-w-0 truncate"
              : undefined
        }
        title={cellValue.type === "longtext" ? renderedInputValue : undefined}
        suppressHydrationWarning={true}
      ></input>
    );
  }

  return (
    <>
      <button
        type="button"
        className={
          isFieldMode
            ? "w-full rounded border px-2 py-1 text-left"
            : "min-w-32 rounded border px-2 py-1 text-left"
        }
        onClick={() => {
          setDraftSelectedIds([...persistedSelectedIds]);
          setIsPickerOpen(true);
        }}
      >
        {selectedLabels.length === 0
          ? "Select links"
          : selectedLabels.slice(0, LINK_LABEL_PREVIEW_LIMIT).join(", ")}
        {selectedLabels.length > LINK_LABEL_PREVIEW_LIMIT
          ? ` (+${selectedLabels.length - LINK_LABEL_PREVIEW_LIMIT})`
          : ""}
      </button>

      {isPickerOpen ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-4 shadow-2xl">
            <h3 className="mb-3 text-base font-semibold">Select linked rows</h3>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rows"
              className="mb-3 w-full rounded border px-2 py-1"
            />

            <div className="mb-3 max-h-80 overflow-auto rounded border p-2">
              {filteredOptions.length === 0 ? (
                <p className="text-sm text-gray-500">No rows found.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {filteredOptions.map((option) => (
                    <li key={option.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={activeSelectedIds.includes(option.id)}
                          onChange={() => toggleSelected(option.id)}
                        />
                        <span>{option.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={() => setDraftSelectedIds([])}
              >
                Clear
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border px-3 py-1"
                  onClick={() => {
                    setIsPickerOpen(false);
                    setDraftSelectedIds(null);
                    setSearch("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded border px-3 py-1"
                  onClick={saveSelectedLinks}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function TablCell({
  rowId,
  cellValue,
  linkOptions,
  multiselectOptions,
  updateCell,
  className,
  overlayAction,
}: TableCellProps) {
  return (
    <td className={className}>
      {overlayAction ? (
        <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2">
          {overlayAction}
        </div>
      ) : null}

      <CellEditor
        rowId={rowId}
        cellValue={cellValue}
        linkOptions={linkOptions}
        multiselectOptions={multiselectOptions}
        updateCell={updateCell}
      />
    </td>
  );
}
