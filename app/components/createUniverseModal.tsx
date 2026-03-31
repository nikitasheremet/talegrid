"use client";

import { useRef, useState } from "react";
import { normalizeUniverseName } from "@/lib/table-utils";

export default function CreateUniverseModal({
  onCreate,
}: {
  onCreate: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [universeName, setUniverseName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function openModal() {
    setIsOpen(true);
    setSubmitError("");
  }

  function resetModalState() {
    setUniverseName("");
    setSubmitError("");
    setIsSubmitting(false);
    formRef.current?.reset();
  }

  function closeModal() {
    setIsOpen(false);
    resetModalState();
  }

  async function handleCreate(formData: FormData) {
    const normalizedName = normalizeUniverseName(formData.get("universeName"));
    if (!normalizedName || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await onCreate(formData);

      if (result.error) {
        setSubmitError(result.error);
        setIsSubmitting(false);
        return;
      }

      closeModal();
    } catch {
      setSubmitError("Could not create universe. Please try again.");
      setIsSubmitting(false);
    }
  }

  const isCreateDisabled = !normalizeUniverseName(universeName) || isSubmitting;

  return (
    <>
      <button
        type="button"
        className="border rounded px-3 py-1"
        onClick={openModal}
      >
        Create Universe
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">Create New Universe</h2>

            <form
              ref={formRef}
              action={handleCreate}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="universeName" className="text-sm font-medium">
                  Universe Name
                </label>
                <input
                  id="universeName"
                  name="universeName"
                  placeholder="My Story World"
                  className="border rounded px-2 py-1"
                  value={universeName}
                  onChange={(event) => {
                    setUniverseName(event.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  required
                />
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
                  {isSubmitting ? "Creating..." : "Create Universe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
