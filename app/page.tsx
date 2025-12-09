import Link from "next/link";

const listOfUniverses = ["WH40K", "Wheel of Time"];

export default function Home() {
  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl">Your Universes</h1>
      <ul>
        {listOfUniverses.map((universe) => (
          <li
            key={universe}
            className="my-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md"
          >
            <Link href={`universe/${universe}`}>{universe}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
