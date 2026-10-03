import "server-only";
import type { VenueAccess } from "@/lib/access";
import { expiryState, venueToday, type ExpiryState } from "@/lib/qualifications";
import { createClient } from "@/lib/supabase/server";

export type Person = {
  membershipId: string;
  userId: string;
  name: string;
  email: string | null;
  roleId: string;
  roleName: string;
  departmentId: string | null;
  departmentName: string | null;
  status: "active" | "suspended";
  qualifications: {
    id: string;
    typeName: string;
    number: string | null;
    expiresOn: string | null;
    expiry: ExpiryState;
  }[];
};

const severity = { expired: 3, due: 2, ok: 1, none: 0 } as const;

export function worstExpiry(p: Person): ExpiryState | null {
  return p.qualifications.map((q) => q.expiry).sort((a, b) => severity[b.status] - severity[a.status])[0] ?? null;
}

/** Everything the People screens need, read with the caller's client (RLS applies). */
export async function loadPeople(venue: VenueAccess) {
  const supabase = await createClient();
  const v = venue.venueId;
  const [members, roles, departments, qualTypes, quals, settings] = await Promise.all([
    supabase.from("memberships").select("id, user_id, role_id, department_id, status").eq("venue_id", v).is("archived_at", null),
    supabase.from("roles").select("id, name").eq("venue_id", v).is("archived_at", null).order("sort"),
    supabase.from("departments").select("id, name").eq("venue_id", v).is("archived_at", null).order("sort"),
    supabase.from("qualification_types").select("id, name, warn_days").eq("venue_id", v).is("archived_at", null).order("name"),
    supabase.from("staff_qualifications").select("id, user_id, qualification_type_id, number, expires_on").eq("venue_id", v).is("archived_at", null),
    supabase.from("venue_settings").select("timezone").eq("venue_id", v).single(),
  ]);
  for (const r of [members, roles, departments, qualTypes, quals]) if (r.error) throw r.error;

  const userIds = (members.data ?? []).map((m) => m.user_id);
  const profiles = userIds.length
    ? (await supabase.from("profiles").select("id, full_name, email").in("id", userIds)).data ?? []
    : [];

  const today = venueToday(settings.data?.timezone ?? "UTC");
  const byId = <T extends { id: string }>(rows: T[] | null) => new Map((rows ?? []).map((r) => [r.id, r]));
  const roleMap = byId(roles.data), deptMap = byId(departments.data), typeMap = byId(qualTypes.data), profileMap = byId(profiles);

  const people: Person[] = (members.data ?? []).map((m) => {
    const p = profileMap.get(m.user_id);
    return {
      membershipId: m.id,
      userId: m.user_id,
      name: p?.full_name || p?.email || "Unknown",
      email: p?.email ?? null,
      roleId: m.role_id,
      roleName: roleMap.get(m.role_id)?.name ?? "",
      departmentId: m.department_id,
      departmentName: m.department_id ? deptMap.get(m.department_id)?.name ?? null : null,
      status: m.status as Person["status"],
      qualifications: (quals.data ?? [])
        .filter((q) => q.user_id === m.user_id)
        .map((q) => {
          const type = typeMap.get(q.qualification_type_id);
          return {
            id: q.id,
            typeName: type?.name ?? "",
            number: q.number,
            expiresOn: q.expires_on,
            expiry: expiryState(q.expires_on, today, type?.warn_days ?? [60, 30]),
          };
        })
        .sort((a, b) => a.typeName.localeCompare(b.typeName)),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return { people, roles: roles.data ?? [], departments: departments.data ?? [], qualificationTypes: qualTypes.data ?? [] };
}
