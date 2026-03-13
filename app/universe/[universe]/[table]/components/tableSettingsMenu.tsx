"use client";

import { useState } from "react";
import AddColumnModal from "./addColumnModal";

interface TableOption {
  id: string;
  name: string;
  columns: Array<{ name: string; type: string }>;
}

export default function TableSettingsMenu({
  onAddColumn,
  availableTables,
}: {
  onAddColumn: (formData: FormData) => Promise<void>;
  availableTables: TableOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="rounded border px-3 py-1"
          onClick={() => setIsOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          Settings
        </button>

        {isOpen ? (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-52 rounded border bg-white p-2 shadow-lg"
          >
            <button
              type="button"
              className="w-full rounded px-2 py-1 text-left hover:bg-slate-100"
              onClick={() => {
                setIsOpen(false);
                setIsAddColumnModalOpen(true);
              }}
            >
              Add column
            </button>

            <button
              type="button"
              className="mt-1 w-full cursor-not-allowed rounded px-2 py-1 text-left text-gray-400"
              disabled
              title="Coming soon"
            >
              Delete table (coming soon)
            </button>
          </div>
        ) : null}
      </div>

      <AddColumnModal
        onAddColumn={onAddColumn}
        availableTables={availableTables}
        showTrigger={false}
        isOpen={isAddColumnModalOpen}
        onOpenChange={setIsAddColumnModalOpen}
      />
    </>
  );
}
