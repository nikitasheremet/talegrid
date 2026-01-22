import Link from "next/link";
import { getAllUniverses } from "@/lib/queries";

export default async function Home() {
  const universes = await getAllUniverses();

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl">Your Universes</h1>
      <ul>
        {universes.map((universe) => (
          <li
            key={universe._id.toString()}
            className="my-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md"
          >
            <Link className="w-full block" href={`universe/${universe.name}`}>
              {universe.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
