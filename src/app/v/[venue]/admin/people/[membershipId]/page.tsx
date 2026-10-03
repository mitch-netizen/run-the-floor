import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCapability, requireUserId } from "@/lib/access";
import { ActionForm } from "@/components/action-form";
import { ExpiryBadge } from "@/components/expiry-badge";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import { addQualification, archiveQualification, setMemberStatus, updateMember } from "../actions";
import { loadPeople } from "../data";

export default async function PersonPage(props: PageProps<"/v/[venue]/admin/people/[membershipId]">) {
  const { venue: slug, membershipId } = await props.params;
  const venue = await requireCapability(slug, "users.manage");
  const [{ people, roles, departments, qualificationTypes }, me] = await Promise.all([loadPeople(venue), requireUserId()]);
  const person = people.find((p) => p.membershipId === membershipId);
  if (!person) notFound();
  const isMe = person.userId === me;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/v/${slug}/admin/people`} className="text-sm text-muted">← People</Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{person.name}</h1>
        <p className="text-sm text-muted">{person.email}</p>
        {person.status === "suspended" && <div className="mt-2"><Badge tone="danger">Suspended</Badge></div>}
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Role</h2>
        {isMe ? (
          <p className="text-sm text-muted">{person.roleName}. You can&apos;t change your own access; ask another admin.</p>
        ) : (
          <ActionForm action={updateMember.bind(null, slug, person.membershipId)}>
            {(pending) => (
              <>
                <Field label="Role">
                  <Select name="role_id" defaultValue={person.roleId}>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </Select>
                </Field>
                <Field label="Department">
                  <Select name="department_id" defaultValue={person.departmentId ?? ""}>
                    <option value="">None</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </Field>
                <Button type="submit" disabled={pending}>Save</Button>
              </>
            )}
          </ActionForm>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Licences and qualifications</h2>
        <ul className="mb-4 flex flex-col gap-2">
          {person.qualifications.length === 0 && <li className="text-sm text-muted">None recorded.</li>}
          {person.qualifications.map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="font-medium">{q.typeName}</p>
                <p className="text-xs text-muted">
                  {[q.number, q.expiresOn && `Expires ${new Date(`${q.expiresOn}T00:00:00`).toLocaleDateString("en-AU")}`].filter(Boolean).join(" · ") || "No details"}
                </p>
                <div className="mt-1"><ExpiryBadge expiry={q.expiry} /></div>
              </div>
              <ActionForm action={archiveQualification.bind(null, slug, q.id)} className="shrink-0">
                {(pending) => <Button type="submit" variant="ghost" className="text-sm text-muted" disabled={pending}>Remove</Button>}
              </ActionForm>
            </li>
          ))}
        </ul>
        <ActionForm action={addQualification.bind(null, slug, person.userId)}>
          {(pending) => (
            <>
              <Field label="Qualification">
                <Select name="qualification_type_id" required defaultValue="">
                  <option value="" disabled>Choose</option>
                  {qualificationTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </Field>
              <Field label="Number"><Input name="number" autoComplete="off" /></Field>
              <Field label="Expiry date" hint="Leave blank if it doesn't expire."><Input name="expires_on" type="date" /></Field>
              <Button type="submit" variant="secondary" disabled={pending}>Add qualification</Button>
            </>
          )}
        </ActionForm>
      </Card>

      {!isMe && (
        <Card>
          <h2 className="mb-1 text-lg font-semibold">Access</h2>
          {person.status === "active" ? (
            <ActionForm action={setMemberStatus.bind(null, slug, person.membershipId, "suspended")}>
              {(pending) => (
                <>
                  <p className="text-sm text-muted">Suspending blocks this venue immediately and signs them out on every device.</p>
                  <Button type="submit" variant="danger" disabled={pending}>Suspend access</Button>
                </>
              )}
            </ActionForm>
          ) : (
            <ActionForm action={setMemberStatus.bind(null, slug, person.membershipId, "active")}>
              {(pending) => <Button type="submit" disabled={pending}>Restore access</Button>}
            </ActionForm>
          )}
        </Card>
      )}
    </div>
  );
}
