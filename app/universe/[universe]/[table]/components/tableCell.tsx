"use client";

import { useMemo, useState } from "react";
import { LINK_COLUMN_TYPE } from "@/lib/table-utils";

const DEBOUNCE_TIMEOUT_MS = 1000;
const LINK_LABEL_PREVIEW_LIMIT = 3;
let debounceTimer: NodeJS.Timeout;

export default function TablCell({
  rowId,
  cellValue,
  linkOptions,
  updateCell,
}: {
  rowId: string;
  cellValue: {
    value: string | string[];
    id: string;
    type: string;
  };
  linkOptions: Array<{ id: string; label: string }>;
  updateCell: (
    rowId: string,
    attributeName: string,
    value: string | string[],
  ) => void;
}) {
  const [value, setCellValue] = useState(
    typeof cellValue.value === "string" ? cellValue.value : "",
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    Array.isArray(cellValue.value) ? cellValue.value : [],
  );

  function updateValue(
    currentRowId: string,
    cellId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    clearTimeout(debounceTimer);

    const nextValue = event.target.value;
    debounceTimer = setTimeout(() => {
      updateCell(currentRowId, cellId, nextValue);
    }, DEBOUNCE_TIMEOUT_MS);

    setCellValue(nextValue);
  }

  function toggleSelected(id: string) {
    setSelectedIds((currentIds) => {
      if (currentIds.includes(id)) {
        return currentIds.filter((currentId) => currentId !== id);
      }

      return [...currentIds, id];
    });
  }

  function saveSelectedLinks() {
    updateCell(rowId, cellValue.id, selectedIds);
    setIsPickerOpen(false);
  }

  const filteredOptions = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    if (!normalizedQuery) return linkOptions;

    return linkOptions.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [linkOptions, search]);

  const selectedLabels = useMemo(() => {
    const labelsById = new Map(
      linkOptions.map((option) => [option.id, option.label]),
    );
    return selectedIds.map((id) => labelsById.get(id) ?? id);
  }, [linkOptions, selectedIds]);

  if (cellValue.type !== LINK_COLUMN_TYPE) {
    return (
      <td>
        <input
          value={value}
          onChange={(event) => updateValue(rowId, cellValue.id, event)}
          suppressHydrationWarning={true}
        ></input>
      </td>
    );
  }

  return (
    <td>
      <button
        type="button"
        className="min-w-32 rounded border px-2 py-1 text-left"
        onClick={() => setIsPickerOpen(true)}
      >
        {selectedLabels.length === 0
          ? "Select links"
          : selectedLabels.slice(0, LINK_LABEL_PREVIEW_LIMIT).join(", ")}
        {selectedLabels.length > LINK_LABEL_PREVIEW_LIMIT
          ? ` (+${selectedLabels.length - LINK_LABEL_PREVIEW_LIMIT})`
          : ""}
      </button>

      {isPickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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
                          checked={selectedIds.includes(option.id)}
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
                onClick={() => setSelectedIds([])}
              >
                Clear
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border px-3 py-1"
                  onClick={() => setIsPickerOpen(false)}
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
    </td>
  );
}
