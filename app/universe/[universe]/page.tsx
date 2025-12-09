export default async function UniverseView({
  params,
}: {
  params: Promise<{ universe: string }>;
}) {
  const { universe } = await params;

  return (
    <>
      <h1>Welcome to {universe}</h1>
    </>
  );
}
