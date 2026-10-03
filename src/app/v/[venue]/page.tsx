import { requireVenue } from "@/lib/access";
import { Card } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";

export default async function TodayPage(props: PageProps<"/v/[venue]">) {
  const { venue: slug } = await props.params;
  const venue = await requireVenue(slug);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      <Card>
        <p className="font-medium">Checklists, handover and tasks for {venue.name} will appear here.</p>
        <p className="mt-1 text-sm text-muted">They arrive in the next build steps.</p>
      </Card>
      <SignOutButton />
    </div>
  );
}
