"use client";

import { useState, type MouseEvent } from "react";

export default function DeleteUniverseButton({
  universeId,
  universeName,
  onDelete,
}: {
  universeId: string;
  universeName: string;
  onDelete: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function openConfirmModal(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    if (isDeleting) return;
    setIsConfirmOpen(false);
  }

  async function handleDelete(formData: FormData) {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const result = await onDelete(formData);
      if (result.error) {
        alert(result.error);
        setIsDeleting(false);
        return;
      }

      setIsConfirmOpen(false);
      setIsDeleting(false);
    } catch {
      alert("Could not delete universe. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Delete universe ${universeName}`}
        title={`Delete ${universeName}`}
        className="pointer-events-none cursor-pointer rounded px-2 py-1 text-slate-500 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 hover:text-red-700"
        onClick={openConfirmModal}
        disabled={isDeleting}
      >
        🗑
      </button>

      {isConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeConfirmModal}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold">Delete Universe</h2>
            <p className="mb-4 text-sm text-slate-700">
              Delete <span className="font-semibold">{universeName}</span> and
              all its tables and rows? This cannot be undone.
            </p>

            <form action={handleDelete} className="flex flex-col gap-4">
              <input type="hidden" name="universeId" value={universeId} />
              <input type="hidden" name="universeName" value={universeName} />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded border px-3 py-1 hover:cursor-pointer"
                  onClick={closeConfirmModal}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded border px-3 py-1 text-red-700 disabled:opacity-60 hover:cursor-pointer"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Universe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleting ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-lg bg-white px-4 py-3 text-sm font-medium shadow-2xl">
            Deleting universe...
          </div>
        </div>
      ) : null}
    </>
  );
}
