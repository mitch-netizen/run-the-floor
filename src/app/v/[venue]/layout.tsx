import Link from "next/link";
import { can, getMyVenues, requireVenue } from "@/lib/access";

export default async function VenueLayout(props: LayoutProps<"/v/[venue]">) {
  const { venue: slug } = await props.params;
  const venue = await requireVenue(slug);
  const venueCount = (await getMyVenues()).length;

  const nav = [
    { href: `/v/${slug}`, label: "Today" },
    ...(can(venue, "users.manage") ? [{ href: `/v/${slug}/admin/people`, label: "People" }] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold leading-tight">{venue.name}</p>
            <p className="truncate text-xs text-muted">{venue.roleName ?? "Group owner (read only)"}</p>
          </div>
          {venueCount > 1 && (
            <Link href="/" className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium">Switch</Link>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4 pb-28">{props.children}</main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-2xl">
          {nav.map((n) => (
            <li key={n.href} className="flex-1">
              <Link href={n.href} className="flex min-h-14 items-center justify-center text-sm font-semibold">{n.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
