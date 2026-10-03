import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyVenues } from "@/lib/access";
import { Card } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";

export default async function Home() {
  const venues = await getMyVenues();
  if (venues.length === 1) redirect(`/v/${venues[0].slug}`);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Choose a venue</h1>
      {venues.length === 0 ? (
        <Card>
          <p className="font-medium">You don&apos;t have access to a venue yet.</p>
          <p className="mt-1 text-sm text-muted">Ask your venue manager to add you, then sign in again.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {venues.map((v) => (
            <li key={v.venueId}>
              <Link href={`/v/${v.slug}`} className="block rounded-2xl border border-border bg-surface p-4 active:scale-[0.99]">
                <span className="block text-lg font-semibold">{v.name}</span>
                <span className="text-sm text-muted">{v.roleName ?? (v.isGroupOwner ? "Group owner (read only)" : "")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <SignOutButton />
    </main>
  );
}
