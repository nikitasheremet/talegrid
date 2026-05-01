"use client";

import { useState, type MouseEvent } from "react";
import {
  getUniverseNameValidationError,
  normalizeUniverseName,
} from "@/lib/table-utils";

export default function EditUniverseButton({
  universeId,
  universeName,
  onRename,
}: {
  universeId: string;
  universeName: string;
  onRename: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nextUniverseName, setNextUniverseName] = useState(universeName);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openRenameModal(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setNextUniverseName(universeName);
    setSubmitError("");
    setIsSubmitting(false);
    setIsModalOpen(true);
  }

  function closeRenameModal() {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setNextUniverseName(universeName);
    setSubmitError("");
  }

  async function handleRename(formData: FormData) {
    if (isSubmitting) return;

    const normalizedNextName = normalizeUniverseName(
      formData.get("nextUniverseName"),
    );
    const validationError = getUniverseNameValidationError(normalizedNextName);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await onRename(formData);
      if (result.error) {
        setSubmitError(result.error);
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      setIsSubmitting(false);
    } catch {
      setSubmitError("Could not rename universe. Please try again.");
      setIsSubmitting(false);
    }
  }

  const validationError = getUniverseNameValidationError(nextUniverseName);
  const isRenameDisabled = isSubmitting || Boolean(validationError);

  return (
    <>
      <button
        type="button"
        aria-label={`Rename universe ${universeName}`}
        title={`Rename ${universeName}`}
        className="pointer-events-none cursor-pointer rounded px-2 py-1 text-slate-500 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 hover:text-blue-700"
        onClick={openRenameModal}
        disabled={isSubmitting}
      >
        ✎
      </button>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeRenameModal}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold">Rename Universe</h2>
            <p className="mb-4 text-sm text-slate-700">
              Update the name for
              <span className="font-semibold"> {universeName}</span>.
            </p>

            <form action={handleRename} className="flex flex-col gap-4">
              <input type="hidden" name="universeId" value={universeId} />
              <input
                type="hidden"
                name="currentUniverseName"
                value={universeName}
              />

              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`nextUniverseName-${universeId}`}
                  className="text-sm font-medium"
                >
                  New Universe Name
                </label>
                <input
                  id={`nextUniverseName-${universeId}`}
                  name="nextUniverseName"
                  className="border rounded px-2 py-1"
                  value={nextUniverseName}
                  onChange={(event) => {
                    setNextUniverseName(event.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  required
                />
              </div>

              {submitError ? (
                <p className="text-sm text-red-600">{submitError}</p>
              ) : validationError ? (
                <p className="text-sm text-red-600">{validationError}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded border px-3 py-1 hover:cursor-pointer"
                  onClick={closeRenameModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded border px-3 py-1 disabled:opacity-60 hover:cursor-pointer"
                  disabled={isRenameDisabled}
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
