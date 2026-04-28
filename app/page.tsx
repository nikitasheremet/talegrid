import Link from "next/link";
import { revalidatePath } from "next/cache";
import CreateUniverseModal from "@/app/components/createUniverseModal";
import DeleteUniverseButton from "@/app/components/deleteUniverseButton";
import {
  createUniverseIfNotExists,
  deleteUniverseByIdWithCascade,
  getAllUniverses,
} from "@/lib/queries";
import { normalizeUniverseName } from "@/lib/table-utils";

export default async function Home() {
  async function addUniverse(formData: FormData): Promise<{ error?: string }> {
    "use server";

    const universeName = normalizeUniverseName(formData.get("universeName"));
    if (!universeName) {
      return { error: "Universe name is required." };
    }

    const result = await createUniverseIfNotExists(universeName);
    if (!result.created) {
      return { error: "A universe with that name already exists." };
    }

    revalidatePath("/", "page");
    return {};
  }

  async function deleteUniverse(
    formData: FormData,
  ): Promise<{ error?: string }> {
    "use server";

    const universeIdValue = formData.get("universeId");
    const universeName = normalizeUniverseName(formData.get("universeName"));
    const universeId =
      typeof universeIdValue === "string" ? universeIdValue.trim() : "";

    if (!universeId || !universeName) {
      return { error: "Invalid universe selection." };
    }

    const result = await deleteUniverseByIdWithCascade(
      universeId,
      universeName,
    );
    if (!result.success) {
      return { error: result.error };
    }

    revalidatePath("/", "page");
    return {};
  }

  const universes = await getAllUniverses();

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl">Your Universes</h1>
      <CreateUniverseModal onCreate={addUniverse} />
      <ul>
        {universes.map((universe) => (
          <li
            key={universe._id.toString()}
            className="group my-4 rounded-md p-2 transition hover:bg-gray-100 focus-within:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <Link
                className="block grow rounded-sm"
                href={`/universe/${encodeURIComponent(universe.name)}`}
              >
                {universe.name}
              </Link>
              <DeleteUniverseButton
                universeId={universe._id.toString()}
                universeName={universe.name}
                onDelete={deleteUniverse}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
