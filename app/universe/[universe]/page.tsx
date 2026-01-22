import Link from "next/link";
import { getTablesByUniverseName } from "@/lib/queries";

export default async function UniverseView({
  params,
}: {
  params: Promise<{ universe: string }>;
}) {
  const { universe } = await params;
  const tables = await getTablesByUniverseName(universe);

  return (
    <>
      <div className="flex flex-col items-center p-5 gap-5">
        <h1 className="text-xl">
          Welcome to <span className="font-bold">{universe}</span>
        </h1>
        <ul className="self-left">
          {tables.map((table) => {
            return (
              <li key={table._id.toString()} className="mb-5">
                <Link href={`/universe/${universe}/${table.name}`}>
                  {table.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
