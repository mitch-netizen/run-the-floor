import Link from "next/link";
import { requireCapability } from "@/lib/access";
import { ActionForm } from "@/components/action-form";
import { ExpiryBadge } from "@/components/expiry-badge";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import { inviteMember } from "./actions";
import { loadPeople, worstExpiry } from "./data";

export default async function PeoplePage(props: PageProps<"/v/[venue]/admin/people">) {
  const { venue: slug } = await props.params;
  const venue = await requireCapability(slug, "users.manage");
  const { people, roles, departments } = await loadPeople(venue);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">People</h1>

      <ul className="flex flex-col gap-2">
        {people.map((p) => {
          const worst = worstExpiry(p);
          return (
            <li key={p.membershipId}>
              <Link href={`/v/${slug}/admin/people/${p.membershipId}`} className="block rounded-2xl border border-border bg-surface p-4 active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="truncate text-sm text-muted">{[p.roleName, p.departmentName].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {p.status === "suspended" && <Badge tone="danger">Suspended</Badge>}
                    {worst && (worst.status === "due" || worst.status === "expired") && <ExpiryBadge expiry={worst} />}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Invite someone</h2>
        <ActionForm action={inviteMember.bind(null, slug)}>
          {(pending) => (
            <>
              <Field label="Email"><Input name="email" type="email" required autoComplete="off" /></Field>
              <Field label="Name"><Input name="full_name" autoComplete="off" /></Field>
              <Field label="Role">
                <Select name="role_id" required defaultValue="">
                  <option value="" disabled>Choose a role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </Field>
              <Field label="Department">
                <Select name="department_id" defaultValue="">
                  <option value="">None</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </Field>
              <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send invitation"}</Button>
            </>
          )}
        </ActionForm>
      </Card>
    </div>
  );
}
