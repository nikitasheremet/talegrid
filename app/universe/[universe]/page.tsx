import Link from "next/link";

export default async function UniverseView({
  params,
}: {
  params: Promise<{ universe: string }>;
}) {
  const { universe } = await params;

  const universeTables = ["Books", "Characters", "Places", "Events"];

  return (
    <>
      <div className="flex flex-col items-center p-5 gap-5">
        <h1 className="text-xl">
          Welcome to <span className="font-bold">{universe}</span>
        </h1>
        <ul className="self-left">
          {universeTables.map((table) => {
            return (
              <li className="mb-5">
                <Link href={`/universe/${universe}/${table}`}>{table}</Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
