import Link from "next/link";
import { revalidatePath } from "next/cache";
import CreateUniverseModal from "@/app/components/createUniverseModal";
import { createUniverseIfNotExists, getAllUniverses } from "@/lib/queries";
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

  const universes = await getAllUniverses();

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl">Your Universes</h1>
      <CreateUniverseModal onCreate={addUniverse} />
      <ul>
        {universes.map((universe) => (
          <li
            key={universe._id.toString()}
            className="my-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md"
          >
            <Link
              className="w-full block"
              href={`/universe/${encodeURIComponent(universe.name)}`}
            >
              {universe.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
